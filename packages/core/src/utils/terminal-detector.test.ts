/**
 * Tests for terminal detection and capability assessment
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectTerminalCapabilities,
  isTerminalWideEnough,
  getMaxUsableWidth,
  getMaxUsableHeight
} from './terminal-detector';

describe('Terminal Detector', () => {
  const originalEnv = process.env;
  const originalStdout = process.stdout;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('detectTerminalCapabilities', () => {
    it('should detect basic terminal capabilities', () => {
      const caps = detectTerminalCapabilities();
      
      expect(caps).toHaveProperty('width');
      expect(caps).toHaveProperty('height');
      expect(caps).toHaveProperty('supportsColor');
      expect(caps).toHaveProperty('colorLevel');
      expect(caps).toHaveProperty('supportsUnicode');
      expect(caps).toHaveProperty('supportsBoxDrawing');
      expect(caps).toHaveProperty('terminalType');
      expect(caps).toHaveProperty('isInteractive');
      
      expect(typeof caps.width).toBe('number');
      expect(typeof caps.height).toBe('number');
      expect(caps.width).toBeGreaterThan(0);
      expect(caps.height).toBeGreaterThan(0);
    });

    it('should respect NO_COLOR environment variable', () => {
      process.env.NO_COLOR = '1';
      const caps = detectTerminalCapabilities();
      
      expect(caps.supportsColor).toBe(false);
      expect(caps.colorLevel).toBe(0);
    });

    it('should detect truecolor from COLORTERM', () => {
      process.env.COLORTERM = 'truecolor';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });
      
      const caps = detectTerminalCapabilities();
      
      expect(caps.colorLevel).toBe(3);
    });

    it('should detect 256 color from TERM', () => {
      process.env.TERM = 'xterm-256color';
      Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        writable: true,
        configurable: true
      });
      
      const caps = detectTerminalCapabilities();
      
      expect(caps.colorLevel).toBeGreaterThanOrEqual(2);
    });

    it('should fallback to default dimensions', () => {
      // Mock stdout without dimensions
      Object.defineProperty(process.stdout, 'columns', {
        value: undefined,
        writable: true,
        configurable: true
      });
      Object.defineProperty(process.stdout, 'rows', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      const caps = detectTerminalCapabilities();
      
      expect(caps.width).toBe(80); // Default fallback
      expect(caps.height).toBe(24); // Default fallback
    });
  });

  describe('isTerminalWideEnough', () => {
    it('should check if terminal is wide enough', () => {
      const caps = {
        width: 100,
        height: 40,
        supportsColor: true,
        colorLevel: 3 as const,
        supportsUnicode: true,
        supportsBoxDrawing: true,
        terminalType: 'xterm',
        isInteractive: true
      };
      
      expect(isTerminalWideEnough(80, caps)).toBe(true);
      expect(isTerminalWideEnough(120, caps)).toBe(false);
    });
  });

  describe('getMaxUsableWidth', () => {
    it('should return width with margins', () => {
      const caps = {
        width: 80,
        height: 40,
        supportsColor: true,
        colorLevel: 3 as const,
        supportsUnicode: true,
        supportsBoxDrawing: true,
        terminalType: 'xterm',
        isInteractive: true
      };
      
      const maxWidth = getMaxUsableWidth(caps);
      
      expect(maxWidth).toBe(76); // 80 - 4 (2 char margins on each side)
    });

    it('should have minimum width of 1', () => {
      const caps = {
        width: 2,
        height: 40,
        supportsColor: true,
        colorLevel: 3 as const,
        supportsUnicode: true,
        supportsBoxDrawing: true,
        terminalType: 'xterm',
        isInteractive: true
      };
      
      const maxWidth = getMaxUsableWidth(caps);
      
      expect(maxWidth).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getMaxUsableHeight', () => {
    it('should return height with margins', () => {
      const caps = {
        width: 80,
        height: 40,
        supportsColor: true,
        colorLevel: 3 as const,
        supportsUnicode: true,
        supportsBoxDrawing: true,
        terminalType: 'xterm',
        isInteractive: true
      };
      
      const maxHeight = getMaxUsableHeight(caps);
      
      expect(maxHeight).toBe(38); // 40 - 2 (UI chrome)
    });

    it('should have minimum height of 1', () => {
      const caps = {
        width: 80,
        height: 1,
        supportsColor: true,
        colorLevel: 3 as const,
        supportsUnicode: true,
        supportsBoxDrawing: true,
        terminalType: 'xterm',
        isInteractive: true
      };
      
      const maxHeight = getMaxUsableHeight(caps);
      
      expect(maxHeight).toBeGreaterThanOrEqual(1);
    });
  });
});
