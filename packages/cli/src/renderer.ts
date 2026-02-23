/**
 * Terminal renderer for illustrate.md diagrams
 * 
 * Features:
 * - Box-drawing character rendering
 * - ANSI color support with graceful fallback
 * - Terminal capability detection
 * 
 * Requirements from F054:
 * - Render with box-drawing chars and colour
 * - Graceful fallback for unsupported terminals
 */

import { Buffer, CanvasDocument } from '@illustrate.md/core';
import { compositeLayers } from '@illustrate.md/core';
import chalk from 'chalk';
import supportsColor from 'supports-color';

/**
 * Terminal color capability levels
 */
export enum ColorLevel {
  None = 0,      // No color support (1-bit)
  Basic = 1,     // 16 colors
  Ansi256 = 2,   // 256 colors
  TrueColor = 3  // 16 million colors (24-bit)
}

/**
 * Detect terminal color capability
 */
export function detectColorLevel(): ColorLevel {
  const support = supportsColor.stdout;
  
  if (!support) {
    return ColorLevel.None;
  }
  
  if (support.has16m) {
    return ColorLevel.TrueColor;
  }
  
  if (support.has256) {
    return ColorLevel.Ansi256;
  }
  
  return ColorLevel.Basic;
}

/**
 * Convert RGBA to ANSI foreground color escape code
 * @param rgba - 32-bit RGBA color value
 * @param colorLevel - Terminal color capability
 * @returns ANSI escape code or null if no color
 */
function rgbaToAnsiFg(rgba: number, colorLevel: ColorLevel): string | null {
  if (colorLevel === ColorLevel.None) {
    return null;
  }
  
  // Extract RGBA components (stored as RGBA)
  const r = (rgba >> 24) & 0xFF;
  const g = (rgba >> 16) & 0xFF;
  const b = (rgba >> 8) & 0xFF;
  const a = rgba & 0xFF;
  
  // Fully transparent = no color
  if (a === 0) {
    return null;
  }
  
  if (colorLevel === ColorLevel.TrueColor) {
    // 24-bit truecolor: ESC[38;2;r;g;bm
    return `\x1b[38;2;${r};${g};${b}m`;
  }
  
  if (colorLevel === ColorLevel.Ansi256) {
    // Convert RGB to ANSI 256 color
    // Use standard 216-color cube (6x6x6)
    const r6 = Math.round(r / 255 * 5);
    const g6 = Math.round(g / 255 * 5);
    const b6 = Math.round(b / 255 * 5);
    const code = 16 + (36 * r6) + (6 * g6) + b6;
    return `\x1b[38;5;${code}m`;
  }
  
  // Basic 16 colors - map to nearest basic color
  // Simple brightness-based mapping
  const brightness = (r + g + b) / 3;
  
  if (brightness < 64) return '\x1b[30m';  // Black
  if (brightness > 192) return '\x1b[37m'; // White
  
  // Map to dominant color
  if (r > g && r > b) return '\x1b[31m'; // Red
  if (g > r && g > b) return '\x1b[32m'; // Green
  if (b > r && b > g) return '\x1b[34m'; // Blue
  
  return '\x1b[37m'; // Default to white
}

/**
 * Convert RGBA to ANSI background color escape code
 * @param rgba - 32-bit RGBA color value
 * @param colorLevel - Terminal color capability
 * @returns ANSI escape code or null if no color
 */
function rgbaToAnsiBg(rgba: number, colorLevel: ColorLevel): string | null {
  if (colorLevel === ColorLevel.None) {
    return null;
  }
  
  // Extract RGBA components (stored as RGBA)
  const r = (rgba >> 24) & 0xFF;
  const g = (rgba >> 16) & 0xFF;
  const b = (rgba >> 8) & 0xFF;
  const a = rgba & 0xFF;
  
  // Fully transparent = no color
  if (a === 0) {
    return null;
  }
  
  if (colorLevel === ColorLevel.TrueColor) {
    // 24-bit truecolor: ESC[48;2;r;g;bm
    return `\x1b[48;2;${r};${g};${b}m`;
  }
  
  if (colorLevel === ColorLevel.Ansi256) {
    // Convert RGB to ANSI 256 color
    // Use standard 216-color cube (6x6x6)
    const r6 = Math.round(r / 255 * 5);
    const g6 = Math.round(g / 255 * 5);
    const b6 = Math.round(b / 255 * 5);
    const code = 16 + (36 * r6) + (6 * g6) + b6;
    return `\x1b[48;5;${code}m`;
  }
  
  // Basic 16 colors - map to nearest basic color
  // Simple brightness-based mapping
  const brightness = (r + g + b) / 3;
  
  if (brightness < 64) return '\x1b[40m';  // Black
  if (brightness > 192) return '\x1b[47m'; // White
  
  // Map to dominant color
  if (r > g && r > b) return '\x1b[41m'; // Red
  if (g > r && g > b) return '\x1b[42m'; // Green
  if (b > r && b > g) return '\x1b[44m'; // Blue
  
  return '\x1b[47m'; // Default to white
}

