/**
 * Buffer creation and manipulation utilities
 */

import type { Buffer } from './types.js';

/**
 * Create a new buffer with specified dimensions
 * All cells initialized to empty (char 0, transparent colors)
 * @param width - Width in characters (1-256)
 * @param height - Height in characters (1-256)
 * @throws Error if dimensions are out of range
 */
export function createBuffer(width: number, height: number): Buffer {
  // Enforce constraints per F001: minimum 1×1, maximum 256×256
  if (width < 1 || width > 256) {
    throw new Error('Width must be between 1 and 256');
  }
  if (height < 1 || height > 256) {
    throw new Error('Height must be between 1 and 256');
  }
  
  const size = width * height;
  
  return {
    width,
    height,
    chars: new Uint16Array(size),
    fg: new Uint32Array(size),
    bg: new Uint32Array(size),
    flags: new Uint8Array(size),
  };
}

/**
 * Get the index for a given row and column
 */
export function getIndex(width: number, row: number, col: number): number {
  return row * width + col;
}

/**
 * Check if a cell is empty (no character)
 */
export function isEmpty(buffer: Buffer, index: number): boolean {
  return buffer.chars[index] === 0;
}

/**
 * Set a character at a specific position
 */
export function setChar(
  buffer: Buffer,
  row: number,
  col: number,
  char: string,
  fg: number = 0xFFFFFFFF,
  bg: number = 0x00000000,
  flags: number = 0
): void {
  const index = getIndex(buffer.width, row, col);
  buffer.chars[index] = char.charCodeAt(0);
  buffer.fg[index] = fg;
  buffer.bg[index] = bg;
  buffer.flags[index] = flags;
}

/**
 * Get a character at a specific position
 */
export function getChar(buffer: Buffer, row: number, col: number): string {
  const index = getIndex(buffer.width, row, col);
  const charCode = buffer.chars[index];
  return charCode === 0 ? ' ' : String.fromCharCode(charCode);
}

/**
 * Get the foreground color at a specific position
 */
export function getForeground(buffer: Buffer, row: number, col: number): number {
  const index = getIndex(buffer.width, row, col);
  return buffer.fg[index];
}

/**
 * Get the background color at a specific position
 */
export function getBackground(buffer: Buffer, row: number, col: number): number {
  const index = getIndex(buffer.width, row, col);
  return buffer.bg[index];
}

/**
 * Clear a cell (set to empty)
 */
export function clearCell(buffer: Buffer, row: number, col: number): void {
  const index = getIndex(buffer.width, row, col);
  buffer.chars[index] = 0;
  buffer.fg[index] = 0;
  buffer.bg[index] = 0;
  buffer.flags[index] = 0;
}

/**
 * Clone a buffer
 */
export function cloneBuffer(buffer: Buffer): Buffer {
  return {
    width: buffer.width,
    height: buffer.height,
    chars: new Uint16Array(buffer.chars),
    fg: new Uint32Array(buffer.fg),
    bg: new Uint32Array(buffer.bg),
    flags: new Uint8Array(buffer.flags),
  };
}

/**
 * Resize a buffer to new dimensions
 * Content is preserved where it overlaps with the new size
 * @param buffer - The buffer to resize
 * @param newWidth - New width in characters (1-256)
 * @param newHeight - New height in characters (1-256)
 * @returns A new resized buffer
 */
export function resizeBuffer(buffer: Buffer, newWidth: number, newHeight: number): Buffer {
  const newBuffer = createBuffer(newWidth, newHeight);
  
  // Copy overlapping region
  const copyWidth = Math.min(buffer.width, newWidth);
  const copyHeight = Math.min(buffer.height, newHeight);
  
  for (let row = 0; row < copyHeight; row++) {
    for (let col = 0; col < copyWidth; col++) {
      const oldIndex = getIndex(buffer.width, row, col);
      const newIndex = getIndex(newWidth, row, col);
      
      newBuffer.chars[newIndex] = buffer.chars[oldIndex];
      newBuffer.fg[newIndex] = buffer.fg[oldIndex];
      newBuffer.bg[newIndex] = buffer.bg[oldIndex];
      newBuffer.flags[newIndex] = buffer.flags[oldIndex];
    }
  }
  
  return newBuffer;
}

/**
 * Deserialize a buffer from JSON
 * Converts plain arrays back to typed arrays
 * @param data - The parsed JSON data
 * @returns A proper Buffer with typed arrays
 */
export function deserializeBuffer(data: any): Buffer {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid buffer data');
  }
  
  const { width, height, chars, fg, bg, flags } = data;
  
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('Buffer width and height must be numbers');
  }
  
  return {
    width,
    height,
    chars: new Uint16Array(chars || []),
    fg: new Uint32Array(fg || []),
    bg: new Uint32Array(bg || []),
    flags: new Uint8Array(flags || []),
  };
}
