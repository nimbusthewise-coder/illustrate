/**
 * Tests for F007: Line Tool
 * 
 * Acceptance Criteria:
 * - Click-drag creates line
 * - Snaps to H/V/45° angles
 * - Uses appropriate line chars (─ │ ╱ ╲)
 * - Intersection characters auto-resolve
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, getChar } from '../buffer';
import {
  getLineDirection,
  snapLine,
  getLinePoints,
  drawLine,
  previewLine,
} from './line';
import { LineDirection, Point, DEFAULT_LINE_CHARS } from '../types';

describe('Line Tool (F007)', () => {
  describe('getLineDirection', () => {
    it('should detect horizontal lines', () => {
      const start: Point = { x: 0, y: 5 };
      const end: Point = { x: 10, y: 5 };
      expect(getLineDirection(start, end)).toBe(LineDirection.Horizontal);
    });

    it('should detect vertical lines', () => {
      const start: Point = { x: 5, y: 0 };
      const end: Point = { x: 5, y: 10 };
      expect(getLineDirection(start, end)).toBe(LineDirection.Vertical);
    });

    it('should detect diagonal down lines', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 5, y: 5 };
      expect(getLineDirection(start, end)).toBe(LineDirection.DiagonalDown);
    });

    it('should detect diagonal up lines', () => {
      const start: Point = { x: 0, y: 5 };
      const end: Point = { x: 5, y: 0 };
      expect(getLineDirection(start, end)).toBe(LineDirection.DiagonalUp);
    });
  });

  describe('snapLine', () => {
    it('should snap to horizontal', () => {
      const start: Point = { x: 0, y: 5 };
      const end: Point = { x: 10, y: 6 };
      const snapped = snapLine(start, end);
      
      expect(snapped.start).toEqual(start);
      expect(snapped.end.y).toBe(start.y);
      expect(snapped.end.x).toBe(10);
    });

    it('should snap to vertical', () => {
      const start: Point = { x: 5, y: 0 };
      const end: Point = { x: 6, y: 10 };
      const snapped = snapLine(start, end);
      
      expect(snapped.start).toEqual(start);
      expect(snapped.end.x).toBe(start.x);
      expect(snapped.end.y).toBe(10);
    });

    it('should snap to 45° diagonal', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 10, y: 8 };
      const snapped = snapLine(start, end);
      
      // Should snap to equal dx and dy
      const dx = snapped.end.x - snapped.start.x;
      const dy = snapped.end.y - snapped.start.y;
      expect(Math.abs(dx)).toBe(Math.abs(dy));
    });
  });

  describe('getLinePoints', () => {
    it('should return all points for horizontal line', () => {
      const line = { start: { x: 0, y: 0 }, end: { x: 5, y: 0 } };
      const points = getLinePoints(line);
      
      expect(points.length).toBe(6); // includes start and end
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[5]).toEqual({ x: 5, y: 0 });
    });

    it('should return all points for vertical line', () => {
      const line = { start: { x: 0, y: 0 }, end: { x: 0, y: 5 } };
      const points = getLinePoints(line);
      
      expect(points.length).toBe(6);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[5]).toEqual({ x: 0, y: 5 });
    });

    it('should return all points for diagonal line', () => {
      const line = { start: { x: 0, y: 0 }, end: { x: 3, y: 3 } };
      const points = getLinePoints(line);
      
      expect(points.length).toBe(4);
      expect(points[0]).toEqual({ x: 0, y: 0 });
      expect(points[3]).toEqual({ x: 3, y: 3 });
    });
  });

  describe('drawLine', () => {
    it('should draw horizontal line with correct characters', () => {
      const buffer = createBuffer(10, 10);
      const line = { start: { x: 2, y: 5 }, end: { x: 7, y: 5 } };
      
      drawLine(buffer, line);
      
      for (let x = 2; x <= 7; x++) {
        const charCode = getChar(buffer, 5, x);
        expect(String.fromCharCode(charCode)).toBe(DEFAULT_LINE_CHARS.horizontal);
      }
    });

    it('should draw vertical line with correct characters', () => {
      const buffer = createBuffer(10, 10);
      const line = { start: { x: 5, y: 2 }, end: { x: 5, y: 7 } };
      
      drawLine(buffer, line);
      
      for (let y = 2; y <= 7; y++) {
        const charCode = getChar(buffer, y, 5);
        expect(String.fromCharCode(charCode)).toBe(DEFAULT_LINE_CHARS.vertical);
      }
    });

    it('should draw diagonal line with correct characters', () => {
      const buffer = createBuffer(10, 10);
      const line = { start: { x: 2, y: 2 }, end: { x: 5, y: 5 } };
      
      drawLine(buffer, line);
      
      // Check start and end points have diagonal character
      const startChar = String.fromCharCode(getChar(buffer, 2, 2));
      const endChar = String.fromCharCode(getChar(buffer, 5, 5));
      expect(startChar).toBe(DEFAULT_LINE_CHARS.diagonalDown);
      expect(endChar).toBe(DEFAULT_LINE_CHARS.diagonalDown);
    });

    it('should resolve intersections to cross character', () => {
      const buffer = createBuffer(10, 10);
      
      // Draw horizontal line
      const horizontal = { start: { x: 2, y: 5 }, end: { x: 7, y: 5 } };
      drawLine(buffer, horizontal);
      
      // Draw vertical line crossing it
      const vertical = { start: { x: 5, y: 2 }, end: { x: 5, y: 7 } };
      drawLine(buffer, vertical);
      
      // Intersection point should be cross
      const intersectionChar = String.fromCharCode(getChar(buffer, 5, 5));
      expect(intersectionChar).toBe(DEFAULT_LINE_CHARS.cross);
    });

    it('should handle lines outside buffer bounds gracefully', () => {
      const buffer = createBuffer(10, 10);
      const line = { start: { x: -5, y: 5 }, end: { x: 15, y: 5 } };
      
      // Should not throw
      expect(() => drawLine(buffer, line)).not.toThrow();
      
      // Should only draw within bounds
      const char0 = String.fromCharCode(getChar(buffer, 5, 0));
      const char9 = String.fromCharCode(getChar(buffer, 5, 9));
      expect(char0).toBe(DEFAULT_LINE_CHARS.horizontal);
      expect(char9).toBe(DEFAULT_LINE_CHARS.horizontal);
    });
  });

  describe('previewLine', () => {
    it('should return snapped line and points without modifying buffer', () => {
      const buffer = createBuffer(10, 10);
      const line = { start: { x: 0, y: 0 }, end: { x: 5, y: 1 } };
      
      const preview = previewLine(line);
      
      expect(preview.snapped.end.y).toBe(0); // Snapped to horizontal
      expect(preview.points.length).toBeGreaterThan(0);
      
      // Buffer should still be empty
      expect(getChar(buffer, 0, 0)).toBe(0);
    });
  });
});
