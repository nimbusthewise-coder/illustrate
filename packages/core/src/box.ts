/**
 * Box/Rectangle drawing tool implementation
 * F006: Box tool for creating rectangular shapes
 */

import type { Buffer } from './types.js';
import { getChar, setChar } from './buffer.js';

/**
 * Box drawing characters (single-line style)
 */
export const BOX_CHARS = {
  // Corners
  TOP_LEFT: '┌',
  TOP_RIGHT: '┐',
  BOTTOM_LEFT: '└',
  BOTTOM_RIGHT: '┘',
  
  // Lines
  HORIZONTAL: '─',
  VERTICAL: '│',
  
  // Filled
  FILL: '█',
} as const;

/**
 * Box style options
 */
export type BoxStyle = 'outline' | 'filled';

/**
 * Point in grid coordinates (row, col)
 */
interface Point {
  row: number;
  col: number;
}

/**
 * Normalize start and end points to get top-left and dimensions
 */
function normalizeBox(start: Point, end: Point): {
  topRow: number;
  leftCol: number;
  width: number;
  height: number;
} {
  const topRow = Math.min(start.row, end.row);
  const bottomRow = Math.max(start.row, end.row);
  const leftCol = Math.min(start.col, end.col);
  const rightCol = Math.max(start.col, end.col);
  
  return {
    topRow,
    leftCol,
    width: rightCol - leftCol + 1,
    height: bottomRow - topRow + 1,
  };
}

/**
 * Draw a box/rectangle from start to end point
 * @param buffer - The buffer to draw on
 * @param start - Starting corner point
 * @param end - Ending corner point (opposite corner)
 * @param style - Box style (outline or filled)
 * @param fg - Foreground color (default: white)
 * @param bg - Background color (default: transparent)
 */
export function drawBox(
  buffer: Buffer,
  start: Point,
  end: Point,
  style: BoxStyle = 'outline',
  fg: number = 0xFFFFFFFF,
  bg: number = 0x00000000
): void {
  const { topRow, leftCol, width, height } = normalizeBox(start, end);
  
  if (style === 'filled') {
    // Draw filled rectangle
    for (let row = topRow; row < topRow + height; row++) {
      for (let col = leftCol; col < leftCol + width; col++) {
        if (row >= 0 && row < buffer.height && col >= 0 && col < buffer.width) {
          setChar(buffer, row, col, BOX_CHARS.FILL, fg, bg);
        }
      }
    }
  } else {
    // Draw outline
    for (let row = topRow; row < topRow + height; row++) {
      for (let col = leftCol; col < leftCol + width; col++) {
        if (row < 0 || row >= buffer.height || col < 0 || col >= buffer.width) {
          continue;
        }
        
        // Determine which character to use
        let char: string;
        
        // Corners
        if (row === topRow && col === leftCol) {
          char = BOX_CHARS.TOP_LEFT;
        } else if (row === topRow && col === leftCol + width - 1) {
          char = BOX_CHARS.TOP_RIGHT;
        } else if (row === topRow + height - 1 && col === leftCol) {
          char = BOX_CHARS.BOTTOM_LEFT;
        } else if (row === topRow + height - 1 && col === leftCol + width - 1) {
          char = BOX_CHARS.BOTTOM_RIGHT;
        }
        // Top and bottom edges
        else if (row === topRow || row === topRow + height - 1) {
          char = BOX_CHARS.HORIZONTAL;
        }
        // Left and right edges
        else if (col === leftCol || col === leftCol + width - 1) {
          char = BOX_CHARS.VERTICAL;
        }
        // Interior (skip for outline)
        else {
          continue;
        }
        
        setChar(buffer, row, col, char, fg, bg);
      }
    }
  }
}

/**
 * Get points along a box outline (for preview)
 * @param start - Starting corner point
 * @param end - Ending corner point
 * @param style - Box style (outline or filled)
 * @returns Array of points that make up the box
 */
export function getBoxPoints(start: Point, end: Point, style: BoxStyle = 'outline'): Point[] {
  const points: Point[] = [];
  const { topRow, leftCol, width, height } = normalizeBox(start, end);
  
  if (style === 'filled') {
    // All points in the rectangle
    for (let row = topRow; row < topRow + height; row++) {
      for (let col = leftCol; col < leftCol + width; col++) {
        points.push({ row, col });
      }
    }
  } else {
    // Just the outline points
    for (let row = topRow; row < topRow + height; row++) {
      for (let col = leftCol; col < leftCol + width; col++) {
        // Only edges
        if (row === topRow || row === topRow + height - 1 ||
            col === leftCol || col === leftCol + width - 1) {
          points.push({ row, col });
        }
      }
    }
  }
  
  return points;
}

/**
 * Snap end point to create a square (equal width and height)
 * Used when shift key is held
 * @param start - Starting corner point
 * @param end - Current end point
 * @returns Snapped end point that creates a square
 */
export function snapToSquare(start: Point, end: Point): Point {
  const dx = end.col - start.col;
  const dy = end.row - start.row;
  
  // Use the larger dimension for both
  const size = Math.max(Math.abs(dx), Math.abs(dy));
  
  return {
    row: start.row + Math.sign(dy) * size,
    col: start.col + Math.sign(dx) * size,
  };
}