/**
 * Render buffer cell with ANSI colors
 */
function renderCell(
  charCode: number,
  fgColor: number,
  bgColor: number,
  colorLevel: ColorLevel
): string {
  // Empty cell renders as space
  const char = charCode === 0 ? ' ' : String.fromCharCode(charCode);
  
  // No color support - plain text
  if (colorLevel === ColorLevel.None) {
    return char;
  }
  
  // Get ANSI color codes
  const fg = rgbaToAnsiFg(fgColor, colorLevel);
  const bg = rgbaToAnsiBg(bgColor, colorLevel);
  
  // Apply colors if available
  let result = '';
  
  if (fg) {
    result += fg;
  }
  
  if (bg) {
    result += bg;
  }
  
  result += char;
  
  // Reset colors after character
  if (fg || bg) {
    result += '\x1b[0m';
  }
  
  return result || char;
}

/**
 * Render a buffer to terminal output
 * @param buffer - Buffer to render
 * @param colorLevel - Optional color level override (auto-detect if not provided)
 * @returns Terminal-ready string with ANSI codes
 */
export function renderBuffer(buffer: Buffer, colorLevel?: ColorLevel): string {
  const level = colorLevel ?? detectColorLevel();
  const rows: string[] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    let line = '';
    
    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      const charCode = buffer.chars[index];
      const fg = buffer.fg[index];
      const bg = buffer.bg[index];
      
      line += renderCell(charCode, fg, bg, level);
    }
    
    // Trim trailing whitespace (but preserve ANSI codes)
    line = line.replace(/(\s|\x1b\[[0-9;]+m)+$/, '');
    rows.push(line);
  }
  
  return rows.join('\n');
}

/**
 * Render a canvas document to terminal output (F054)
 * @param document - Canvas document to render
 * @param colorLevel - Optional color level override
 * @returns Terminal-ready string with ANSI codes
 */
export function renderDocument(document: CanvasDocument, colorLevel?: ColorLevel): string {
  // Composite all visible layers
  const composited = compositeLayers(document.layers, document.width, document.height);
  
  // Render to terminal
  return renderBuffer(composited, colorLevel);
}

/**
 * Render with frame (title + border)
 * @param document - Canvas document to render
 * @param showTitle - Whether to show title bar
 * @param colorLevel - Optional color level override
 */
export function renderDocumentWithFrame(
  document: CanvasDocument,
  showTitle: boolean = true,
  colorLevel?: ColorLevel
): string {
  const content = renderDocument(document, colorLevel);
  
  if (!showTitle) {
    return content;
  }
  
  const level = colorLevel ?? detectColorLevel();
  const width = Math.max(document.width, document.title.length + 4);
  
  // Top border
  const topBorder = '┌' + '─'.repeat(width) + '┐';
  
  // Title bar
  const titlePadding = ' '.repeat(Math.max(0, width - document.title.length - 2));
  const titleBar = `│ ${document.title}${titlePadding} │`;
  
  // Separator
  const separator = '├' + '─'.repeat(width) + '┤';
  
  // Bottom border
  const bottomBorder = '└' + '─'.repeat(width) + '┘';
  
  // Colorize frame if supported
  let frame = [topBorder, titleBar, separator].join('\n');
  
  if (level !== ColorLevel.None) {
    frame = chalk.dim(frame);
  }
  
  let bottom = bottomBorder;
  if (level !== ColorLevel.None) {
    bottom = chalk.dim(bottom);
  }
  
  return frame + '\n' + content + '\n' + bottom;
}
