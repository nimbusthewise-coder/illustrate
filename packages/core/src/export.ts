/**
 * F041: Plain ASCII text export
 * 
 * Composites all visible layers, trims trailing whitespace,
 * and outputs newline-delimited rows that match the canvas exactly.
 */

import type { CanvasDocument, Buffer } from './types.js';
import { compositeLayers } from './layer.js';
import { getChar } from './buffer.js';

/**
 * Export buffer to plain ASCII text
 * - Each row is a string
 * - Trailing whitespace is trimmed from each row
 * - Rows are joined with newlines
 */
export function bufferToAscii(buffer: Buffer): string {
  const rows: string[] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    let rowStr = '';
    
    for (let col = 0; col < buffer.width; col++) {
      rowStr += getChar(buffer, row, col);
    }
    
    // Trim trailing whitespace from this row
    rows.push(rowStr.trimEnd());
  }
  
  // Join rows with newlines
  return rows.join('\n');
}

/**
 * F041: Export canvas document to plain ASCII text
 * 
 * @param document - The canvas document to export
 * @returns Plain ASCII text with all visible layers composited
 */
export function exportPlainAscii(document: CanvasDocument): string {
  // Composite all visible layers
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );
  
  // Convert to ASCII text with trailing whitespace trimmed
  return bufferToAscii(composited);
}

/**
 * Options for markdown export
 */
export interface MarkdownExportOptions {
  /** Language hint for code block (e.g., 'ascii', 'text', 'diagram') */
  language?: string;
  /** Optional title as markdown heading */
  title?: string;
  /** Heading level (1-6) for the title */
  headingLevel?: number;
  /** Include metadata comments (dimensions, layer count) */
  includeMetadata?: boolean;
}

/**
 * Escape backticks in text to prevent markdown formatting issues
 * @param text - Text that may contain backticks
 * @returns Text with backticks escaped
 */
function escapeBackticks(text: string): string {
  // Replace ` with \` to escape in markdown
  return text.replace(/`/g, '\\`');
}

/**
 * F042: Export canvas document as markdown code block
 * 
 * Wraps plain ASCII text in triple backticks with optional language hint.
 * Copy-ready for pasting into .md files.
 * 
 * @param document - The canvas document to export
 * @param languageHint - Optional language hint (e.g., 'ascii', 'text')
 * @returns Markdown code block with the ASCII diagram
 */
export function exportMarkdownCodeBlock(
  document: CanvasDocument,
  languageHint?: string
): string;

/**
 * F042: Export canvas document as markdown code block with options
 * 
 * Wraps plain ASCII text in triple backticks with configurable options.
 * Supports titles, metadata, and language hints.
 * 
 * @param document - The canvas document to export
 * @param options - Markdown export options or language hint
 * @returns Markdown formatted text with code block
 */
export function exportMarkdownCodeBlock(
  document: CanvasDocument,
  options?: MarkdownExportOptions
): string;

export function exportMarkdownCodeBlock(
  document: CanvasDocument,
  options?: string | MarkdownExportOptions
): string {
  const ascii = exportPlainAscii(document);
  
  // Handle legacy string parameter (languageHint)
  if (typeof options === 'string') {
    const lang = options || '';
    return `\`\`\`${lang}\n${ascii}\n\`\`\``;
  }
  
  // Handle options object
  const opts = options || {};
  const lang = opts.language || '';
  const parts: string[] = [];
  
  // Add title if provided
  if (opts.title) {
    const level = Math.max(1, Math.min(6, opts.headingLevel || 2));
    const heading = '#'.repeat(level);
    parts.push(`${heading} ${opts.title}`);
    parts.push(''); // Empty line after heading
  }
  
  // Add metadata comment if requested
  if (opts.includeMetadata) {
    const visibleLayers = document.layers.filter(l => l.visible);
    const metadata = `<!-- Canvas: ${document.width}×${document.height} | Layers: ${visibleLayers.length} -->`;
    parts.push(metadata);
    parts.push(''); // Empty line after metadata
  }
  
  // Add code block with ASCII content
  // Note: We don't escape backticks in the ASCII content because they should be
  // preserved as-is in the diagram. The triple backtick fence handles this.
  parts.push(`\`\`\`${lang}`);
  parts.push(ascii);
  parts.push('```');
  
  return parts.join('\n');
}

/**
 * Convert RGBA color to ANSI 24-bit color code
 * @param rgba - RGBA color as Uint32 (0xRRGGBBAA)
 * @param isForeground - Whether this is a foreground (true) or background (false) color
 * @returns ANSI escape sequence for 24-bit color
 */
function rgbaToAnsi(rgba: number, isForeground: boolean): string {
  // Extract RGB components (RGBA is stored as 0xRRGGBBAA)
  const r = (rgba >> 24) & 0xFF;
  const g = (rgba >> 16) & 0xFF;
  const b = (rgba >> 8) & 0xFF;
  const a = rgba & 0xFF;
  
  // If fully transparent, don't apply color
  if (a === 0) {
    return '';
  }
  
  // ANSI 24-bit color: \x1b[38;2;R;G;Bm (foreground) or \x1b[48;2;R;G;Bm (background)
  const code = isForeground ? 38 : 48;
  return `\x1b[${code};2;${r};${g};${b}m`;
}

/**
 * Check if a color should be considered "default" and not exported
 * Default colors are: fully transparent (alpha = 0) or white/transparent defaults from setChar
 * @param rgba - RGBA color as Uint32
 * @param isBackground - Whether this is a background color
 * @returns true if this is a default color that should be skipped
 */
function isDefaultColor(rgba: number, isBackground: boolean): boolean {
  const a = rgba & 0xFF;
  
  // Fully transparent - skip
  if (a === 0) {
    return true;
  }
  
  // For foreground: white (0xFFFFFFFF) is considered default
  if (!isBackground && rgba === 0xFFFFFFFF) {
    return true;
  }
  
  return false;
}

/**
 * F045: Export buffer to rich text with ANSI color codes
 * 
 * Includes color information as ANSI escape sequences for terminal display
 * or applications that support rich text with colors.
 * Only exports non-default colors to avoid cluttering output.
 * 
 * @param buffer - The buffer to export
 * @returns String with ANSI color codes
 */
export function bufferToAnsiText(buffer: Buffer): string {
  const rows: string[] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    let rowStr = '';
    let lastFg = 0;
    let lastBg = 0;
    let hasColors = false;
    
    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      const char = getChar(buffer, row, col);
      const fg = buffer.fg[index];
      const bg = buffer.bg[index];
      
      // Apply color codes if they changed and are not default
      let colorCodes = '';
      if (fg !== lastFg) {
        if (!isDefaultColor(fg, false)) {
          colorCodes += rgbaToAnsi(fg, true);
          hasColors = true;
        }
        lastFg = fg;
      }
      if (bg !== lastBg) {
        if (!isDefaultColor(bg, true)) {
          colorCodes += rgbaToAnsi(bg, false);
          hasColors = true;
        }
        lastBg = bg;
      }
      
      rowStr += colorCodes + char;
    }
    
    // Reset colors at end of line if any non-default colors were used
    if (hasColors) {
      rowStr += '\x1b[0m';
    }
    rows.push(rowStr.trimEnd());
  }
  
  return rows.join('\n');
}

/**
 * F045: Export canvas document to rich text with ANSI color codes
 * 
 * @param document - The canvas document to export
 * @returns Rich text with ANSI color codes
 */
export function exportAnsiText(document: CanvasDocument): string {
  // Composite all visible layers
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );
  
  return bufferToAnsiText(composited);
}
