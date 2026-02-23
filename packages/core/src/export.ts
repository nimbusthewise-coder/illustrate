/**
 * Export functionality for F041: Plain ASCII text
 * 
 * Requirements from PRD:
 * - All visible layers composited
 * - Trailing whitespace trimmed
 * - Output matches canvas exactly
 * - Newline-delimited rows
 */

import { Buffer, Layer, CanvasDocument } from './types.js';
import { createBuffer, getChar } from './buffer.js';

/**
 * Composite multiple layers into a single buffer
 * Layers are composited in order; transparent/empty cells fall through
 */
export function compositeLayers(layers: Layer[], width: number, height: number): Buffer {
  const result = createBuffer(width, height);
  
  // Composite visible layers in order
  for (const layer of layers) {
    if (!layer.visible) {
      continue;
    }
    
    // Iterate through layer buffer and composite onto result
    for (let row = 0; row < layer.buffer.height; row++) {
      for (let col = 0; col < layer.buffer.width; col++) {
        const layerIndex = row * layer.buffer.width + col;
        const charCode = layer.buffer.chars[layerIndex];
        
        // Skip empty cells (they fall through to layer below)
        if (charCode === 0) {
          continue;
        }
        
        // Calculate position in result buffer (accounting for layer offset)
        const resultRow = row + layer.y;
        const resultCol = col + layer.x;
        
        // Bounds check
        if (resultRow < 0 || resultRow >= height || resultCol < 0 || resultCol >= width) {
          continue;
        }
        
        const resultIndex = resultRow * width + resultCol;
        
        // Write to result buffer
        result.chars[resultIndex] = charCode;
        result.fg[resultIndex] = layer.buffer.fg[layerIndex];
        result.bg[resultIndex] = layer.buffer.bg[layerIndex];
        result.flags[resultIndex] = layer.buffer.flags[layerIndex];
      }
    }
  }
  
  return result;
}

/**
 * Convert a buffer to plain ASCII text
 * Trailing whitespace trimmed per row
 */
export function bufferToPlainASCII(buffer: Buffer): string {
  const rows: string[] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    let line = '';
    
    for (let col = 0; col < buffer.width; col++) {
      const charCode = getChar(buffer, row, col);
      // Empty cells render as space
      const char = charCode === 0 ? ' ' : String.fromCharCode(charCode);
      line += char;
    }
    
    // Trim trailing whitespace
    line = line.trimEnd();
    rows.push(line);
  }
  
  return rows.join('\n');
}

/**
 * Export canvas document to plain ASCII text (F041)
 */
export function exportToPlainASCII(document: CanvasDocument): string {
  // Composite all visible layers
  const composited = compositeLayers(document.layers, document.width, document.height);
  
  // Convert to plain ASCII text
  return bufferToPlainASCII(composited);
}

/**
 * Export to markdown code block (F042)
 */
export function exportToMarkdown(document: CanvasDocument, language: string = 'ascii'): string {
  const ascii = exportToPlainASCII(document);
  return `\`\`\`${language}\n${ascii}\n\`\`\``;
}
