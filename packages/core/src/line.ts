/**
 * Line drawing tool implementation  
 * F007: Line tool with H/V/45° angle snapping
 */

import type { Buffer } from './types.js';
import { getChar, setChar, getIndex } from './buffer.js';

/**
 * Line characters for different directions
 */
export const LINE_CHARS = {
  HORIZONTAL: '─',
  VERTICAL: '│',
  DIAGONAL_DOWN: '╲',   // Top-left to bottom-right
  DIAGONAL_UP: '╱',     // Bottom-left to top-right
} as const;

/**
 * Intersection characters
 */
export const INTERSECTION_CHARS = {
  CROSS: '┼',           // H + V
  T_DOWN: '┬',          // H with V going down
  T_UP: '┴',            // H with V going up
  T_RIGHT: '├',         // V with H going right
  T_LEFT: '┤',          // V with H going left
} as const;

/**
 * Point in grid coordinates (row, col)
 */
interface Point {
  row: number;
  col: number;
}

/**
 * Calculate angle from start to end point
 */
function calculateAngle(start: Point, end: Point): number {
  const dx = end.col - start.col;
  const dy = end.row - start.row;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Snap angle to nearest H/V/45° direction
 */
function snapAngle(angle: number): number {
  // Normalize angle to 0-360
  const normalized = ((angle % 360) + 360) % 360;
  
  // Define snap points: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
  const snapPoints = [0, 45, 90, 135, 180, 225, 270, 315];
  
  // Find closest snap point
  let closest = snapPoints[0];
  let minDiff = Math.abs(normalized - closest);
  
  for (const snap of snapPoints) {
    const diff = Math.abs(normalized - snap);
    if (diff < minDiff) {
      minDiff = diff;
      closest = snap;
    }
  }
  
  // Handle wrapping around 360
  const wrapDiff = Math.abs(normalized - 360);
  if (wrapDiff < minDiff) {
    closest = 0;
  }
  
  return closest;
}

/**
 * Get snapped end point based on start point and angle
 */
export function snapToAngle(start: Point, end: Point): Point {
  const angle = calculateAngle(start, end);
  const snapped = snapAngle(angle);
  
  const dx = end.col - start.col;
  const dy = end.row - start.row;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate snapped end point
  const rad = (snapped * Math.PI) / 180;
  const newDx = Math.round(Math.cos(rad) * distance);
  const newDy = Math.round(Math.sin(rad) * distance);
  
  return {
    row: start.row + newDy,
    col: start.col + newDx,
  };
}

/**
 * Get line character for direction
 */
function getLineChar(start: Point, end: Point): string {
  const dx = end.col - start.col;
  const dy = end.row - start.row;
  
  // Horizontal line
  if (dy === 0) return LINE_CHARS.HORIZONTAL;
  
  // Vertical line
  if (dx === 0) return LINE_CHARS.VERTICAL;
  
  // Diagonal lines
  // Positive slope: down-right (╲)
  if (Math.sign(dx) === Math.sign(dy)) {
    return LINE_CHARS.DIAGONAL_DOWN;
  }
  
  // Negative slope: up-right (╱)
  return LINE_CHARS.DIAGONAL_UP;
}

/**
 * Detect and resolve intersection character
 */
function resolveIntersection(buffer: Buffer, row: number, col: number, newChar: string): string {
  const existing = getChar(buffer, row, col);
  
  // No intersection if cell is empty or space
  if (!existing || existing === ' ') return newChar;
  
  // Same character, no change needed
  if (existing === newChar) return newChar;
  
  // Detect intersection patterns
  const isHorizontal = (char: string) => char === LINE_CHARS.HORIZONTAL;
  const isVertical = (char: string) => char === LINE_CHARS.VERTICAL;
  
  // H + V = Cross
  if ((isHorizontal(existing) && isVertical(newChar)) ||
      (isVertical(existing) && isHorizontal(newChar))) {
    return INTERSECTION_CHARS.CROSS;
  }
  
  // For now, just use cross for all intersections
  // More sophisticated intersection detection can be added later
  if (existing !== newChar) {
    return INTERSECTION_CHARS.CROSS;
  }
  
  return newChar;
}

/**
 * Draw a line from start to end using Bresenham's algorithm
 * Lines are snapped to H/V/45° angles
 * @param buffer - The buffer to draw on
 * @param start - Starting point
 * @param end - Ending point
 */
export function drawLine(buffer: Buffer, start: Point, end: Point): void {
  // Snap to nearest H/V/45° angle
  const snappedEnd = snapToAngle(start, end);
  
  const char = getLineChar(start, snappedEnd);
  
  // Bresenham's line algorithm
  let x0 = start.col;
  let y0 = start.row;
  const x1 = snappedEnd.col;
  const y1 = snappedEnd.row;
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    // Draw point if in bounds
    if (y0 >= 0 && y0 < buffer.height && x0 >= 0 && x0 < buffer.width) {
      const resolvedChar = resolveIntersection(buffer, y0, x0, char);
      setChar(buffer, y0, x0, resolvedChar);
    }
    
    // Check if we've reached the end
    if (x0 === x1 && y0 === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/**
 * Get points along a line (for preview)
 * @param start - Starting point
 * @param end - Ending point
 * @returns Array of points along the line
 */
export function getLinePoints(start: Point, end: Point): Point[] {
  const snappedEnd = snapToAngle(start, end);
  const points: Point[] = [];
  
  let x0 = start.col;
  let y0 = start.row;
  const x1 = snappedEnd.col;
  const y1 = snappedEnd.row;
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    points.push({ row: y0, col: x0 });
    
    if (x0 === x1 && y0 === y1) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  
  return points;
}
