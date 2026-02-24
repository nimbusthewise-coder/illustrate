import { describe, it, expect } from 'vitest';
import { floodFill, canFill, getFillBounds } from './floodFill';

describe('floodFill', () => {
  it('fills a single isolated cell', () => {
    // Grid: X . .
    //       . . .
    //       . . .
    const chars = ['X', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
    const result = floodFill(chars, 3, 3, 0, 0);
    
    expect(result.targetChar).toBe('X');
    expect(result.positions).toHaveLength(1);
    expect(result.positions[0]).toEqual({ row: 0, col: 0 });
  });

  it('fills a connected horizontal line', () => {
    // Grid: X X X
    //       . . .
    //       . . .
    const chars = ['X', 'X', 'X', ' ', ' ', ' ', ' ', ' ', ' '];
    const result = floodFill(chars, 3, 3, 0, 1);
    
    expect(result.targetChar).toBe('X');
    expect(result.positions).toHaveLength(3);
  });

  it('fills a connected vertical line', () => {
    // Grid: X . .
    //       X . .
    //       X . .
    const chars = ['X', ' ', ' ', 'X', ' ', ' ', 'X', ' ', ' '];
    const result = floodFill(chars, 3, 3, 1, 0);
    
    expect(result.targetChar).toBe('X');
    expect(result.positions).toHaveLength(3);
  });

  it('fills a rectangular region', () => {
    // Grid: X X X
    //       X X X
    //       X X X
    const chars = ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
    const result = floodFill(chars, 3, 3, 1, 1);
    
    expect(result.targetChar).toBe('X');
    expect(result.positions).toHaveLength(9);
  });

  it('fills only connected cells, not disconnected ones', () => {
    // Grid: X X .
    //       X X .
    //       . . X
    const chars = ['X', 'X', ' ', 'X', 'X', ' ', ' ', ' ', 'X'];
    const result = floodFill(chars, 3, 3, 0, 0);
    
    expect(result.targetChar).toBe('X');
    expect(result.positions).toHaveLength(4); // Only top-left 2x2 block
    
    const positions = result.positions.map(p => `${p.row},${p.col}`);
    expect(positions).toContain('0,0');
    expect(positions).toContain('0,1');
    expect(positions).toContain('1,0');
    expect(positions).toContain('1,1');
    expect(positions).not.toContain('2,2'); // Disconnected cell
  });

  it('fills empty spaces', () => {
    // Grid: X . .
    //       X . .
    //       X X X
    const chars = ['X', ' ', ' ', 'X', ' ', ' ', 'X', 'X', 'X'];
    const result = floodFill(chars, 3, 3, 0, 1);
    
    expect(result.targetChar).toBe(' ');
    expect(result.positions).toHaveLength(4); // The 2x2 space region
  });

  it('handles out of bounds starting position', () => {
    const chars = ['X', 'X', 'X', 'X', 'X', 'X', 'X', 'X', 'X'];
    
    const result1 = floodFill(chars, 3, 3, -1, 0);
    expect(result1.positions).toHaveLength(0);
    
    const result2 = floodFill(chars, 3, 3, 0, 5);
    expect(result2.positions).toHaveLength(0);
    
    const result3 = floodFill(chars, 3, 3, 5, 5);
    expect(result3.positions).toHaveLength(0);
  });

  it('handles complex maze-like pattern', () => {
    // Grid: . X .
    //       . X .
    //       . . .
    const chars = [' ', 'X', ' ', ' ', 'X', ' ', ' ', ' ', ' '];
    const result = floodFill(chars, 3, 3, 0, 0);
    
    expect(result.targetChar).toBe(' ');
    // Should fill: (0,0), (1,0), (2,0), (2,1), (2,2), (1,2), (0,2)
    expect(result.positions.length).toBeGreaterThan(4);
  });

  it('handles large connected region efficiently', () => {
    // Create a 100x100 grid filled with 'A'
    const size = 100;
    const chars = new Array(size * size).fill('A');
    
    const start = performance.now();
    const result = floodFill(chars, size, size, 50, 50);
    const duration = performance.now() - start;
    
    expect(result.positions).toHaveLength(size * size);
    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });
});

describe('canFill', () => {
  it('returns false if target equals new character', () => {
    const chars = ['X', 'X', 'X'];
    expect(canFill(chars, 3, 1, 0, 1, 'X')).toBe(false);
  });

  it('returns true if target differs from new character', () => {
    const chars = ['X', 'X', 'X'];
    expect(canFill(chars, 3, 1, 0, 1, 'Y')).toBe(true);
  });

  it('returns false for out of bounds position', () => {
    const chars = ['X', 'X', 'X'];
    expect(canFill(chars, 3, 1, 0, 5, 'Y')).toBe(false);
    expect(canFill(chars, 3, 1, -1, 0, 'Y')).toBe(false);
  });
});

describe('getFillBounds', () => {
  it('returns null for empty positions', () => {
    expect(getFillBounds([])).toBeNull();
  });

  it('returns correct bounds for single position', () => {
    const positions = [{ row: 5, col: 10 }];
    const bounds = getFillBounds(positions);
    
    expect(bounds).toEqual({
      minRow: 5,
      maxRow: 5,
      minCol: 10,
      maxCol: 10,
    });
  });

  it('returns correct bounds for multiple positions', () => {
    const positions = [
      { row: 2, col: 3 },
      { row: 5, col: 8 },
      { row: 1, col: 4 },
      { row: 3, col: 2 },
    ];
    const bounds = getFillBounds(positions);
    
    expect(bounds).toEqual({
      minRow: 1,
      maxRow: 5,
      minCol: 2,
      maxCol: 8,
    });
  });
});
