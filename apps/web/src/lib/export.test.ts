import { describe, it, expect } from 'vitest';
import { 
  compositeBuffers, 
  bufferToPlainText, 
  bufferToMarkdown,
  exportAsPlainText,
  exportAsMarkdown
} from './export';
import { createBuffer, createLayer } from '@/types/canvas';

describe('export utilities', () => {
  describe('compositeBuffers', () => {
    it('should composite a single layer', () => {
      const layer = createLayer('Layer 1', 5, 3);
      
      // Set some characters
      layer.buffer.chars[0] = 'H'.charCodeAt(0);
      layer.buffer.chars[1] = 'i'.charCodeAt(0);
      
      const result = compositeBuffers([layer], 5, 3);
      
      expect(result.chars[0]).toBe('H'.charCodeAt(0));
      expect(result.chars[1]).toBe('i'.charCodeAt(0));
    });

    it('should skip invisible layers', () => {
      const layer1 = createLayer('Layer 1', 5, 3);
      const layer2 = createLayer('Layer 2', 5, 3);
      
      layer1.buffer.chars[0] = 'A'.charCodeAt(0);
      layer2.buffer.chars[0] = 'B'.charCodeAt(0);
      layer2.visible = false;
      
      const result = compositeBuffers([layer1, layer2], 5, 3);
      
      expect(result.chars[0]).toBe('A'.charCodeAt(0));
    });

    it('should composite multiple layers with later layers on top', () => {
      const layer1 = createLayer('Layer 1', 5, 3);
      const layer2 = createLayer('Layer 2', 5, 3);
      
      layer1.buffer.chars[0] = 'A'.charCodeAt(0);
      layer2.buffer.chars[0] = 'B'.charCodeAt(0);
      
      const result = compositeBuffers([layer1, layer2], 5, 3);
      
      // Layer 2 should be on top
      expect(result.chars[0]).toBe('B'.charCodeAt(0));
    });

    it('should handle layer offsets', () => {
      const layer = createLayer('Layer 1', 3, 2);
      layer.x = 1;
      layer.y = 1;
      
      layer.buffer.chars[0] = 'X'.charCodeAt(0);
      
      const result = compositeBuffers([layer], 5, 5);
      
      // Character should be at offset position (1, 1)
      const offsetIndex = 1 * 5 + 1; // row 1, col 1
      expect(result.chars[offsetIndex]).toBe('X'.charCodeAt(0));
      expect(result.chars[0]).toBe(0); // Original position should be empty
    });
  });

  describe('bufferToPlainText', () => {
    it('should convert buffer to plain text', () => {
      const buffer = createBuffer(5, 2);
      
      // First row: "Hello"
      'Hello'.split('').forEach((char, i) => {
        buffer.chars[i] = char.charCodeAt(0);
      });
      
      // Second row: "World"
      'World'.split('').forEach((char, i) => {
        buffer.chars[5 + i] = char.charCodeAt(0);
      });
      
      const result = bufferToPlainText(buffer);
      
      expect(result).toBe('Hello\nWorld');
    });

    it('should trim trailing whitespace from each line', () => {
      const buffer = createBuffer(10, 2);
      
      // First row: "Hi" followed by spaces
      'Hi'.split('').forEach((char, i) => {
        buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = bufferToPlainText(buffer);
      const lines = result.split('\n');
      
      expect(lines[0]).toBe('Hi');
      expect(lines[0].length).toBe(2);
    });

    it('should remove trailing empty lines', () => {
      const buffer = createBuffer(5, 5);
      
      // Only first row has content
      'Hello'.split('').forEach((char, i) => {
        buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = bufferToPlainText(buffer);
      
      expect(result).toBe('Hello');
      expect(result.split('\n').length).toBe(1);
    });

    it('should handle empty buffer', () => {
      const buffer = createBuffer(5, 5);
      
      const result = bufferToPlainText(buffer);
      
      expect(result).toBe('');
    });
  });

  describe('bufferToMarkdown', () => {
    it('should wrap text in code block', () => {
      const buffer = createBuffer(5, 1);
      
      'Hello'.split('').forEach((char, i) => {
        buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = bufferToMarkdown(buffer);
      
      expect(result).toBe('```ascii\nHello\n```');
    });

    it('should support custom language hint', () => {
      const buffer = createBuffer(5, 1);
      
      'Hello'.split('').forEach((char, i) => {
        buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = bufferToMarkdown(buffer, 'txt');
      
      expect(result).toBe('```txt\nHello\n```');
    });
  });

  describe('exportAsPlainText', () => {
    it('should export visible layers as plain text', () => {
      const layer = createLayer('Layer 1', 5, 1);
      
      'Hello'.split('').forEach((char, i) => {
        layer.buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = exportAsPlainText([layer], 5, 1);
      
      expect(result).toBe('Hello');
    });
  });

  describe('exportAsMarkdown', () => {
    it('should export visible layers as markdown', () => {
      const layer = createLayer('Layer 1', 5, 1);
      
      'Hello'.split('').forEach((char, i) => {
        layer.buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = exportAsMarkdown([layer], 5, 1);
      
      expect(result).toBe('```ascii\nHello\n```');
    });

    it('should support custom language hint', () => {
      const layer = createLayer('Layer 1', 5, 1);
      
      'Hello'.split('').forEach((char, i) => {
        layer.buffer.chars[i] = char.charCodeAt(0);
      });
      
      const result = exportAsMarkdown([layer], 5, 1, 'text');
      
      expect(result).toBe('```text\nHello\n```');
    });
  });
});
