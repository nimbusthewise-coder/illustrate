import type { Layer } from './types.js';
import { createBuffer } from './buffer.js';

/**
 * Create a new layer
 */
export function createLayer(
  id: string,
  name: string,
  width: number,
  height: number,
  parentId: string | null = null
): Layer {
  return {
    id,
    name,
    parentId,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    buffer: createBuffer(width, height),
  };
}

/**
 * Composite multiple layers into a single buffer
 */
export function compositeLayers(layers: Layer[], width: number, height: number) {
  const result = createBuffer(width, height);
  
  for (const layer of layers) {
    if (!layer.visible) continue;
    
    // Composite this layer onto result
    for (let row = 0; row < layer.buffer.height; row++) {
      for (let col = 0; col < layer.buffer.width; col++) {
        const srcIndex = row * layer.buffer.width + col;
        const destCol = col + layer.x;
        const destRow = row + layer.y;
        
        // Check if destination is in bounds
        if (destCol < 0 || destCol >= width || destRow < 0 || destRow >= height) {
          continue;
        }
        
        const destIndex = destRow * width + destCol;
        
        // If cell has content (non-zero char or non-zero background), copy it
        const char = layer.buffer.chars[srcIndex];
        const bg = layer.buffer.bg[srcIndex];
        
        if (char !== 0 || bg !== 0) {
          result.chars[destIndex] = char;
          result.fg[destIndex] = layer.buffer.fg[srcIndex];
          result.bg[destIndex] = bg;
          result.flags[destIndex] = layer.buffer.flags[srcIndex];
        }
      }
    }
  }
  
  return result;
}
