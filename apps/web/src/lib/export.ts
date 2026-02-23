/**
 * Export utilities for illustrate.md
 * Handles compositing layers and exporting to various formats
 */

import { Buffer, Layer } from '@/types/canvas';

/**
 * Composite multiple buffers into a single buffer
 * Layers are composited in order, with transparent cells falling through
 */
export function compositeBuffers(layers: Layer[], width: number, height: number): Buffer {
  const result: Buffer = {
    width,
    height,
    chars: new Uint16Array(width * height),
    fg: new Uint32Array(width * height),
    bg: new Uint32Array(width * height),
    flags: new Uint8Array(width * height),
  };

  // Composite layers in order (respecting opacity)
  for (const layer of layers) {
    if (!layer.visible) continue;
    if (layer.opacity === 0) continue;

    const { buffer, x: offsetX, y: offsetY } = layer;

    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        const srcIndex = y * buffer.width + x;
        const dstX = x + offsetX;
        const dstY = y + offsetY;

        // Skip if out of bounds
        if (dstX < 0 || dstX >= width || dstY < 0 || dstY >= height) {
          continue;
        }

        const dstIndex = dstY * width + dstX;

        // Only copy non-empty cells (charCode > 0)
        if (buffer.chars[srcIndex] > 0) {
          result.chars[dstIndex] = buffer.chars[srcIndex];
          result.fg[dstIndex] = buffer.fg[srcIndex];
          result.bg[dstIndex] = buffer.bg[srcIndex];
          result.flags[dstIndex] = buffer.flags[srcIndex];
        }
      }
    }
  }

  return result;
}

/**
 * Convert a buffer to plain ASCII text
 * Empty cells are rendered as spaces
 */
export function bufferToPlainText(buffer: Buffer): string {
  const lines: string[] = [];

  for (let y = 0; y < buffer.height; y++) {
    let line = '';
    for (let x = 0; x < buffer.width; x++) {
      const index = y * buffer.width + x;
      const charCode = buffer.chars[index];
      
      if (charCode > 0) {
        line += String.fromCharCode(charCode);
      } else {
        line += ' ';
      }
    }
    
    // Trim trailing whitespace from each line
    lines.push(line.trimEnd());
  }

  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Convert a buffer to markdown code block format
 */
export function bufferToMarkdown(buffer: Buffer, language = 'ascii'): string {
  const plainText = bufferToPlainText(buffer);
  return `\`\`\`${language}\n${plainText}\n\`\`\``;
}

/**
 * Convert RGBA color to CSS rgba() string
 */
function rgbaToCSS(rgba: number): string {
  const r = (rgba >>> 24) & 0xFF;
  const g = (rgba >>> 16) & 0xFF;
  const b = (rgba >>> 8) & 0xFF;
  const a = (rgba & 0xFF) / 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Convert a buffer to HTML with inline styles (for rich clipboard)
 * Uses CSS variables for theming support
 */
export function bufferToHTML(buffer: Buffer): string {
  let html = '<pre style="font-family: monospace; line-height: 1.2; margin: 0;">';

  for (let y = 0; y < buffer.height; y++) {
    for (let x = 0; x < buffer.width; x++) {
      const index = y * buffer.width + x;
      const charCode = buffer.chars[index];
      const fg = buffer.fg[index];
      const bg = buffer.bg[index];
      
      let char = charCode > 0 ? String.fromCharCode(charCode) : ' ';
      
      // Escape HTML special characters
      if (char === '<') char = '&lt;';
      else if (char === '>') char = '&gt;';
      else if (char === '&') char = '&amp;';
      
      // Apply styles if color is set (non-zero)
      if (fg > 0 || bg > 0) {
        const styles: string[] = [];
        if (fg > 0) styles.push(`color: ${rgbaToCSS(fg)}`);
        if (bg > 0) styles.push(`background-color: ${rgbaToCSS(bg)}`);
        
        html += `<span style="${styles.join('; ')}">${char}</span>`;
      } else {
        html += char;
      }
    }
    
    // Add newline except for the last line
    if (y < buffer.height - 1) {
      html += '\n';
    }
  }

  html += '</pre>';
  return html;
}

/**
 * Export layers to plain ASCII text
 */
export function exportAsPlainText(layers: Layer[], width: number, height: number): string {
  const composited = compositeBuffers(layers, width, height);
  return bufferToPlainText(composited);
}

/**
 * Export layers to markdown code block
 */
export function exportAsMarkdown(layers: Layer[], width: number, height: number, language = 'ascii'): string {
  const composited = compositeBuffers(layers, width, height);
  return bufferToMarkdown(composited, language);
}

/**
 * Export layers to HTML (for rich clipboard)
 */
export function exportAsHTML(layers: Layer[], width: number, height: number): string {
  const composited = compositeBuffers(layers, width, height);
  return bufferToHTML(composited);
}
