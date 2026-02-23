/**
 * ASCII rendering utilities for F032: Plain ASCII text render endpoint.
 *
 * Handles reconstructing typed array buffers from JSON-serialized document data
 * and compositing layers into plain ASCII text output.
 */

/**
 * Reconstruct a typed array from JSON-serialized data.
 * When Uint16Array/Uint32Array/Uint8Array are serialized to JSON,
 * they become plain objects like {"0": 72, "1": 101, ...} or arrays [72, 101, ...].
 */
function reconstructTypedArray<T extends Uint16Array | Uint32Array | Uint8Array>(
  data: unknown,
  ArrayConstructor: new (length: number) => T,
  length: number,
): T {
  const result = new ArrayConstructor(length);
  if (!data) return result;

  if (Array.isArray(data)) {
    for (let i = 0; i < Math.min(data.length, length); i++) {
      result[i] = data[i] ?? 0;
    }
  } else if (typeof data === 'object') {
    const obj = data as Record<string, number>;
    for (const key of Object.keys(obj)) {
      const idx = parseInt(key, 10);
      if (!isNaN(idx) && idx >= 0 && idx < length) {
        result[idx] = obj[key] ?? 0;
      }
    }
  }

  return result;
}

/** Reconstructed buffer with real typed arrays. */
export interface ReconstructedBuffer {
  width: number;
  height: number;
  chars: Uint16Array;
  fg: Uint32Array;
  bg: Uint32Array;
  flags: Uint8Array;
}

/** Reconstructed layer ready for compositing. */
export interface ReconstructedLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  buffer: ReconstructedBuffer;
}

/**
 * Reconstruct a Buffer from its JSON-serialized form.
 */
function reconstructBuffer(data: unknown): ReconstructedBuffer | null {
  if (!data || typeof data !== 'object') return null;

  const buf = data as Record<string, unknown>;
  const width = typeof buf.width === 'number' ? buf.width : 0;
  const height = typeof buf.height === 'number' ? buf.height : 0;

  if (width <= 0 || height <= 0) return null;

  const size = width * height;
  return {
    width,
    height,
    chars: reconstructTypedArray(buf.chars, Uint16Array, size),
    fg: reconstructTypedArray(buf.fg, Uint32Array, size),
    bg: reconstructTypedArray(buf.bg, Uint32Array, size),
    flags: reconstructTypedArray(buf.flags, Uint8Array, size),
  };
}

/**
 * Reconstruct layers from JSON document data.
 */
export function reconstructLayers(data: unknown): ReconstructedLayer[] {
  if (!data || typeof data !== 'object') return [];

  const doc = data as Record<string, unknown>;
  const rawLayers = doc.layers;

  if (!Array.isArray(rawLayers)) return [];

  const layers: ReconstructedLayer[] = [];
  for (const raw of rawLayers) {
    if (!raw || typeof raw !== 'object') continue;

    const layer = raw as Record<string, unknown>;
    const buffer = reconstructBuffer(layer.buffer);
    if (!buffer) continue;

    layers.push({
      id: (layer.id as string) ?? '',
      name: (layer.name as string) ?? '',
      visible: layer.visible !== false, // default to visible
      locked: (layer.locked as boolean) ?? false,
      x: (layer.x as number) ?? 0,
      y: (layer.y as number) ?? 0,
      buffer,
    });
  }

  return layers;
}

/**
 * Composite layers and convert to plain ASCII text.
 * Trailing whitespace trimmed per row. Newline-delimited rows.
 */
export function renderToPlainASCII(
  layers: ReconstructedLayer[],
  width: number,
  height: number,
): string {
  // Create result buffer
  const chars = new Uint16Array(width * height);

  // Composite visible layers in order
  for (const layer of layers) {
    if (!layer.visible) continue;

    const buf = layer.buffer;
    for (let row = 0; row < buf.height; row++) {
      for (let col = 0; col < buf.width; col++) {
        const srcIdx = row * buf.width + col;
        const charCode = buf.chars[srcIdx];

        // Skip empty cells
        if (charCode === 0) continue;

        // Calculate position in result (with layer offset)
        const dstRow = row + layer.y;
        const dstCol = col + layer.x;

        // Bounds check
        if (dstRow < 0 || dstRow >= height || dstCol < 0 || dstCol >= width) continue;

        const dstIdx = dstRow * width + dstCol;
        chars[dstIdx] = charCode;
      }
    }
  }

  // Convert to plain text with trimmed trailing whitespace
  const rows: string[] = [];
  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const charCode = chars[row * width + col];
      line += charCode === 0 ? ' ' : String.fromCharCode(charCode);
    }
    rows.push(line.trimEnd());
  }

  return rows.join('\n');
}

/**
 * Main entry point: render a JSON document data blob to plain ASCII text.
 */
export function renderDocumentToASCII(
  data: unknown,
  width: number,
  height: number,
): string {
  const layers = reconstructLayers(data);
  return renderToPlainASCII(layers, width, height);
}
