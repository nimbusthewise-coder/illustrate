/**
 * Tests for terminal color utilities
 */

import { describe, it, expect } from 'vitest';
import {
  ANSI,
  rgbaToAnsi,
  stripAnsi,
  visualWidth,
  colorize
} from './terminal-colors';
import type { TerminalCapabilities } from './terminal-detector';

describe('Terminal Colors', () => {
  const noColorCaps: TerminalCapabilities = {
    width: 80,
    height: 24,
    supportsColor: false,
    colorLevel: 0,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    terminalType: 'dumb',
    isInteractive: false
  };

  const basicColorCaps: TerminalCapabilities = {
    width: 80,
    height: 24,
    supportsColor: true,
    colorLevel: 1,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    terminalType: 'xterm',
    isInteractive: true
  };

  const trueColorCaps: TerminalCapabilities = {
    width: 80,
    height: 24,
    supportsColor: true,
    colorLevel: 3,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    terminalType: 'xterm-256color',
    isInteractive: true
  };

  describe('ANSI constants', () => {
    it('should have basic color codes', () => {
      expect(ANSI.reset).toBe('\x1b[0m');
      expect(ANSI.red).toBe('\x1b[31m');
      expect(ANSI.green).toBe('\x1b[32m');
      expect(ANSI.blue).toBe('\x1b[34m');
    });

    it('should have background color codes', () => {
      expect(ANSI.bgRed).toBe('\x1b[41m');
      expect(ANSI.bgGreen).toBe('\x1b[42m');
      expect(ANSI.bgBlue).toBe('\x1b[44m');
    });
  });

  describe('rgbaToAnsi', () => {
    it('should return empty string for no color support', () => {
      const rgba = 0xFF0000FF; // Red, fully opaque
      const result = rgbaToAnsi(rgba, true, noColorCaps);
      
      expect(result).toBe('');
    });

    it('should return empty string for transparent colors', () => {
      const rgba = 0xFF000000; // Red, fully transparent
      const result = rgbaToAnsi(rgba, true, trueColorCaps);
      
      expect(result).toBe('');
    });

    it('should return basic ANSI for level 1', () => {
      const rgba = 0xFF0000FF; // Red, fully opaque
      const result = rgbaToAnsi(rgba, true, basicColorCaps);
      
      expect(result).toContain('\x1b[');
      expect(result).toContain('m');
    });

    it('should return truecolor ANSI for level 3', () => {
      const rgba = 0xFF0000FF; // Red, fully opaque
      const result = rgbaToAnsi(rgba, true, trueColorCaps);
      
      expect(result).toContain('\x1b[38;2;');
      expect(result).toContain('255');
      expect(result).toContain('0');
    });

    it('should differentiate foreground and background', () => {
      const rgba = 0xFF0000FF; // Red, fully opaque
      const fg = rgbaToAnsi(rgba, true, trueColorCaps);
      const bg = rgbaToAnsi(rgba, false, trueColorCaps);
      
      expect(fg).toContain('\x1b[38;2;'); // Foreground code
      expect(bg).toContain('\x1b[48;2;'); // Background code
    });
  });

  describe('stripAnsi', () => {
    it('should remove all ANSI escape codes', () => {
      const text = '\x1b[31mRed\x1b[0m Text \x1b[32mGreen\x1b[0m';
      const result = stripAnsi(text);
      
      expect(result).toBe('Red Text Green');
    });

    it('should handle text without ANSI codes', () => {
      const text = 'Plain text';
      const result = stripAnsi(text);
      
      expect(result).toBe('Plain text');
    });

    it('should handle empty string', () => {
      const result = stripAnsi('');
      
      expect(result).toBe('');
    });
  });

  describe('visualWidth', () => {
    it('should calculate width excluding ANSI codes', () => {
      const text = '\x1b[31mHello\x1b[0m';
      const width = visualWidth(text);
      
      expect(width).toBe(5); // "Hello" is 5 characters
    });

    it('should handle plain text', () => {
      const text = 'Hello';
      const width = visualWidth(text);
      
      expect(width).toBe(5);
    });

    it('should handle multiple color codes', () => {
      const text = '\x1b[31m\x1b[1mBold Red\x1b[0m';
      const width = visualWidth(text);
      
      expect(width).toBe(8); // "Bold Red" is 8 characters
    });
  });

  describe('colorize', () => {
    it('should wrap text with color codes', () => {
      const rgba = 0xFF0000FF; // Red
      const result = colorize('Hello', rgba, null, trueColorCaps);
      
      expect(result).toContain('\x1b[38;2;');
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[0m');
    });

    it('should return plain text for no color support', () => {
      const rgba = 0xFF0000FF; // Red
      const result = colorize('Hello', rgba, null, noColorCaps);
      
      expect(result).toBe('Hello');
    });

    it('should handle both foreground and background', () => {
      const fgRgba = 0xFF0000FF; // Red
      const bgRgba = 0x0000FFFF; // Blue
      const result = colorize('Hello', fgRgba, bgRgba, trueColorCaps);
      
      expect(result).toContain('\x1b[38;2;'); // Foreground
      expect(result).toContain('\x1b[48;2;'); // Background
      expect(result).toContain('Hello');
      expect(result).toContain('\x1b[0m');
    });

    it('should handle null colors', () => {
      const result = colorize('Hello', null, null, trueColorCaps);
      
      expect(result).toBe('Hello');
    });
  });
});
