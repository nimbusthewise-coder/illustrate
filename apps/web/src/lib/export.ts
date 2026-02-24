/**
 * ASCII Export Utilities — F041: Plain ASCII Text Export
 * 
 * Composites visible layers and exports to plain ASCII text.
 * Per PRD §5.1–5.3 and F041 acceptance criteria.
 */

import type { Layer, Buffer } from './types';

/**
 * Composite all visible layers into a single buffer.
 * Layers are rendered in order; transparent cells fall through.
 * 
 * @param layers - Array of layers to composite (in order)
 * @param width - Canvas width in characters
 * @param height - Canvas height in characters
 * @returns Composited buffer
 */
export function compositeLayers(
  layers: Layer[],
  width: number,
  height: number
): Buffer {
  // Initialize empty buffer
  const composited: Buffer = {
    width,
    height,
    chars: new Array(width * height).fill(' '),
    fg: new Array(width * height).fill(''),
    bg: new Array(width * height).fill(''),
    flags: new Array(width * height).fill(0),
  };

  // Process only visible layers, in order
  const visibleLayers = layers.filter((layer) => layer.visible);

  for (const layer of visibleLayers) {
    const { buffer, x: offsetX, y: offsetY } = layer;

    // Iterate through layer buffer cells
    for (let row = 0; row < buffer.height; row++) {
      for (let col = 0; col < buffer.width; col++) {
        const sourceIndex = row * buffer.width + col;
        const sourceChar = buffer.chars[sourceIndex];

        // Skip empty/transparent cells (space character with no background)
        const hasBg = buffer.bg[sourceIndex] && buffer.bg[sourceIndex] !== '' && buffer.bg[sourceIndex] !== 'transparent';
        if (!sourceChar || (sourceChar === ' ' && !hasBg)) {
          continue;
        }

        // Calculate destination position in composited buffer
        const destRow = row + offsetY;
        const destCol = col + offsetX;

        // Skip if out of canvas bounds
        if (
          destRow < 0 ||
          destRow >= height ||
          destCol < 0 ||
          destCol >= width
        ) {
          continue;
        }

        const destIndex = destRow * width + destCol;

        // Write cell to composited buffer
        composited.chars[destIndex] = sourceChar;
        composited.fg[destIndex] = buffer.fg[sourceIndex];
        composited.bg[destIndex] = buffer.bg[sourceIndex];
        composited.flags[destIndex] = buffer.flags[sourceIndex];
      }
    }
  }

  return composited;
}

/**
 * Export buffer to plain ASCII text.
 * Trailing whitespace is trimmed from each row per F041 AC.
 * 
 * @param buffer - Composited buffer to export
 * @returns Newline-delimited ASCII text
 */
export function exportToAscii(buffer: Buffer): string {
  const rows: string[] = [];

  for (let row = 0; row < buffer.height; row++) {
    let line = '';
    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      line += buffer.chars[index] || ' ';
    }
    // Trim trailing whitespace per F041 AC
    rows.push(line.trimEnd());
  }

  // Join with newlines per F041 AC
  return rows.join('\n');
}

/**
 * Export visible layers to plain ASCII text.
 * Convenience function that composites and exports in one call.
 * 
 * @param layers - Array of layers to export
 * @param width - Canvas width in characters
 * @param height - Canvas height in characters
 * @returns Newline-delimited ASCII text
 */
export function exportLayersToAscii(
  layers: Layer[],
  width: number,
  height: number
): string {
  const composited = compositeLayers(layers, width, height);
  return exportToAscii(composited);
}
