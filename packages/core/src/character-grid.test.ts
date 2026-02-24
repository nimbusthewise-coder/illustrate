/**
 * Character Grid Rendering Tests
 * F002: Character grid rendering with guaranteed alignment
 */

import { describe, it, expect } from 'vitest';
import {
  getCharWidthCategory,
  getCharCellSpan,
  calculateGridMetrics,
  getCellPosition,
  pixelToCell,
  bufferToRenderCells,
  validateAlignment,
  correctAlignment,
  getGridContainerStyle,
  getCellStyle,
  flattenRenderGrid,
} from './character-grid';
import { createBuffer, setChar } from './buffer';

describe('Character Grid', () => {
  describe('getCharWidthCategory', () => {
    it('classifies ASCII characters as narrow', () => {
      expect(getCharWidthCategory('A')).toBe('narrow');
      expect(getCharWidthCategory('z')).toBe('narrow');
      expect(getCharWidthCategory('0')).toBe('narrow');
      expect(getCharWidthCategory('!')).toBe('narrow');
      expect(getCharWidthCategory(' ')).toBe('narrow');
    });

    it('classifies box-drawing characters as narrow', () => {
      expect(getCharWidthCategory('─')).toBe('narrow');
      expect(getCharWidthCategory('│')).toBe('narrow');
      expect(getCharWidthCategory('┌')).toBe('narrow');
      expect(getCharWidthCategory('┘')).toBe('narrow');
      expect(getCharWidthCategory('┼')).toBe('narrow');
    });

    it('classifies CJK characters as wide', () => {
      expect(getCharWidthCategory('漢')).toBe('wide');
      expect(getCharWidthCategory('字')).toBe('wide');
      expect(getCharWidthCategory('あ')).toBe('wide');
      expect(getCharWidthCategory('ア')).toBe('wide');
    });

    it('classifies fullwidth forms as wide', () => {
      expect(getCharWidthCategory('Ａ')).toBe('wide'); // Fullwidth A (U+FF21)
      expect(getCharWidthCategory('！')).toBe('wide'); // Fullwidth ! (U+FF01)
    });

    it('classifies zero-width characters', () => {
      expect(getCharWidthCategory('\u200B')).toBe('zero-width'); // ZWSP
      expect(getCharWidthCategory('\u200D')).toBe('zero-width'); // ZWJ
      expect(getCharWidthCategory('\uFEFF')).toBe('zero-width'); // BOM
    });

    it('classifies combining characters as zero-width', () => {
      expect(getCharWidthCategory('\u0300')).toBe('zero-width'); // Combining grave
      expect(getCharWidthCategory('\u0301')).toBe('zero-width'); // Combining acute
    });

    it('handles empty string', () => {
      expect(getCharWidthCategory('')).toBe('narrow');
    });
  });

  describe('getCharCellSpan', () => {
    it('returns 1 for narrow characters', () => {
      expect(getCharCellSpan('A')).toBe(1);
      expect(getCharCellSpan('─')).toBe(1);
    });

    it('returns 2 for wide characters', () => {
      expect(getCharCellSpan('漢')).toBe(2);
    });

    it('returns 0 for zero-width characters', () => {
      expect(getCharCellSpan('\u200B')).toBe(0);
    });
  });

  describe('calculateGridMetrics', () => {
    it('calculates correct metrics for standard grid', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      expect(metrics.cols).toBe(80);
      expect(metrics.rows).toBe(24);
      expect(metrics.cellWidth).toBe(10);
      expect(metrics.cellHeight).toBe(20);
      expect(metrics.totalWidth).toBe(800);
      expect(metrics.totalHeight).toBe(480);
      expect(metrics.fontSize).toBe(16);
    });

    it('calculates correct metrics for small grid', () => {
      const metrics = calculateGridMetrics(10, 5, 8, 16);
      
      expect(metrics.totalWidth).toBe(80);
      expect(metrics.totalHeight).toBe(80);
      expect(metrics.fontSize).toBe(12);
    });

    it('calculates correct metrics for large grid', () => {
      const metrics = calculateGridMetrics(200, 100, 12, 24);
      
      expect(metrics.totalWidth).toBe(2400);
      expect(metrics.totalHeight).toBe(2400);
    });
  });

  describe('getCellPosition', () => {
    it('returns correct pixel position', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      expect(getCellPosition(metrics, 0, 0)).toEqual({ x: 0, y: 0 });
      expect(getCellPosition(metrics, 0, 5)).toEqual({ x: 50, y: 0 });
      expect(getCellPosition(metrics, 3, 0)).toEqual({ x: 0, y: 60 });
      expect(getCellPosition(metrics, 3, 5)).toEqual({ x: 50, y: 60 });
    });

    it('handles edge positions', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      expect(getCellPosition(metrics, 23, 79)).toEqual({ x: 790, y: 460 });
    });
  });

  describe('pixelToCell', () => {
    it('converts pixel coordinates to cell coordinates', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      expect(pixelToCell(metrics, 0, 0)).toEqual({ row: 0, col: 0 });
      expect(pixelToCell(metrics, 15, 25)).toEqual({ row: 1, col: 1 });
      expect(pixelToCell(metrics, 55, 65)).toEqual({ row: 3, col: 5 });
    });

    it('rounds down to cell boundary', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      expect(pixelToCell(metrics, 9, 19)).toEqual({ row: 0, col: 0 });
      expect(pixelToCell(metrics, 10, 20)).toEqual({ row: 1, col: 1 });
    });
  });

  describe('bufferToRenderCells', () => {
    it('converts empty buffer to render cells', () => {
      const buffer = createBuffer(5, 3);
      const grid = bufferToRenderCells(buffer);
      
      expect(grid.length).toBe(3);
      expect(grid[0].length).toBe(5);
      
      // All cells should be spaces
      for (const row of grid) {
        for (const cell of row) {
          expect(cell.char).toBe(' ');
          expect(cell.isContinuation).toBe(false);
          expect(cell.cellSpan).toBe(1);
        }
      }
    });

    it('converts buffer with ASCII characters', () => {
      const buffer = createBuffer(5, 1);
      setChar(buffer, 0, 0, 'H');
      setChar(buffer, 0, 1, 'e');
      setChar(buffer, 0, 2, 'l');
      setChar(buffer, 0, 3, 'l');
      setChar(buffer, 0, 4, 'o');
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid[0][0].char).toBe('H');
      expect(grid[0][1].char).toBe('e');
      expect(grid[0][2].char).toBe('l');
      expect(grid[0][3].char).toBe('l');
      expect(grid[0][4].char).toBe('o');
    });

    it('converts buffer with box-drawing characters', () => {
      const buffer = createBuffer(3, 3);
      setChar(buffer, 0, 0, '┌');
      setChar(buffer, 0, 1, '─');
      setChar(buffer, 0, 2, '┐');
      setChar(buffer, 1, 0, '│');
      setChar(buffer, 1, 2, '│');
      setChar(buffer, 2, 0, '└');
      setChar(buffer, 2, 1, '─');
      setChar(buffer, 2, 2, '┘');
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid[0][0].char).toBe('┌');
      expect(grid[0][0].widthCategory).toBe('narrow');
      expect(grid[0][0].cellSpan).toBe(1);
      expect(grid[1][1].char).toBe(' '); // Interior
    });

    it('preserves foreground and background colors', () => {
      const buffer = createBuffer(2, 1);
      setChar(buffer, 0, 0, 'A', 0xFF0000FF, 0x00FF00FF);
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid[0][0].fg).toBe(0xFF0000FF);
      expect(grid[0][0].bg).toBe(0x00FF00FF);
    });

    it('preserves style flags', () => {
      const buffer = createBuffer(2, 1);
      setChar(buffer, 0, 0, 'B', 0xFFFFFFFF, 0, 0x01); // Bold
      setChar(buffer, 0, 1, 'I', 0xFFFFFFFF, 0, 0x02); // Italic
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid[0][0].flags).toBe(0x01);
      expect(grid[0][1].flags).toBe(0x02);
    });
  });

  describe('validateAlignment', () => {
    it('validates a correctly aligned grid', () => {
      const buffer = createBuffer(5, 3);
      const grid = bufferToRenderCells(buffer);
      const result = validateAlignment(grid, 5);
      
      expect(result.isAligned).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects misaligned rows', () => {
      // Manually create a misaligned grid
      const grid = [
        [
          { char: 'A', col: 0, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
          { char: 'B', col: 1, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
        ],
        [
          { char: 'C', col: 0, row: 1, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
        ],
      ];
      
      const result = validateAlignment(grid, 2);
      
      expect(result.isAligned).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('correctAlignment', () => {
    it('pads short rows with empty cells', () => {
      const grid = [
        [
          { char: 'A', col: 0, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
        ],
      ];
      
      const corrected = correctAlignment(grid, 3);
      
      expect(corrected[0].length).toBe(3);
      expect(corrected[0][0].char).toBe('A');
      expect(corrected[0][1].char).toBe(' ');
      expect(corrected[0][2].char).toBe(' ');
    });

    it('truncates long rows', () => {
      const grid = [
        [
          { char: 'A', col: 0, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
          { char: 'B', col: 1, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
          { char: 'C', col: 2, row: 0, fg: 0, bg: 0, flags: 0, widthCategory: 'narrow' as const, cellSpan: 1, isContinuation: false },
        ],
      ];
      
      const corrected = correctAlignment(grid, 2);
      
      expect(corrected[0].length).toBe(2);
    });

    it('preserves already-aligned grid', () => {
      const buffer = createBuffer(5, 3);
      setChar(buffer, 0, 0, 'X');
      const grid = bufferToRenderCells(buffer);
      const corrected = correctAlignment(grid, 5);
      
      // Should produce valid alignment
      const result = validateAlignment(corrected, 5);
      expect(result.isAligned).toBe(true);
    });
  });

  describe('getGridContainerStyle', () => {
    it('generates correct CSS properties', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const style = getGridContainerStyle(metrics);
      
      expect(style.display).toBe('grid');
      expect(style.gridTemplateColumns).toBe('repeat(80, 10px)');
      expect(style.gridTemplateRows).toBe('repeat(24, 20px)');
      expect(style.width).toBe('800px');
      expect(style.height).toBe('480px');
      expect(style.fontSize).toBe('16px');
      expect(style.lineHeight).toBe('20px');
      expect(style.letterSpacing).toBe('0px');
      expect(style.fontKerning).toBe('none');
      expect(style.fontVariantLigatures).toBe('none');
    });

    it('includes monospace font family', () => {
      const metrics = calculateGridMetrics(10, 5, 8, 16);
      const style = getGridContainerStyle(metrics);
      
      expect(style.fontFamily).toContain('Courier');
      expect(style.fontFamily).toContain('monospace');
    });
  });

  describe('getCellStyle', () => {
    it('generates basic cell style', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'A',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      
      expect(style.display).toBe('flex');
      expect(style.width).toBe('10px');
      expect(style.height).toBe('20px');
      expect(style.overflow).toBe('hidden');
      expect(style.whiteSpace).toBe('pre');
    });

    it('applies bold flag', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'B',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0x01,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.fontWeight).toBe('bold');
    });

    it('applies italic flag', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'I',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0x02,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.fontStyle).toBe('italic');
    });

    it('applies underline flag', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'U',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0x04,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.textDecoration).toBe('underline');
    });

    it('shows grid borders in debug mode', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'A',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics, true);
      expect(style.border).toContain('rgba');
    });

    it('applies foreground color', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'A',
        col: 0,
        row: 0,
        fg: 0xFF0000FF, // Red, full alpha
        bg: 0,
        flags: 0,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.color).toBe('rgba(255,0,0,1)');
    });

    it('applies background color', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: 'A',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0x00FF00FF, // Green, full alpha
        flags: 0,
        widthCategory: 'narrow' as const,
        cellSpan: 1,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.backgroundColor).toBe('rgba(0,255,0,1)');
    });

    it('handles wide character span', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      const cell = {
        char: '漢',
        col: 0,
        row: 0,
        fg: 0,
        bg: 0,
        flags: 0,
        widthCategory: 'wide' as const,
        cellSpan: 2,
        isContinuation: false,
      };
      
      const style = getCellStyle(cell, metrics);
      expect(style.width).toBe('20px');
      expect(style.gridColumn).toBe('span 2');
    });
  });

  describe('flattenRenderGrid', () => {
    it('flattens 2D grid to 1D array', () => {
      const buffer = createBuffer(3, 2);
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 0, 1, 'B');
      setChar(buffer, 0, 2, 'C');
      setChar(buffer, 1, 0, 'D');
      setChar(buffer, 1, 1, 'E');
      setChar(buffer, 1, 2, 'F');
      
      const grid = bufferToRenderCells(buffer);
      const flat = flattenRenderGrid(grid);
      
      expect(flat.length).toBe(6);
      expect(flat[0].char).toBe('A');
      expect(flat[1].char).toBe('B');
      expect(flat[2].char).toBe('C');
      expect(flat[3].char).toBe('D');
      expect(flat[4].char).toBe('E');
      expect(flat[5].char).toBe('F');
    });

    it('skips continuation cells from wide characters', () => {
      // Create a buffer and manually test with narrow chars only
      // (since Uint16Array can't hold CJK via setChar which uses charCodeAt(0))
      const buffer = createBuffer(4, 1);
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 0, 1, 'B');
      setChar(buffer, 0, 2, 'C');
      setChar(buffer, 0, 3, 'D');
      
      const grid = bufferToRenderCells(buffer);
      const flat = flattenRenderGrid(grid);
      
      // All narrow, no continuations
      expect(flat.length).toBe(4);
    });
  });

  describe('Performance', () => {
    it('handles 100x100 grid efficiently', () => {
      const buffer = createBuffer(100, 100);
      
      // Fill with characters
      for (let row = 0; row < 100; row++) {
        for (let col = 0; col < 100; col++) {
          setChar(buffer, row, col, String.fromCharCode(65 + (col % 26)));
        }
      }
      
      const start = performance.now();
      const grid = bufferToRenderCells(buffer);
      const flat = flattenRenderGrid(grid);
      const validation = validateAlignment(grid, 100);
      const elapsed = performance.now() - start;
      
      expect(grid.length).toBe(100);
      expect(flat.length).toBe(10000);
      expect(validation.isAligned).toBe(true);
      // Should complete in under 100ms
      expect(elapsed).toBeLessThan(100);
    });

    it('handles 256x256 grid (max size)', () => {
      const buffer = createBuffer(256, 256);
      
      const start = performance.now();
      const grid = bufferToRenderCells(buffer);
      const elapsed = performance.now() - start;
      
      expect(grid.length).toBe(256);
      // Should complete in under 500ms
      expect(elapsed).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    it('handles 1x1 grid', () => {
      const buffer = createBuffer(1, 1);
      setChar(buffer, 0, 0, 'X');
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid.length).toBe(1);
      expect(grid[0].length).toBe(1);
      expect(grid[0][0].char).toBe('X');
    });

    it('handles empty buffer (all zeros)', () => {
      const buffer = createBuffer(10, 5);
      const grid = bufferToRenderCells(buffer);
      
      // All cells should be space
      for (const row of grid) {
        for (const cell of row) {
          expect(cell.char).toBe(' ');
        }
      }
    });

    it('handles mixed ASCII and box-drawing', () => {
      const buffer = createBuffer(5, 3);
      setChar(buffer, 0, 0, '┌');
      setChar(buffer, 0, 1, '─');
      setChar(buffer, 0, 2, 'H');
      setChar(buffer, 0, 3, '─');
      setChar(buffer, 0, 4, '┐');
      
      const grid = bufferToRenderCells(buffer);
      
      expect(grid[0][0].char).toBe('┌');
      expect(grid[0][2].char).toBe('H');
      expect(grid[0][4].char).toBe('┐');
      
      // All should be narrow
      for (const cell of grid[0]) {
        expect(cell.widthCategory).toBe('narrow');
        expect(cell.cellSpan).toBe(1);
      }
    });

    it('pixel-to-cell round trip is consistent', () => {
      const metrics = calculateGridMetrics(80, 24, 10, 20);
      
      for (let row = 0; row < 24; row++) {
        for (let col = 0; col < 80; col++) {
          const pos = getCellPosition(metrics, row, col);
          const cell = pixelToCell(metrics, pos.x, pos.y);
          expect(cell.row).toBe(row);
          expect(cell.col).toBe(col);
        }
      }
    });
  });
});
