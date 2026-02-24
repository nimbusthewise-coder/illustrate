/**
 * Box drawing tool tests
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, getChar } from './buffer.js';
import { drawBox, getBoxPoints, snapToSquare, BOX_CHARS } from './box.js';

describe('box drawing', () => {
  describe('drawBox', () => {
    it('should draw an outline box', () => {
      const buffer = createBuffer(10, 10);
      
      drawBox(buffer, { row: 2, col: 2 }, { row: 5, col: 7 }, 'outline');
      
      // Check corners
      expect(getChar(buffer, 2, 2)).toBe(BOX_CHARS.TOP_LEFT);
      expect(getChar(buffer, 2, 7)).toBe(BOX_CHARS.TOP_RIGHT);
      expect(getChar(buffer, 5, 2)).toBe(BOX_CHARS.BOTTOM_LEFT);
      expect(getChar(buffer, 5, 7)).toBe(BOX_CHARS.BOTTOM_RIGHT);
      
      // Check top edge
      expect(getChar(buffer, 2, 3)).toBe(BOX_CHARS.HORIZONTAL);
      expect(getChar(buffer, 2, 4)).toBe(BOX_CHARS.HORIZONTAL);
      expect(getChar(buffer, 2, 5)).toBe(BOX_CHARS.HORIZONTAL);
      expect(getChar(buffer, 2, 6)).toBe(BOX_CHARS.HORIZONTAL);
      
      // Check left edge
      expect(getChar(buffer, 3, 2)).toBe(BOX_CHARS.VERTICAL);
      expect(getChar(buffer, 4, 2)).toBe(BOX_CHARS.VERTICAL);
      
      // Check interior should be empty
      expect(getChar(buffer, 3, 3)).toBe(' ');
      expect(getChar(buffer, 4, 4)).toBe(' ');
    });
    
    it('should draw a filled box', () => {
      const buffer = createBuffer(10, 10);
      
      drawBox(buffer, { row: 1, col: 1 }, { row: 3, col: 3 }, 'filled');
      
      // All cells should be filled
      expect(getChar(buffer, 1, 1)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 1, 2)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 1, 3)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 2, 1)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 2, 2)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 2, 3)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 3, 1)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 3, 2)).toBe(BOX_CHARS.FILL);
      expect(getChar(buffer, 3, 3)).toBe(BOX_CHARS.FILL);
      
      // Outside should be empty
      expect(getChar(buffer, 0, 0)).toBe(' ');
      expect(getChar(buffer, 4, 4)).toBe(' ');
    });
    
    it('should handle reversed coordinates', () => {
      const buffer = createBuffer(10, 10);
      
      // Draw from bottom-right to top-left
      drawBox(buffer, { row: 5, col: 7 }, { row: 2, col: 2 }, 'outline');
      
      // Should normalize to same box
      expect(getChar(buffer, 2, 2)).toBe(BOX_CHARS.TOP_LEFT);
      expect(getChar(buffer, 2, 7)).toBe(BOX_CHARS.TOP_RIGHT);
      expect(getChar(buffer, 5, 2)).toBe(BOX_CHARS.BOTTOM_LEFT);
      expect(getChar(buffer, 5, 7)).toBe(BOX_CHARS.BOTTOM_RIGHT);
    });
    
    it('should draw a single cell box', () => {
      const buffer = createBuffer(10, 10);
      
      drawBox(buffer, { row: 5, col: 5 }, { row: 5, col: 5 }, 'outline');
      
      // Single cell should have a corner character
      expect(getChar(buffer, 5, 5)).toBe(BOX_CHARS.TOP_LEFT);
    });
    
    it('should handle boundary clipping gracefully', () => {
      const buffer = createBuffer(5, 5);
      
      // Draw box that extends beyond buffer - should not crash
      drawBox(buffer, { row: 2, col: 2 }, { row: 10, col: 10 }, 'outline');
      
      // Should draw top-left corner within bounds
      expect(getChar(buffer, 2, 2)).toBe(BOX_CHARS.TOP_LEFT);
      
      // Should draw top and left edges where they fit
      expect(getChar(buffer, 2, 3)).toBe(BOX_CHARS.HORIZONTAL);
      expect(getChar(buffer, 3, 2)).toBe(BOX_CHARS.VERTICAL);
      expect(getChar(buffer, 4, 2)).toBe(BOX_CHARS.VERTICAL);
      expect(getChar(buffer, 2, 4)).toBe(BOX_CHARS.HORIZONTAL);
      
      // Interior cells and cells beyond calculated edges should be empty
      expect(getChar(buffer, 3, 3)).toBe(' ');
      expect(getChar(buffer, 4, 4)).toBe(' ');
    });
  });
  
  describe('getBoxPoints', () => {
    it('should return outline points', () => {
      const points = getBoxPoints({ row: 2, col: 2 }, { row: 4, col: 5 }, 'outline');
      
      // Should have points for the perimeter only
      // Width: 4 (5-2+1), Height: 3 (4-2+1)
      // Perimeter: 2*(4+3) - 4 = 10 points
      expect(points.length).toBe(10);
      
      // Check that all points are on the edge
      for (const point of points) {
        const isEdge = 
          point.row === 2 || point.row === 4 ||
          point.col === 2 || point.col === 5;
        expect(isEdge).toBe(true);
      }
    });
    
    it('should return filled points', () => {
      const points = getBoxPoints({ row: 2, col: 2 }, { row: 4, col: 5 }, 'filled');
      
      // Should have all points in the rectangle
      // Width: 4, Height: 3
      // Total: 4 * 3 = 12 points
      expect(points.length).toBe(12);
    });
  });
  
  describe('snapToSquare', () => {
    it('should snap to square when width > height', () => {
      const result = snapToSquare({ row: 0, col: 0 }, { row: 2, col: 5 });
      
      // Height = 2, Width = 5
      // Should use larger dimension (5)
      expect(result).toEqual({ row: 5, col: 5 });
    });
    
    it('should snap to square when height > width', () => {
      const result = snapToSquare({ row: 0, col: 0 }, { row: 5, col: 2 });
      
      // Height = 5, Width = 2
      // Should use larger dimension (5)
      expect(result).toEqual({ row: 5, col: 5 });
    });
    
    it('should preserve direction when snapping', () => {
      // Moving left and up
      const result = snapToSquare({ row: 5, col: 5 }, { row: 2, col: 1 });
      
      // dx = -4, dy = -3
      // size = 4
      // Should move left and up
      expect(result.row).toBeLessThan(5);
      expect(result.col).toBeLessThan(5);
    });
    
    it('should handle already-square box', () => {
      const result = snapToSquare({ row: 0, col: 0 }, { row: 3, col: 3 });
      
      // Already square, should not change
      expect(result).toEqual({ row: 3, col: 3 });
    });
  });
});
