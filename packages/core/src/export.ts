/**
 * F041: Plain ASCII text export
 * 
 * Composites all visible layers, trims trailing whitespace,
 * and outputs newline-delimited rows that match the canvas exactly.
 */

import type { CanvasDocument, Buffer, Component, Slot, ComponentRole } from './types.js';
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

// ============================================================
// F028: LLM-Readable Export Format with Semantic Annotations
// ============================================================

/**
 * A component instance placed on the canvas
 */
export interface ComponentInstance {
  componentId: string;
  name: string;
  role: ComponentRole;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slots: SlotInstance[];
  tags: string[];
}

/**
 * A slot instance with its current content
 */
export interface SlotInstance {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

/**
 * Spatial relationship between two components
 */
export interface SpatialRelationship {
  from: string;  // component name
  to: string;    // component name
  type: 'above' | 'below' | 'left-of' | 'right-of' | 'contains' | 'contained-by' | 'overlaps' | 'adjacent';
}

/**
 * Layer metadata for the export
 */
export interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Design system metadata for the export
 */
export interface DesignSystemInfo {
  name: string;
  version: string;
  componentCount: number;
  componentNames: string[];
}

/**
 * Complete semantic metadata
 */
export interface SemanticMetadata {
  layers: LayerInfo[];
  components: ComponentInstance[];
  relationships: SpatialRelationship[];
  designSystem: DesignSystemInfo | null;
}

/**
 * The top-level LLM export format
 */
export interface LLMExportFormat {
  version: string;
  format: 'illustrate-llm-v1';
  document: {
    id: string;
    title: string;
    width: number;
    height: number;
    tags: string[];
    createdAt: number;
    updatedAt: number;
  };
  ascii: string;
  metadata: SemanticMetadata;
}

/**
 * Calculate spatial relationships between component instances.
 * 
 * Determines how components relate to each other spatially:
 * - contains/contained-by: one fully inside another
 * - above/below/left-of/right-of: non-overlapping adjacency
 * - overlaps: partial overlap
 * - adjacent: close but not overlapping
 */
export function calculateSpatialRelationships(
  components: ComponentInstance[]
): SpatialRelationship[] {
  const relationships: SpatialRelationship[] = [];

  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const a = components[i];
      const b = components[j];

      const aRight = a.x + a.width;
      const aBottom = a.y + a.height;
      const bRight = b.x + b.width;
      const bBottom = b.y + b.height;

      // Check containment
      const aContainsB =
        a.x <= b.x && a.y <= b.y && aRight >= bRight && aBottom >= bBottom;
      const bContainsA =
        b.x <= a.x && b.y <= a.y && bRight >= aRight && bBottom >= aBottom;

      if (aContainsB) {
        relationships.push({ from: a.name, to: b.name, type: 'contains' });
        relationships.push({ from: b.name, to: a.name, type: 'contained-by' });
        continue;
      }
      if (bContainsA) {
        relationships.push({ from: b.name, to: a.name, type: 'contains' });
        relationships.push({ from: a.name, to: b.name, type: 'contained-by' });
        continue;
      }

      // Check overlap
      const overlapX = a.x < bRight && aRight > b.x;
      const overlapY = a.y < bBottom && aBottom > b.y;

      if (overlapX && overlapY) {
        relationships.push({ from: a.name, to: b.name, type: 'overlaps' });
        continue;
      }

      // Check adjacency (within 1 cell)
      const gapX = Math.max(0, Math.max(a.x - bRight, b.x - aRight));
      const gapY = Math.max(0, Math.max(a.y - bBottom, b.y - aBottom));

      if (gapX <= 1 && gapY <= 1) {
        // Determine primary direction
        const aCenterX = a.x + a.width / 2;
        const aCenterY = a.y + a.height / 2;
        const bCenterX = b.x + b.width / 2;
        const bCenterY = b.y + b.height / 2;

        const dx = bCenterX - aCenterX;
        const dy = bCenterY - aCenterY;

        if (Math.abs(dy) >= Math.abs(dx)) {
          if (dy > 0) {
            relationships.push({ from: a.name, to: b.name, type: 'above' });
            relationships.push({ from: b.name, to: a.name, type: 'below' });
          } else {
            relationships.push({ from: a.name, to: b.name, type: 'below' });
            relationships.push({ from: b.name, to: a.name, type: 'above' });
          }
        } else {
          if (dx > 0) {
            relationships.push({ from: a.name, to: b.name, type: 'left-of' });
            relationships.push({ from: b.name, to: a.name, type: 'right-of' });
          } else {
            relationships.push({ from: a.name, to: b.name, type: 'right-of' });
            relationships.push({ from: b.name, to: a.name, type: 'left-of' });
          }
        }
      }
    }
  }

  return relationships;
}

/**
 * Extract text content from a buffer region
 */
function extractSlotContent(
  buffer: Buffer,
  slotX: number,
  slotY: number,
  slotWidth: number,
  slotHeight: number
): string {
  const lines: string[] = [];
  for (let row = slotY; row < slotY + slotHeight && row < buffer.height; row++) {
    let line = '';
    for (let col = slotX; col < slotX + slotWidth && col < buffer.width; col++) {
      line += getChar(buffer, row, col);
    }
    lines.push(line.trimEnd());
  }
  return lines.join('\n').trim();
}

/**
 * Extract component instances from a document.
 * 
 * This inspects the document's design system and layers to find
 * placed component instances. Currently returns instances based on
 * the design system's component definitions.
 * 
 * Note: Full instance extraction requires F021 (Place Components).
 * This provides the structural framework.
 */
