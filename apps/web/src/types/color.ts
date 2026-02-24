/**
 * Color type definitions for the color picker and drawing functionality.
 */

/** RGB color representation */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/** HSV color representation (for color wheel) */
export interface HSV {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/** Color state for foreground/background */
export interface ColorState {
  foreground: string; // hex color
  background: string; // hex color
  recentColors: string[]; // array of recently used hex colors
}

/** Preset color palette */
export const PRESET_COLORS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ff8800', // Orange
  '#8800ff', // Purple
  '#00ff88', // Mint
  '#ff0088', // Pink
  '#888888', // Gray
  '#444444', // Dark Gray
  '#cccccc', // Light Gray
  '#880000', // Dark Red
] as const;

/** Maximum number of recent colors to track */
export const MAX_RECENT_COLORS = 10;
