/**
 * Arrow Routing Utilities — F013: Arrow / Connector Tool
 *
 * Manhattan routing algorithm for connecting points with horizontal/vertical lines only.
 * Per PRD: "Routing algorithm capped at 100 iterations; toast on failure"
 * Per PRD: "Routing is deterministic (same input → same route) to prevent jitter"
 */

import type { Point, Direction } from '@/types/arrow';

const MAX_ROUTING_ITERATIONS = 100;

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/**
 * Get direction from one point to another
 */
export function getDirection(from: Point, to: Point): Direction | null {
  const dcol = to.col - from.col;
  const drow = to.row - from.row;

  if (Math.abs(dcol) > Math.abs(drow)) {
    return dcol > 0 ? 'right' : 'left';
  } else if (drow !== 0) {
    return drow > 0 ? 'down' : 'up';
  }
  return null;
}

/**
 * Move a point in a direction
 */
export function movePoint(point: Point, direction: Direction): Point {
  switch (direction) {
    case 'up':
      return { col: point.col, row: point.row - 1 };
    case 'down':
      return { col: point.col, row: point.row + 1 };
    case 'left':
      return { col: point.col - 1, row: point.row };
    case 'right':
      return { col: point.col + 1, row: point.row };
  }
}

/**
 * Check if two points are equal
 */
export function pointsEqual(a: Point, b: Point): boolean {
  return a.col === b.col && a.row === b.row;
}

/**
 * Simple Manhattan routing algorithm
 * Routes from start to end using only horizontal and vertical segments
 * 
 * Algorithm:
 * 1. Move horizontally towards target
 * 2. Then move vertically towards target
 * 3. This creates an L-shaped path (one turn)
 * 
 * For more complex routing around obstacles, we would need A* pathfinding,
 * but for P1 this simple deterministic approach works.
 */
export function calculateManhattanPath(
  start: Point,
  end: Point,
  gridWidth: number,
  gridHeight: number
): Point[] | null {
  // Validate inputs
  if (!isValidPoint(start, gridWidth, gridHeight) || !isValidPoint(end, gridWidth, gridHeight)) {
    return null;
  }

  // If start and end are the same, return single point
  if (pointsEqual(start, end)) {
    return [start];
  }

  const path: Point[] = [start];
  let current = { ...start };
  let iterations = 0;

  // Simple L-shaped routing: horizontal first, then vertical
  // This is deterministic and always produces the same path for same inputs

  // Move horizontally to target column
  while (current.col !== end.col && iterations < MAX_ROUTING_ITERATIONS) {
    const direction: Direction = current.col < end.col ? 'right' : 'left';
    current = movePoint(current, direction);
    path.push({ ...current });
    iterations++;
  }

  // Move vertically to target row
  while (current.row !== end.row && iterations < MAX_ROUTING_ITERATIONS) {
    const direction: Direction = current.row < end.row ? 'down' : 'up';
    current = movePoint(current, direction);
    path.push({ ...current });
    iterations++;
  }

  // Check if we hit max iterations
  if (iterations >= MAX_ROUTING_ITERATIONS) {
    return null; // Routing failed
  }

  return path;
}

/**
 * Check if a point is within grid bounds
 */
export function isValidPoint(point: Point, width: number, height: number): boolean {
  return point.col >= 0 && point.col < width && point.row >= 0 && point.row < height;
}

/**
 * Get the direction of a path segment
 */
export function getSegmentDirection(from: Point, to: Point): Direction | null {
  if (from.row === to.row) {
    // Horizontal segment
    return from.col < to.col ? 'right' : 'left';
  } else if (from.col === to.col) {
    // Vertical segment
    return from.row < to.row ? 'down' : 'up';
  }
  return null;
}

/**
 * Determine what character to use at a path point based on incoming and outgoing directions
 */
export function getPathCharacterType(
  prev: Point | null,
  current: Point,
  next: Point | null
): 'horizontal' | 'vertical' | 'corner' | 'start' | 'end' | 'single' {
  if (!prev && !next) {
    return 'single';
  }
  if (!prev) {
    return 'start';
  }
  if (!next) {
    return 'end';
  }

  const dirIn = getSegmentDirection(prev, current);
  const dirOut = getSegmentDirection(current, next);

  if (dirIn === dirOut) {
    // Straight line
    if (dirIn === 'left' || dirIn === 'right') {
      return 'horizontal';
    } else {
      return 'vertical';
    }
  } else {
    // Direction change = corner
    return 'corner';
  }
}

/**
 * Get specific corner type for a corner point
 */
export function getCornerType(
  prev: Point,
  current: Point,
  next: Point
): 'tl' | 'tr' | 'bl' | 'br' {
  const dirIn = getSegmentDirection(prev, current);
  const dirOut = getSegmentDirection(current, next);

  // Map direction pairs to corner types
  if (dirIn === 'right' && dirOut === 'down') return 'br';
  if (dirIn === 'right' && dirOut === 'up') return 'tr';
  if (dirIn === 'left' && dirOut === 'down') return 'bl';
  if (dirIn === 'left' && dirOut === 'up') return 'tl';
  if (dirIn === 'down' && dirOut === 'right') return 'tl';
  if (dirIn === 'down' && dirOut === 'left') return 'tr';
  if (dirIn === 'up' && dirOut === 'right') return 'bl';
  if (dirIn === 'up' && dirOut === 'left') return 'br';

  // Default fallback
  return 'br';
}

/**
 * Calculate arrow preview path during creation
 * Used for live feedback while user drags to create arrow
 */
export function calculatePreviewPath(
  start: Point,
  currentMouse: Point,
  gridWidth: number,
  gridHeight: number
): Point[] | null {
  return calculateManhattanPath(start, currentMouse, gridWidth, gridHeight);
}
