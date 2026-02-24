import { describe, it, expect } from 'vitest';
import { createBuffer, setChar, getChar, resizeBuffer, getIndex } from './buffer';

describe('Buffer', () => {
  describe('createBuffer', () => {
    it('creates a buffer with specified dimensions', () => {
      const buffer = createBuffer(80, 24);
      
      expect(buffer.width).toBe(80);
      expect(buffer.height).toBe(24);
      expect(buffer.chars.length).toBe(80 * 24);
      expect(buffer.fg.length).toBe(80 * 24);
      expect(buffer.bg.length).toBe(80 * 24);
      expect(buffer.flags.length).toBe(80 * 24);
    });

    it('enforces minimum dimensions of 1×1', () => {
      expect(() => createBuffer(0, 24)).toThrow('Width must be between 1 and 256');
      expect(() => createBuffer(80, 0)).toThrow('Height must be between 1 and 256');
    });

    it('enforces maximum dimensions of 256×256', () => {
      expect(() => createBuffer(257, 24)).toThrow('Width must be between 1 and 256');
      expect(() => createBuffer(80, 257)).toThrow('Height must be between 1 and 256');
    });

    it('accepts dimensions of exactly 1×1', () => {
      const buffer = createBuffer(1, 1);
      expect(buffer.width).toBe(1);
      expect(buffer.height).toBe(1);
    });

    it('accepts dimensions of exactly 256×256', () => {
      const buffer = createBuffer(256, 256);
      expect(buffer.width).toBe(256);
      expect(buffer.height).toBe(256);
    });
  });

  describe('getIndex', () => {
    it('calculates correct index for row-major layout', () => {
      expect(getIndex(80, 0, 0)).toBe(0);
      expect(getIndex(80, 0, 79)).toBe(79);
      expect(getIndex(80, 1, 0)).toBe(80);
      expect(getIndex(80, 1, 1)).toBe(81);
    });
  });

  describe('setChar and getChar', () => {
    it('can set and get characters', () => {
      const buffer = createBuffer(10, 10);
      
      setChar(buffer, 5, 5, 'A');
      expect(getChar(buffer, 5, 5)).toBe('A');
    });

    it('returns space for empty cells', () => {
      const buffer = createBuffer(10, 10);
      expect(getChar(buffer, 0, 0)).toBe(' ');
    });
  });

  describe('resizeBuffer', () => {
    it('preserves content when enlarging', () => {
      const buffer = createBuffer(5, 5);
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 4, 4, 'B');
      
      const resized = resizeBuffer(buffer, 10, 10);
      
      expect(resized.width).toBe(10);
      expect(resized.height).toBe(10);
      expect(getChar(resized, 0, 0)).toBe('A');
      expect(getChar(resized, 4, 4)).toBe('B');
    });

    it('preserves content when shrinking', () => {
      const buffer = createBuffer(10, 10);
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 2, 2, 'B');
      setChar(buffer, 9, 9, 'C'); // will be lost
      
      const resized = resizeBuffer(buffer, 5, 5);
      
      expect(resized.width).toBe(5);
      expect(resized.height).toBe(5);
      expect(getChar(resized, 0, 0)).toBe('A');
      expect(getChar(resized, 2, 2)).toBe('B');
      // Character at 9,9 is lost because it's outside new bounds
    });

    it('handles non-square resizes', () => {
      const buffer = createBuffer(10, 5);
      setChar(buffer, 0, 0, 'A');
      
      const resized = resizeBuffer(buffer, 5, 10);
      
      expect(resized.width).toBe(5);
      expect(resized.height).toBe(10);
      expect(getChar(resized, 0, 0)).toBe('A');
    });

    it('enforces dimension constraints on resize', () => {
      const buffer = createBuffer(10, 10);
      
      expect(() => resizeBuffer(buffer, 0, 10)).toThrow('Width must be between 1 and 256');
      expect(() => resizeBuffer(buffer, 10, 0)).toThrow('Height must be between 1 and 256');
      expect(() => resizeBuffer(buffer, 257, 10)).toThrow('Width must be between 1 and 256');
      expect(() => resizeBuffer(buffer, 10, 257)).toThrow('Height must be between 1 and 256');
    });
  });
});
