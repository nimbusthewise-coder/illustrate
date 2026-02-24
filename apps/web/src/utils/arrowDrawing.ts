/**
 * Arrow Drawing Utilities — F013: Arrow / Connector Tool
 *
 * Utilities for rendering arrows to character buffers
 */

import type { Point, Arrow, ArrowStyle, ArrowCharSet } from '@/types/arrow';
import type { Buffer } from '@/lib/types';
import {
  getPathCharacterType,
  getCornerType,
  getSegmentDirection,
} from './arrowRouting';
import { getArrowCharSet } from '@/types/arrow';

/**
 * Draw an arrow to a buffer
 * Modifies the buffer in place
 */
export function drawArrowToBuffer(
  buffer: Buffer,
  arrow: Arrow,
  color?: string
): void {
  if (!arrow.path || arrow.path.length === 0) {
    return;
  }

  const charset = getArrowCharSet(arrow.style.lineStyle);
  const fg = color || '#000000';

  // Draw each segment of the path
  for (let i = 0; i < arrow.path.length; i++) {
    const point = arrow.path[i];
    const prev = i > 0 ? arrow.path[i - 1] : null;
    const next = i < arrow.path.length - 1 ? arrow.path[i + 1] : null;

    const char = getArrowCharacter(prev, point, next, arrow.style, charset);
    const index = point.row * buffer.width + point.col;

    if (index >= 0 && index < buffer.chars.length) {
      buffer.chars[index] = char;
      buffer.fg[index] = fg;
    }
  }
}

/**
 * Get the appropriate character for a point in the arrow path
 */
export function getArrowCharacter(
  prev: Point | null,
  current: Point,
  next: Point | null,
  style: ArrowStyle,
  charset: ArrowCharSet
): string {
  const charType = getPathCharacterType(prev, current, next);

  // Handle endpoints with arrowheads
  if (charType === 'end' && style.arrowhead && prev) {
    const direction = getSegmentDirection(prev, current);
    switch (direction) {
      case 'up':
        return charset.arrowUp;
      case 'down':
        return charset.arrowDown;
      case 'left':
        return charset.arrowLeft;
      case 'right':
        return charset.arrowRight;
    }
  }

  if (charType === 'start' && style.bidirectional && next) {
    const direction = getSegmentDirection(current, next);
    switch (direction) {
      case 'up':
        return charset.arrowDown; // Opposite direction for bidirectional
      case 'down':
        return charset.arrowUp;
      case 'left':
        return charset.arrowRight;
      case 'right':
        return charset.arrowLeft;
    }
  }

  // Handle path segments
  switch (charType) {
    case 'horizontal':
      return charset.horizontal;
    case 'vertical':
      return charset.vertical;
    case 'corner':
      if (prev && next) {
        const cornerType = getCornerType(prev, current, next);
        switch (cornerType) {
          case 'tl':
            return charset.cornerTL;
          case 'tr':
            return charset.cornerTR;
          case 'bl':
            return charset.cornerBL;
          case 'br':
            return charset.cornerBR;
        }
      }
      return charset.horizontal; // Fallback
    case 'single':
      // Single point - use a dot or small marker
      return '•';
    default:
      return charset.horizontal;
  }
}

/**
 * Erase an arrow from a buffer
 * Replaces arrow characters with spaces
 */
export function eraseArrowFromBuffer(buffer: Buffer, arrow: Arrow): void {
  if (!arrow.path) {
    return;
  }

  for (const point of arrow.path) {
    const index = point.row * buffer.width + point.col;
    if (index >= 0 && index < buffer.chars.length) {
      buffer.chars[index] = ' ';
      buffer.fg[index] = 'transparent';
      buffer.bg[index] = 'transparent';
    }
  }
}

/**
 * Create a preview of an arrow path (used during creation)
 * Returns characters that can be rendered for preview
 */
export function createArrowPreview(
  path: Point[],
  style: ArrowStyle,
  width: number,
  height: number
): { point: Point; char: string }[] {
  if (!path || path.length === 0) {
    return [];
  }

  const charset = getArrowCharSet(style.lineStyle);
  const preview: { point: Point; char: string }[] = [];

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const prev = i > 0 ? path[i - 1] : null;
    const next = i < path.length - 1 ? path[i + 1] : null;

    const char = getArrowCharacter(prev, point, next, style, charset);
    preview.push({ point, char });
  }

  return preview;
}

/**
 * Check if a point is part of an arrow
 */
export function isPointOnArrow(point: Point, arrow: Arrow): boolean {
  if (!arrow.path) {
    return false;
  }

  return arrow.path.some(
    (p) => p.col === point.col && p.row === point.row
  );
}

/**
 * Get the arrow at a specific point
 */
export function getArrowAtPoint(point: Point, arrows: Arrow[]): Arrow | null {
  for (const arrow of arrows) {
    if (isPointOnArrow(point, arrow)) {
      return arrow;
    }
  }
  return null;
}

/**
 * Update arrow path (used when connected elements move)
 * Recalculates the path between start and end
 */
export function updateArrowPath(
  arrow: Arrow,
  newStart?: Point,
  newEnd?: Point,
  gridWidth?: number,
  gridHeight?: number
): Point[] | null {
  const start = newStart || arrow.start;
  const end = newEnd || arrow.end;

  // Import here to avoid circular dependency
  const { calculateManhattanPath } = require('./arrowRouting');
  
  if (gridWidth === undefined || gridHeight === undefined) {
    // Can't recalculate without grid dimensions
    return arrow.path;
  }

  return calculateManhattanPath(start, end, gridWidth, gridHeight);
}
