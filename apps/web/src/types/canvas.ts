/**
 * Core canvas data types for illustrate.md
 * Based on PRD section 5
 */

export interface Buffer {
  width: number;
  height: number;
  chars: Uint16Array;   // Unicode character codes
  fg: Uint32Array;      // Foreground colour (RGBA)
  bg: Uint32Array;      // Background colour (RGBA)
  flags: Uint8Array;    // Bold, italic, underline, etc.
}

export type CompositeMode = 'normal' | 'multiply';

export interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  opacity: number;           // 0-100 percent
  compositeMode: CompositeMode;
  x: number;            // Offset within root canvas
  y: number;
  buffer: Buffer;
}

export interface CanvasDocument {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: Layer[];
  designSystemId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Create an empty buffer with given dimensions
 */
export function createBuffer(width: number, height: number): Buffer {
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
 * Generate a unique ID for layers
 */
export function generateLayerId(): string {
  return `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new layer with an empty buffer
 */
export function createLayer(name: string, width: number, height: number): Layer {
  return {
    id: generateLayerId(),
    name,
    parentId: null,
    visible: true,
    locked: false,
    opacity: 100,
    compositeMode: 'normal' as CompositeMode,
    x: 0,
    y: 0,
    buffer: createBuffer(width, height),
  };
}

/**
 * Set a character in the buffer at the given position
 */
export function setChar(buffer: Buffer, row: number, col: number, char: string): void {
  if (row < 0 || row >= buffer.height || col < 0 || col >= buffer.width) {
    return; // Out of bounds
  }
  const index = row * buffer.width + col;
  buffer.chars[index] = char.charCodeAt(0) || 0;
}

/**
 * Fill the entire buffer with a character
 */
export function fillBuffer(buffer: Buffer, char: string): void {
  const charCode = char.charCodeAt(0) || 0;
  for (let i = 0; i < buffer.chars.length; i++) {
    buffer.chars[i] = charCode;
  }
}
