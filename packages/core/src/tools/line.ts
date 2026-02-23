/**
 * Line Tool (F007)
 * 
 * Requirements from PRD:
 * - Click-drag draws line
 * - Snaps to H/V/45° angles
 * - Uses appropriate line chars (─ │ ╱ ╲)
 * - Intersection characters auto-resolve
 */

import { Buffer, Point, Line, LineDirection, LineChars, DEFAULT_LINE_CHARS } from '../types.js';
import { setCell, getChar, isInBounds } from '../buffer.js';

/**
 * Determine the direction of a line based on start and end points
 */
export function getLineDirection(start: Point, end: Point): LineDirection {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  // Determine primary direction
  if (absDx > absDy * 2) {
    // Strongly horizontal
    return LineDirection.Horizontal;
  } else if (absDy > absDx * 2) {
    // Strongly vertical
    return LineDirection.Vertical;
  } else {
    // Diagonal - determine which diagonal
    // If dx and dy have same sign, it's going down-right (\)
    // If opposite sign, it's going up-right (/)
    if ((dx > 0 && dy > 0) || (dx < 0 && dy < 0)) {
      return LineDirection.DiagonalDown;
    } else {
      return LineDirection.DiagonalUp;
    }
  }
}

/**
 * Snap a line to H/V/45° angles
 */
export function snapLine(start: Point, end: Point): Line {
  const direction = getLineDirection(start, end);
  
  const snapped = { ...end };
  
  switch (direction) {
    case LineDirection.Horizontal:
      // Snap to horizontal (same y)
      snapped.y = start.y;
      break;
      
    case LineDirection.Vertical:
      // Snap to vertical (same x)
      snapped.x = start.x;
      break;
      
    case LineDirection.DiagonalUp:
    case LineDirection.DiagonalDown: {
      // Snap to 45° diagonal
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      // Use the smaller dimension to maintain 45°
      const distance = Math.min(absDx, absDy);
      
      snapped.x = start.x + (dx > 0 ? distance : -distance);
      snapped.y = start.y + (dy > 0 ? distance : -distance);
      break;
    }
  }
  
  return { start, end: snapped };
}

/**
 * Get all points along a line using Bresenham's line algorithm
 */
export function getLinePoints(line: Line): Point[] {
  const points: Point[] = [];
  const { start, end } = line;
  
  let x0 = Math.round(start.x);
  let y0 = Math.round(start.y);
  const x1 = Math.round(end.x);
  const y1 = Math.round(end.y);
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  while (true) {
    points.push({ x: x0, y: y0 });
    
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

/**
 * Get the appropriate character for a line segment at a given point
 */
function getLineChar(
  direction: LineDirection,
  chars: LineChars = DEFAULT_LINE_CHARS
): string {
  switch (direction) {
    case LineDirection.Horizontal:
      return chars.horizontal;
    case LineDirection.Vertical:
      return chars.vertical;
    case LineDirection.DiagonalUp:
      return chars.diagonalUp;
    case LineDirection.DiagonalDown:
      return chars.diagonalDown;
  }
}

/**
 * Resolve intersection character when lines cross
 */
function resolveIntersection(
  existingCharCode: number,
  newChar: string,
  chars: LineChars = DEFAULT_LINE_CHARS
): string {
  // If cell is empty, use new char
  if (existingCharCode === 0) {
    return newChar;
  }
  
  const existingChar = String.fromCharCode(existingCharCode);
  
  const isHoriz = (c: string) => c === chars.horizontal;
  const isVert = (c: string) => c === chars.vertical;
  const isDiagUp = (c: string) => c === chars.diagonalUp;
  const isDiagDown = (c: string) => c === chars.diagonalDown;
  
  // Horizontal + Vertical = Cross
  if ((isHoriz(existingChar) && isVert(newChar)) ||
      (isVert(existingChar) && isHoriz(newChar))) {
    return chars.cross;
  }
  
  // Horizontal + horizontal = horizontal
  if (isHoriz(existingChar) && isHoriz(newChar)) {
    return chars.horizontal;
  }
  
  // Vertical + vertical = vertical
  if (isVert(existingChar) && isVert(newChar)) {
    return chars.vertical;
  }
  
  // For diagonal overlaps, prefer the cross pattern
  if ((isDiagUp(existingChar) || isDiagDown(existingChar)) &&
      (isDiagUp(newChar) || isDiagDown(newChar))) {
    return chars.cross;
  }
  
  // Existing cross + anything = cross
  if (existingChar === chars.cross) {
    return chars.cross;
  }
  
  // Default: use new character
  return newChar;
}

/**
 * Draw a line on the buffer with automatic intersection resolution
 */
export function drawLine(
  buffer: Buffer,
  line: Line,
  fg: number = 0xFFFFFFFF,
  bg: number = 0x00000000,
  chars: LineChars = DEFAULT_LINE_CHARS
): void {
  const snapped = snapLine(line.start, line.end);
  const direction = getLineDirection(snapped.start, snapped.end);
  const lineChar = getLineChar(direction, chars);
  const points = getLinePoints(snapped);
  
  for (const point of points) {
    const col = point.x;
    const row = point.y;
    
    if (!isInBounds(buffer, col, row)) continue;
    
    const existingCharCode = getChar(buffer, row, col);
    const resolvedChar = resolveIntersection(existingCharCode, lineChar, chars);
    
    setCell(buffer, col, row, resolvedChar.charCodeAt(0), fg, bg);
  }
}

/**
 * Preview a line without modifying the buffer (returns the snapped line and points)
 */
export function previewLine(line: Line): { snapped: Line; points: Point[] } {
  const snapped = snapLine(line.start, line.end);
  const points = getLinePoints(snapped);
  
  return { snapped, points };
}
