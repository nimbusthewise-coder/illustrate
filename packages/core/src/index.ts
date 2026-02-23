/**
 * @illustrate.md/core
 * Core canvas data types and operations
 */

// Re-export everything from submodules
export * from './buffer.js';
export * from './editor.js';
export * from './tools.js';
export * from './tools/index.js'; // Tool implementations
export * from './types.js';
export * from './export.js';

// Keep legacy exports for backwards compatibility
export interface Buffer {
  width: number;
  height: number;
  chars: Uint16Array;   // Unicode character codes
  fg: Uint32Array;      // Foreground colour (RGBA)
  bg: Uint32Array;      // Background colour (RGBA)
  flags: Uint8Array;    // Bold, italic, underline, etc.
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
 * Get the index for a given row and column
 */
function getIndex(buffer: Buffer, row: number, col: number): number {
  if (row < 0 || row >= buffer.height || col < 0 || col >= buffer.width) {
    throw new Error(`Position out of bounds: (${row}, ${col})`);
  }
  return row * buffer.width + col;
}

/**
 * Set a character at a specific position
 */
export function setChar(buffer: Buffer, row: number, col: number, char: string | number): void {
  const index = getIndex(buffer, row, col);
  buffer.chars[index] = typeof char === 'number' ? char : char.charCodeAt(0);
}

/**
 * Get a character at a specific position
 */
export function getChar(buffer: Buffer, row: number, col: number): string {
  const index = getIndex(buffer, row, col);
  const charCode = buffer.chars[index];
  return charCode === 0 ? ' ' : String.fromCharCode(charCode);
}

/**
 * Fill entire buffer with a character
 */
export function fillBuffer(buffer: Buffer, char: string): void {
  const charCode = char.charCodeAt(0);
  for (let i = 0; i < buffer.chars.length; i++) {
    buffer.chars[i] = charCode;
  }
}

/**
 * Set foreground color at a position (RGBA as uint32)
 */
export function setForeground(buffer: Buffer, row: number, col: number, rgba: number): void {
  const index = getIndex(buffer, row, col);
  buffer.fg[index] = rgba;
}

/**
 * Set background color at a position (RGBA as uint32)
 */
export function setBackground(buffer: Buffer, row: number, col: number, rgba: number): void {
  const index = getIndex(buffer, row, col);
  buffer.bg[index] = rgba;
}

/**
 * Convert RGBA components to uint32
 */
export function rgbaToUint32(r: number, g: number, b: number, a: number = 255): number {
  return (r << 24) | (g << 16) | (b << 8) | a;
}

/**
 * Convert uint32 to RGBA components
 */
export function uint32ToRgba(rgba: number): { r: number; g: number; b: number; a: number } {
  return {
    r: (rgba >>> 24) & 0xff,
    g: (rgba >>> 16) & 0xff,
    b: (rgba >>> 8) & 0xff,
    a: rgba & 0xff,
  };
}

// Tool types
export type ToolType = 'select' | 'box' | 'line' | 'text' | 'fill' | 'eraser';

// Cursor state
export interface Cursor {
  visible: boolean;
  row: number;
  col: number;
}

// Tool state
export interface ToolState {
  activeTool: ToolType;
}

// Editor state
export interface EditorState {
  buffer: Buffer;
  cursor: Cursor | null;
  toolState: ToolState;
}

/**
 * Create initial editor state
 */
export function createEditorState(width: number, height: number): EditorState {
  return {
    buffer: createBuffer(width, height),
    cursor: null,
    toolState: {
      activeTool: 'select',
    },
  };
}

/**
 * Switch active tool
 */
export function switchTool(state: EditorState, tool: ToolType): EditorState {
  return {
    ...state,
    toolState: {
      ...state.toolState,
      activeTool: tool,
    },
  };
}

/**
 * Activate text cursor at position
 */
export function activateTextCursor(state: EditorState, col: number, row: number): EditorState {
  return {
    ...state,
    cursor: {
      visible: true,
      row,
      col,
    },
  };
}

/**
 * Move text cursor to new position
 */
export function moveTextCursor(state: EditorState, col: number, row: number): EditorState {
  if (!state.cursor) return state;
  
  return {
    ...state,
    cursor: {
      ...state.cursor,
      row,
      col,
    },
  };
}

/**
 * Deactivate text cursor
 */
export function deactivateTextCursor(state: EditorState): EditorState {
  return {
    ...state,
    cursor: null,
  };
}