export function extractComponentInstances(
  document: CanvasDocument
): ComponentInstance[] {
  // Without F021's placement tracking, we return an empty array.
  // The structure is ready for when component placement is implemented.
  // When F021 lands, this function will scan layers for placed instances
  // and return their positions, roles, and slot contents.
  return [];
}

/**
 * F028: Export canvas document to LLM-readable JSON format
 * 
 * Produces a structured JSON object combining:
 * - Plain ASCII rendering of the canvas
 * - Semantic metadata (layers, components, relationships)
 * - Design system info
 * 
 * Designed to be round-trip parseable by LLMs like Claude.
 * 
 * @param document - The canvas document to export
 * @returns LLMExportFormat object
 */
export function exportLLMFormat(document: CanvasDocument): LLMExportFormat {
  const ascii = exportPlainAscii(document);

  const visibleLayers = document.layers.filter(l => l.visible);
  const layerInfos: LayerInfo[] = visibleLayers.map(l => ({
    id: l.id,
    name: l.name,
    visible: l.visible,
    locked: l.locked,
    x: l.x,
    y: l.y,
    width: l.buffer.width,
    height: l.buffer.height,
  }));

  const components = extractComponentInstances(document);
  const relationships = calculateSpatialRelationships(components);

  let designSystemInfo: DesignSystemInfo | null = null;
  if (document.designSystem) {
    designSystemInfo = {
      name: document.designSystem.name,
      version: document.designSystem.version,
      componentCount: document.designSystem.components.length,
      componentNames: document.designSystem.components.map(c => c.name),
    };
  }

  return {
    version: '1.0.0',
    format: 'illustrate-llm-v1',
    document: {
      id: document.id,
      title: document.title,
      width: document.width,
      height: document.height,
      tags: document.tags,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    },
    ascii,
    metadata: {
      layers: layerInfos,
      components,
      relationships,
      designSystem: designSystemInfo,
    },
  };
}

/**
 * F028: Export canvas document to LLM-readable text/markdown format
 * 
 * Produces a human-readable markdown document combining:
 * - YAML-like header with document metadata
 * - ASCII rendering in a code block
 * - Semantic annotations section
 * 
 * Optimized for LLM consumption: structured enough to parse,
 * readable enough for humans.
 * 
 * @param document - The canvas document to export
 * @returns Markdown-formatted string with semantic annotations
 */
export function exportLLMFormatAsText(document: CanvasDocument): string {
  const data = exportLLMFormat(document);
  const parts: string[] = [];

  // Header
  parts.push('# illustrate.md — LLM Export');
  parts.push('');
  parts.push(`**Format:** ${data.format}`);
  parts.push(`**Version:** ${data.version}`);
  parts.push('');

  // Document info
  parts.push('## Document');
  parts.push('');
  parts.push(`- **Title:** ${data.document.title}`);
  parts.push(`- **Size:** ${data.document.width}×${data.document.height}`);
  if (data.document.tags.length > 0) {
    parts.push(`- **Tags:** ${data.document.tags.join(', ')}`);
  }
  parts.push('');

  // Design system
  if (data.metadata.designSystem) {
    const ds = data.metadata.designSystem;
    parts.push('## Design System');
    parts.push('');
    parts.push(`- **Name:** ${ds.name}`);
    parts.push(`- **Version:** ${ds.version}`);
    parts.push(`- **Components:** ${ds.componentCount}`);
    if (ds.componentNames.length > 0) {
      parts.push(`- **Available:** ${ds.componentNames.join(', ')}`);
    }
    parts.push('');
  }

  // ASCII diagram
  parts.push('## Diagram');
  parts.push('');
  parts.push('```text');
  parts.push(data.ascii);
  parts.push('```');
  parts.push('');

  // Layers
  if (data.metadata.layers.length > 0) {
    parts.push('## Layers');
    parts.push('');
    for (const layer of data.metadata.layers) {
      const lockIndicator = layer.locked ? ' 🔒' : '';
      parts.push(`- **${layer.name}**${lockIndicator} — ${layer.width}×${layer.height} at (${layer.x}, ${layer.y})`);
    }
    parts.push('');
  }

  // Components
  if (data.metadata.components.length > 0) {
    parts.push('## Components');
    parts.push('');
    for (const comp of data.metadata.components) {
      parts.push(`### ${comp.name} (${comp.role})`);
      parts.push('');
      if (comp.description) {
        parts.push(comp.description);
        parts.push('');
      }
      parts.push(`- **Position:** (${comp.x}, ${comp.y})`);
      parts.push(`- **Size:** ${comp.width}×${comp.height}`);
      if (comp.tags.length > 0) {
        parts.push(`- **Tags:** ${comp.tags.join(', ')}`);
      }
      if (comp.slots.length > 0) {
        parts.push('- **Slots:**');
        for (const slot of comp.slots) {
          const content = slot.content || '(empty)';
          parts.push(`  - \`${slot.name}\`: "${content}"`);
        }
      }
      parts.push('');
    }
  }

  // Relationships
  if (data.metadata.relationships.length > 0) {
    parts.push('## Spatial Relationships');
    parts.push('');
    for (const rel of data.metadata.relationships) {
      parts.push(`- **${rel.from}** → *${rel.type}* → **${rel.to}**`);
    }
    parts.push('');
  }

  // Footer
  parts.push('---');
  parts.push(`*Exported from illustrate.md | ${data.document.width}×${data.document.height} canvas | ${data.metadata.layers.length} layer(s)*`);

  return parts.join('\n');
}
