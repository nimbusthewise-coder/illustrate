/**
 * Core data types for illustrate.md
 * Following PRD sections 5.1, 5.2, and 5.3
 */

/**
 * Buffer Structure (PRD 5.1)
 * Canvas represented as parallel flat typed arrays.
 * Provides O(1) cell read/write.
 */
export interface Buffer {
  width: number;
  height: number;
  chars: Uint16Array;   // Unicode character codes
  fg: Uint32Array;      // Foreground colour (RGBA)
  bg: Uint32Array;      // Background colour (RGBA)
  flags: Uint8Array;    // Bold, italic, underline, etc.
}

/**
 * Layer Model (PRD 5.2)
 * Named, ordered buffer instances with positional offsets.
 */
export interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  x: number;       // Offset within root canvas
  y: number;
  buffer: Buffer;
}

/**
 * Canvas Document (PRD 5.3)
 */
export interface CanvasDocument {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: Layer[];
  designSystem: DesignSystem | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Design System placeholder (will be expanded in Phase 2b)
 */
export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  version: string;
}

/**
 * Cell index calculation helper
 * Cell index: row * width + col
 */
export function getCellIndex(row: number, col: number, width: number): number {
  return row * width + col;
}

/**
 * Point type for coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Line type
 */
export interface Line {
  start: Point;
  end: Point;
}

/**
 * Line direction enum
 */
export enum LineDirection {
  Horizontal,
  Vertical,
  DiagonalUp,    // /
  DiagonalDown   // \
}

/**
 * Line character set
 */
export interface LineChars {
  horizontal: string;
  vertical: string;
  diagonalUp: string;
  diagonalDown: string;
  cross: string;
}

/**
 * Default box-drawing characters for lines
 */
export const DEFAULT_LINE_CHARS: LineChars = {
  horizontal: '─',
  vertical: '│',
  diagonalUp: '/',
  diagonalDown: '\\',
  cross: '┼',
};
