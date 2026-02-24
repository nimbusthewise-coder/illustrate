/**
 * F030: SVG Render Endpoint
 * 
 * Converts ASCII diagrams to scalable vector graphics (SVG).
 * Uses monospace fonts to preserve character spacing and alignment.
 */

import type { Buffer, CanvasDocument } from '../types.js';
import { compositeLayers } from '../layer.js';
import { getChar } from '../buffer.js';

/**
 * Options for SVG rendering
 */
export interface SVGRenderOptions {
  /** Font family (must be monospace) */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
  /** Character width in pixels (derived from fontSize if not specified) */
  charWidth?: number;
  /** Character height in pixels (derived from fontSize if not specified) */
  charHeight?: number;
  /** Include colors from buffer (default: true) */
  includeColors?: boolean;
  /** Default foreground color (hex) when colors are not included */
  defaultForeground?: string;
  /** Default background color (hex) when colors are not included */
  defaultBackground?: string;
  /** Add padding around the diagram in pixels */
  padding?: number;
  /** Include XML declaration (default: true) */
  includeXmlDeclaration?: boolean;
  /** Custom CSS classes for styling */
  cssClasses?: string;
  /** Embed font as base64 (for standalone SVG) */
  embedFont?: boolean;
}

/**
 * Default SVG rendering options
 */
const DEFAULT_SVG_OPTIONS: Required<Omit<SVGRenderOptions, 'embedFont'>> = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 14,
  charWidth: 8.4, // ~0.6em for most monospace fonts
  charHeight: 18, // ~1.3em line height
  includeColors: true,
  defaultForeground: '#000000',
  defaultBackground: '#ffffff',
  padding: 16,
  includeXmlDeclaration: true,
  cssClasses: '',
};

/**
 * Convert RGBA color to hex string
 * @param rgba - RGBA color as Uint32 (0xRRGGBBAA)
 * @returns Hex color string (#RRGGBB or #RRGGBBAA with alpha)
 */
function rgbaToHex(rgba: number): string {
  const r = (rgba >> 24) & 0xFF;
  const g = (rgba >> 16) & 0xFF;
  const b = (rgba >> 8) & 0xFF;
  const a = rgba & 0xFF;
  
  // If fully opaque, return simple hex
  if (a === 255) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // Include alpha channel
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a.toString(16).padStart(2, '0')}`;
}

/**
 * Check if a color is the default/transparent color
 */
function isDefaultColor(rgba: number): boolean {
  const a = rgba & 0xFF;
  return a === 0; // Fully transparent
}

/**
 * Escape XML special characters in text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Render a buffer to SVG
 * 
 * @param buffer - The buffer to render
 * @param options - SVG rendering options
 * @returns SVG string
 */
export function bufferToSvg(buffer: Buffer, options: SVGRenderOptions = {}): string {
  const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
  
  const width = buffer.width * opts.charWidth + opts.padding * 2;
  const height = buffer.height * opts.charHeight + opts.padding * 2;
  
  const lines: string[] = [];
  
  // XML declaration
  if (opts.includeXmlDeclaration) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }
  
  // SVG opening tag
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}"` +
    (opts.cssClasses ? ` class="${opts.cssClasses}"` : '') +
    `>`
  );
  
  // Add style for text rendering
  lines.push('  <style>');
  lines.push('    text {');
  lines.push(`      font-family: ${opts.fontFamily};`);
  lines.push(`      font-size: ${opts.fontSize}px;`);
  lines.push('      white-space: pre;');
  lines.push('      dominant-baseline: text-before-edge;');
  lines.push('    }');
  lines.push('  </style>');
  
  // Background rectangle
  lines.push(
    `  <rect x="0" y="0" width="${width}" height="${height}" ` +
    `fill="${opts.defaultBackground}"/>`
  );
  
  // Content group with padding offset
  lines.push(`  <g transform="translate(${opts.padding}, ${opts.padding})">`);
  
  // Render each character
  for (let row = 0; row < buffer.height; row++) {
    const y = row * opts.charHeight;
    
    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      const char = getChar(buffer, row, col);
      const x = col * opts.charWidth;
      
      // Skip spaces unless there's a background color
      if (char === ' ' && !opts.includeColors) {
        continue;
      }
      
      const fg = buffer.fg[index];
      const bg = buffer.bg[index];
      
      // Render background if not default
      if (opts.includeColors && !isDefaultColor(bg)) {
        const bgColor = rgbaToHex(bg);
        lines.push(
          `    <rect x="${x}" y="${y}" ` +
          `width="${opts.charWidth}" height="${opts.charHeight}" ` +
          `fill="${bgColor}"/>`
        );
      }
      
      // Skip rendering space character
      if (char === ' ') {
        continue;
      }
      
      // Determine text color
      let textColor = opts.defaultForeground;
      if (opts.includeColors && !isDefaultColor(fg)) {
        textColor = rgbaToHex(fg);
      }
      
      // Render character
      const escapedChar = escapeXml(char);
      lines.push(
        `    <text x="${x}" y="${y}" fill="${textColor}">${escapedChar}</text>`
      );
    }
  }
  
  // Close content group
  lines.push('  </g>');
  
  // Close SVG
  lines.push('</svg>');
  
  return lines.join('\n');
}

/**
 * F030: Export canvas document to SVG
 * 
 * Composites all visible layers and renders as SVG.
 * 
 * @param document - The canvas document to export
 * @param options - SVG rendering options
 * @returns SVG string
 */
export function exportSvg(document: CanvasDocument, options: SVGRenderOptions = {}): string {
  // Composite all visible layers
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );
  
  return bufferToSvg(composited, options);
}

/**
 * Calculate appropriate dimensions for SVG based on buffer size and options
 */
export function calculateSvgDimensions(
  width: number,
  height: number,
  options: SVGRenderOptions = {}
): { width: number; height: number } {
  const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
  
  return {
    width: width * opts.charWidth + opts.padding * 2,
    height: height * opts.charHeight + opts.padding * 2,
  };
}
