/**
 * Tests for F041: Plain ASCII text export
 * Tests for F042: Markdown code block export
 * Tests for F045: Copy to clipboard (rich format with ANSI codes)
 * Tests for F028: LLM-Readable Export Format with Semantic Annotations
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, setChar } from './buffer.js';
import { createLayer, compositeLayers } from './layer.js';
import {
  bufferToAscii, exportPlainAscii, exportMarkdownCodeBlock,
  bufferToAnsiText, exportAnsiText,
  exportLLMFormat, exportLLMFormatAsText,
  calculateSpatialRelationships, extractComponentInstances,
  type ComponentInstance
} from './export.js';
import type { CanvasDocument, DesignSystem } from './types.js';

describe('F041: Plain ASCII text export', () => {
  describe('bufferToAscii', () => {
    it('should export a simple buffer to ASCII text', () => {
      const buffer = createBuffer(5, 3);
      setChar(buffer, 0, 0, 'H');
      setChar(buffer, 0, 1, 'e');
      setChar(buffer, 0, 2, 'l');
      setChar(buffer, 0, 3, 'l');
      setChar(buffer, 0, 4, 'o');
      setChar(buffer, 1, 0, 'W');
      setChar(buffer, 1, 1, 'o');
      setChar(buffer, 1, 2, 'r');
      setChar(buffer, 1, 3, 'l');
      setChar(buffer, 1, 4, 'd');

      const result = bufferToAscii(buffer);
      
      expect(result).toBe('Hello\nWorld\n');
    });

    it('should trim trailing whitespace from each row', () => {
      const buffer = createBuffer(10, 2);
      setChar(buffer, 0, 0, 'T');
      setChar(buffer, 0, 1, 'e');
      setChar(buffer, 0, 2, 's');
      setChar(buffer, 0, 3, 't');
      // Columns 4-9 are empty (spaces)
      
      setChar(buffer, 1, 0, 'L');
      setChar(buffer, 1, 1, 'i');
      setChar(buffer, 1, 2, 'n');
      setChar(buffer, 1, 3, 'e');
      setChar(buffer, 1, 4, '2');
      // Columns 5-9 are empty

      const result = bufferToAscii(buffer);
      
      expect(result).toBe('Test\nLine2');
    });

    it('should handle empty buffer', () => {
      const buffer = createBuffer(5, 3);
      const result = bufferToAscii(buffer);
      
      // Each row is empty, so after trimming we get 3 empty lines
      expect(result).toBe('\n\n');
    });

    it('should preserve internal spaces', () => {
      const buffer = createBuffer(10, 1);
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 0, 1, ' ');
      setChar(buffer, 0, 2, ' ');
      setChar(buffer, 0, 3, 'B');
      // Rest is empty

      const result = bufferToAscii(buffer);
      
      expect(result).toBe('A  B');
    });
  });

  describe('compositeLayers', () => {
    it('should composite single visible layer', () => {
      const layer = createLayer('layer1', 'Layer 1', 5, 2);

      setChar(layer.buffer, 0, 0, 'A');
      setChar(layer.buffer, 0, 1, 'B');
      setChar(layer.buffer, 1, 0, 'C');
      setChar(layer.buffer, 1, 1, 'D');

      const result = compositeLayers([layer], 5, 2);
      const ascii = bufferToAscii(result);

      expect(ascii).toBe('AB\nCD');
    });

    it('should skip invisible layers', () => {
      const layer1 = createLayer('layer1', 'Layer 1', 5, 2);
      const layer2 = createLayer('layer2', 'Layer 2', 5, 2);
      layer2.visible = false; // Hide this layer

      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer2.buffer, 0, 0, 'X'); // Should not appear

      const result = compositeLayers([layer1, layer2], 5, 2);
      const ascii = bufferToAscii(result);

      expect(ascii).toBe('A\n');
    });

    it('should composite overlapping layers (top layer wins)', () => {
      const layer1 = createLayer('layer1', 'Bottom', 5, 2);
      const layer2 = createLayer('layer2', 'Top', 5, 2);

      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer1.buffer, 0, 1, 'B');
      
      setChar(layer2.buffer, 0, 0, 'X'); // Overwrites 'A'

      const result = compositeLayers([layer1, layer2], 5, 2);
      const ascii = bufferToAscii(result);

      expect(ascii).toBe('XB\n');
    });

    it('should handle layer offsets', () => {
      const layer1 = createLayer('layer1', 'Layer 1', 3, 2);
      layer1.x = 2; // Offset 2 columns to the right
      layer1.y = 1; // Offset 1 row down

      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer1.buffer, 0, 1, 'B');
      setChar(layer1.buffer, 1, 0, 'C');

      const result = compositeLayers([layer1], 10, 5);
      const ascii = bufferToAscii(result);

      // Row 0: empty
      // Row 1: "  AB" (2 spaces, then AB)
      // Row 2: "  C"  (2 spaces, then C)
      // Rows 3-4: empty
      expect(ascii).toBe('\n  AB\n  C\n\n');
    });

    it('should clip layers that extend beyond canvas bounds', () => {
      const layer1 = createLayer('layer1', 'Layer 1', 5, 2);
      layer1.x = 3; // Near right edge

      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer1.buffer, 0, 1, 'B');
      setChar(layer1.buffer, 0, 2, 'C'); // This will be clipped
      setChar(layer1.buffer, 0, 3, 'D'); // This will be clipped
      setChar(layer1.buffer, 0, 4, 'E'); // This will be clipped

      const result = compositeLayers([layer1], 5, 2);
      const ascii = bufferToAscii(result);

      // Only "AB" should appear at positions 3-4
      expect(ascii).toBe('   AB\n');
    });
  });

  describe('exportPlainAscii', () => {
    it('should export complete canvas document', () => {
      const layer = createLayer('layer1', 'Layer 1', 10, 3);

      setChar(layer.buffer, 0, 0, '╔');
      setChar(layer.buffer, 0, 1, '═');
      setChar(layer.buffer, 0, 2, '═');
      setChar(layer.buffer, 0, 3, '╗');
      
      setChar(layer.buffer, 1, 0, '║');
      setChar(layer.buffer, 1, 1, 'H');
      setChar(layer.buffer, 1, 2, 'i');
      setChar(layer.buffer, 1, 3, '║');
      
      setChar(layer.buffer, 2, 0, '╚');
      setChar(layer.buffer, 2, 1, '═');
      setChar(layer.buffer, 2, 2, '═');
      setChar(layer.buffer, 2, 3, '╝');

      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test Document',
        width: 10,
        height: 3,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportPlainAscii(document);

      expect(result).toBe('╔══╗\n║Hi║\n╚══╝');
    });

    it('should handle multi-layer documents', () => {
      const bgLayer = createLayer('bg', 'Background', 5, 3);
      const fgLayer = createLayer('fg', 'Foreground', 3, 2);
      fgLayer.x = 1;
      fgLayer.y = 1;

      // Background: dots everywhere
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          setChar(bgLayer.buffer, row, col, '.');
        }
      }

      // Foreground: "OK"
      setChar(fgLayer.buffer, 0, 0, 'O');
      setChar(fgLayer.buffer, 0, 1, 'K');

      const document: CanvasDocument = {
        id: 'doc2',
        title: 'Multi-layer Test',
        width: 5,
        height: 3,
        layers: [bgLayer, fgLayer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportPlainAscii(document);

      // Row 0: .....
      // Row 1: .OK..
      // Row 2: .....
      expect(result).toBe('.....\n.OK..\n.....');
    });

    it('should handle empty document', () => {
      const layer = createLayer('layer1', 'Empty', 10, 5);

      const document: CanvasDocument = {
        id: 'doc3',
        title: 'Empty Document',
        width: 10,
        height: 5,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportPlainAscii(document);

      // All rows are empty, after trimming
      expect(result).toBe('\n\n\n\n');
    });
  });

  describe('F042: exportMarkdownCodeBlock', () => {
    it('should wrap ASCII in code block with no language hint', () => {
      const layer = createLayer('layer1', 'Layer 1', 5, 2);
      setChar(layer.buffer, 0, 0, 'H');
      setChar(layer.buffer, 0, 1, 'i');
      setChar(layer.buffer, 1, 0, 'O');
      setChar(layer.buffer, 1, 1, 'K');

      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test',
        width: 5,
        height: 2,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document);

      expect(result).toBe('```\nHi\nOK\n```');
    });

    it('should wrap ASCII in code block with language hint', () => {
      const layer = createLayer('layer1', 'Layer 1', 10, 3);

      setChar(layer.buffer, 0, 0, '╔');
      setChar(layer.buffer, 0, 1, '═');
      setChar(layer.buffer, 0, 2, '═');
      setChar(layer.buffer, 0, 3, '╗');
      
      setChar(layer.buffer, 1, 0, '║');
      setChar(layer.buffer, 1, 1, 'H');
      setChar(layer.buffer, 1, 2, 'i');
      setChar(layer.buffer, 1, 3, '║');
      
      setChar(layer.buffer, 2, 0, '╚');
      setChar(layer.buffer, 2, 1, '═');
      setChar(layer.buffer, 2, 2, '═');
      setChar(layer.buffer, 2, 3, '╝');

      const document: CanvasDocument = {
        id: 'doc2',
        title: 'Box',
        width: 10,
        height: 3,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, 'ascii');

      expect(result).toBe('```ascii\n╔══╗\n║Hi║\n╚══╝\n```');
    });

    it('should handle different language hints', () => {
      const layer = createLayer('layer1', 'Layer 1', 5, 1);
      setChar(layer.buffer, 0, 0, 'T');
      setChar(layer.buffer, 0, 1, 'e');
      setChar(layer.buffer, 0, 2, 's');
      setChar(layer.buffer, 0, 3, 't');

      const document: CanvasDocument = {
        id: 'doc3',
        title: 'Test',
        width: 5,
        height: 1,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const resultText = exportMarkdownCodeBlock(document, 'text');
      expect(resultText).toBe('```text\nTest\n```');

      const resultPlain = exportMarkdownCodeBlock(document, 'plain');
      expect(resultPlain).toBe('```plain\nTest\n```');
    });

    it('should handle empty document', () => {
      const layer = createLayer('layer1', 'Empty', 5, 2);

      const document: CanvasDocument = {
        id: 'doc4',
        title: 'Empty',
        width: 5,
        height: 2,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document);

      expect(result).toBe('```\n\n\n```');
    });

    it('should handle multi-layer document', () => {
      const bgLayer = createLayer('bg', 'Background', 5, 3);
      const fgLayer = createLayer('fg', 'Foreground', 3, 2);
      fgLayer.x = 1;
      fgLayer.y = 1;

      // Background: dots
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 5; col++) {
          setChar(bgLayer.buffer, row, col, '.');
        }
      }

      // Foreground: "OK"
      setChar(fgLayer.buffer, 0, 0, 'O');
      setChar(fgLayer.buffer, 0, 1, 'K');

      const document: CanvasDocument = {
        id: 'doc5',
        title: 'Multi',
        width: 5,
        height: 3,
        layers: [bgLayer, fgLayer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, 'ascii');

      expect(result).toBe('```ascii\n.....\n.OK..\n.....\n```');
    });

    it('should support title option', () => {
      const layer = createLayer('layer1', 'Layer 1', 5, 1);
      setChar(layer.buffer, 0, 0, 'T');
      setChar(layer.buffer, 0, 1, 'e');
      setChar(layer.buffer, 0, 2, 's');
      setChar(layer.buffer, 0, 3, 't');

      const document: CanvasDocument = {
        id: 'doc6',
        title: 'Test',
        width: 5,
        height: 1,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, {
        language: 'text',
        title: 'My Diagram',
        headingLevel: 2,
      });

      expect(result).toBe('## My Diagram\n\n```text\nTest\n```');
    });

    it('should support metadata option', () => {
      const layer1 = createLayer('layer1', 'Layer 1', 5, 2);
      const layer2 = createLayer('layer2', 'Layer 2', 5, 2);
      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer2.buffer, 1, 0, 'B');

      const document: CanvasDocument = {
        id: 'doc7',
        title: 'Test',
        width: 5,
        height: 2,
        layers: [layer1, layer2],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, {
        includeMetadata: true,
      });

      expect(result).toContain('<!-- Canvas: 5×2 | Layers: 2 -->');
      expect(result).toContain('```\nA\nB\n```');
    });

    it('should support title and metadata together', () => {
      const layer = createLayer('layer1', 'Layer 1', 3, 1);
      setChar(layer.buffer, 0, 0, 'X');

      const document: CanvasDocument = {
        id: 'doc8',
        title: 'Test',
        width: 3,
        height: 1,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, {
        language: 'ascii',
        title: 'Example Diagram',
        headingLevel: 3,
        includeMetadata: true,
      });

      expect(result).toBe('### Example Diagram\n\n<!-- Canvas: 3×1 | Layers: 1 -->\n\n```ascii\nX\n```');
    });

    it('should respect custom heading levels', () => {
      const layer = createLayer('layer1', 'Layer 1', 2, 1);
      setChar(layer.buffer, 0, 0, 'A');

      const document: CanvasDocument = {
        id: 'doc9',
        title: 'Test',
        width: 2,
        height: 1,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result1 = exportMarkdownCodeBlock(document, {
        title: 'H1',
        headingLevel: 1,
      });
      expect(result1).toContain('# H1');

      const result6 = exportMarkdownCodeBlock(document, {
        title: 'H6',
        headingLevel: 6,
      });
      expect(result6).toContain('###### H6');
    });

    it('should clamp heading levels to 1-6 range', () => {
      const layer = createLayer('layer1', 'Layer 1', 2, 1);
      setChar(layer.buffer, 0, 0, 'A');

      const document: CanvasDocument = {
        id: 'doc10',
        title: 'Test',
        width: 2,
        height: 1,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const resultTooLow = exportMarkdownCodeBlock(document, {
        title: 'Clamped',
        headingLevel: 0,
      });
      expect(resultTooLow).toContain('# Clamped'); // Clamped to 1

      const resultTooHigh = exportMarkdownCodeBlock(document, {
        title: 'Clamped',
        headingLevel: 10,
      });
      expect(resultTooHigh).toContain('###### Clamped'); // Clamped to 6
    });

    it('should only count visible layers in metadata', () => {
      const layer1 = createLayer('layer1', 'Layer 1', 3, 1);
      const layer2 = createLayer('layer2', 'Layer 2', 3, 1);
      const layer3 = createLayer('layer3', 'Layer 3', 3, 1);
      
      layer2.visible = false; // Hide this one
      
      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer3.buffer, 0, 0, 'C');

      const document: CanvasDocument = {
        id: 'doc11',
        title: 'Test',
        width: 3,
        height: 1,
        layers: [layer1, layer2, layer3],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportMarkdownCodeBlock(document, {
        includeMetadata: true,
      });

      // Should show 2 layers (layer1 and layer3), not 3
      expect(result).toContain('<!-- Canvas: 3×1 | Layers: 2 -->');
    });
  });

  describe('F045: bufferToAnsiText', () => {
    it('should export plain text without colors', () => {
      const buffer = createBuffer(5, 2);
      setChar(buffer, 0, 0, 'H');
      setChar(buffer, 0, 1, 'e');
      setChar(buffer, 0, 2, 'l');
      setChar(buffer, 0, 3, 'l');
      setChar(buffer, 0, 4, 'o');
      setChar(buffer, 1, 0, 'W');
      setChar(buffer, 1, 1, 'o');
      setChar(buffer, 1, 2, 'r');
      setChar(buffer, 1, 3, 'l');
      setChar(buffer, 1, 4, 'd');

      const result = bufferToAnsiText(buffer);
      
      // No colors applied, so should be same as plain text
      expect(result).toBe('Hello\nWorld');
    });

    it('should include ANSI color codes for colored text', () => {
      const buffer = createBuffer(3, 1);
      // Red text (0xFF0000FF in RGBA)
      setChar(buffer, 0, 0, 'R', 0xFF0000FF, 0x00000000);
      // Green text (0x00FF00FF in RGBA)
      setChar(buffer, 0, 1, 'G', 0x00FF00FF, 0x00000000);
      // Blue text (0x0000FFFF in RGBA)
      setChar(buffer, 0, 2, 'B', 0x0000FFFF, 0x00000000);

      const result = bufferToAnsiText(buffer);
      
      // Should contain ANSI color codes
      expect(result).toContain('\x1b[38;2;255;0;0m'); // Red foreground
      expect(result).toContain('\x1b[38;2;0;255;0m'); // Green foreground
      expect(result).toContain('\x1b[38;2;0;0;255m'); // Blue foreground
      expect(result).toContain('\x1b[0m'); // Reset at end
      expect(result).toContain('R');
      expect(result).toContain('G');
      expect(result).toContain('B');
    });

    it('should include background color codes', () => {
      const buffer = createBuffer(2, 1);
      // White text on black background
      setChar(buffer, 0, 0, 'A', 0xFFFFFFFF, 0x000000FF);
      // Black text on white background
      setChar(buffer, 0, 1, 'B', 0x000000FF, 0xFFFFFFFF);

      const result = bufferToAnsiText(buffer);
      
      // Should contain foreground and background codes
      expect(result).toContain('\x1b[38;2;'); // Foreground
      expect(result).toContain('\x1b[48;2;'); // Background
      expect(result).toContain('\x1b[0m'); // Reset at end
    });

    it('should trim trailing whitespace from rows', () => {
      const buffer = createBuffer(10, 2);
      setChar(buffer, 0, 0, 'T', 0xFF0000FF, 0x00000000);
      setChar(buffer, 0, 1, 'e', 0xFF0000FF, 0x00000000);
      setChar(buffer, 0, 2, 's', 0xFF0000FF, 0x00000000);
      setChar(buffer, 0, 3, 't', 0xFF0000FF, 0x00000000);
      // Rest is empty

      const result = bufferToAnsiText(buffer);
      
      // Should not have 6 trailing spaces
      expect(result.split('\n')[0]).not.toMatch(/ {6}$/);
    });

    it('should skip transparent colors', () => {
      const buffer = createBuffer(3, 1);
      // Fully transparent foreground (alpha = 0)
      setChar(buffer, 0, 0, 'A', 0xFF000000, 0x00000000);
      setChar(buffer, 0, 1, 'B', 0x00FF0000, 0x00000000);
      setChar(buffer, 0, 2, 'C', 0x0000FF00, 0x00000000);

      const result = bufferToAnsiText(buffer);
      
      // Should not contain any color codes (all transparent)
      expect(result).toBe('ABC');
    });
  });

  describe('F045: exportAnsiText', () => {
    it('should export complete canvas document with colors', () => {
      const layer = createLayer('layer1', 'Layer 1', 5, 2);

      // Red "Hi"
      setChar(layer.buffer, 0, 0, 'H', 0xFF0000FF, 0x00000000);
      setChar(layer.buffer, 0, 1, 'i', 0xFF0000FF, 0x00000000);
      
      // Green "OK"
      setChar(layer.buffer, 1, 0, 'O', 0x00FF00FF, 0x00000000);
      setChar(layer.buffer, 1, 1, 'K', 0x00FF00FF, 0x00000000);

      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Colored Document',
        width: 5,
        height: 2,
        layers: [layer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportAnsiText(document);

      // Should contain color codes
      expect(result).toContain('\x1b[38;2;255;0;0m'); // Red
      expect(result).toContain('\x1b[38;2;0;255;0m'); // Green
      expect(result).toContain('H');
      expect(result).toContain('i');
      expect(result).toContain('O');
      expect(result).toContain('K');
    });

    it('should composite multiple layers with colors', () => {
      const bgLayer = createLayer('bg', 'Background', 5, 2);
      const fgLayer = createLayer('fg', 'Foreground', 2, 1);
      fgLayer.x = 1;
      fgLayer.y = 0;

      // Background: blue dots
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {
          setChar(bgLayer.buffer, row, col, '.', 0x0000FFFF, 0x00000000);
        }
      }

      // Foreground: red "OK"
      setChar(fgLayer.buffer, 0, 0, 'O', 0xFF0000FF, 0x00000000);
      setChar(fgLayer.buffer, 0, 1, 'K', 0xFF0000FF, 0x00000000);

      const document: CanvasDocument = {
        id: 'doc2',
        title: 'Multi-layer Colored',
        width: 5,
        height: 2,
        layers: [bgLayer, fgLayer],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = exportAnsiText(document);

      // Should contain both blue and red
      expect(result).toContain('\x1b[38;2;0;0;255m'); // Blue
      expect(result).toContain('\x1b[38;2;255;0;0m'); // Red
      expect(result).toContain('.');
      expect(result).toContain('O');
      expect(result).toContain('K');
    });
  });
});

// ============================================================
// F028: LLM-Readable Export Format with Semantic Annotations
// ============================================================

function makeTestDocument(overrides?: Partial<CanvasDocument>): CanvasDocument {
  const layer = createLayer('layer-1', 'Main', 10, 5);
  // Draw a small box
  setChar(layer.buffer, 0, 0, '┌');
  setChar(layer.buffer, 0, 1, '─');
  setChar(layer.buffer, 0, 2, '┐');
  setChar(layer.buffer, 1, 0, '│');
  setChar(layer.buffer, 1, 1, 'A');
  setChar(layer.buffer, 1, 2, '│');
  setChar(layer.buffer, 2, 0, '└');
  setChar(layer.buffer, 2, 1, '─');
  setChar(layer.buffer, 2, 2, '┘');

  return {
    id: 'test-doc',
    title: 'Test Diagram',
    width: 10,
    height: 5,
    layers: [layer],
    designSystem: null,
    tags: ['test', 'example'],
    createdAt: 1000000,
    updatedAt: 2000000,
    ...overrides,
  };
}

function makeDesignSystem(): DesignSystem {
  return {
    id: 'ds-1',
    name: 'Test DS',
    description: 'A test design system',
    version: '1.0.0',
    charset: {
      boxLight: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
      boxHeavy: { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
      boxDouble: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
      boxRound: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
      connectors: { left: '├', right: '┤', top: '┬', bottom: '┴', cross: '┼' },
      arrows: {
        left: '←', right: '→', up: '↑', down: '↓',
        leftFilled: '◀', rightFilled: '▶', upFilled: '▲', downFilled: '▼',
      },
      fills: [' ', '░', '▒', '▓', '█'],
    },
    components: [
      {
        id: 'comp-btn',
        name: 'Button',
        description: 'A button component',
        role: 'input',
        minWidth: 6,
        minHeight: 3,
        resizable: true,
        template: createBuffer(6, 3),
        slots: [{ name: 'label', x: 1, y: 1, width: 4, height: 1, default: 'OK' }],
        tags: ['ui'],
      },
      {
        id: 'comp-card',
        name: 'Card',
        description: 'A card container',
        role: 'container',
        minWidth: 10,
        minHeight: 5,
        resizable: true,
        template: createBuffer(10, 5),
        slots: [],
        tags: ['layout'],
      },
    ],
    createdAt: 1000000,
    updatedAt: 1000000,
  };
}

describe('F028: LLM-Readable Export Format with Semantic Annotations', () => {
  describe('exportLLMFormat', () => {
    it('should export basic document structure', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormat(doc);

      expect(result.version).toBe('1.0.0');
      expect(result.format).toBe('illustrate-llm-v1');
      expect(result.document.id).toBe('test-doc');
      expect(result.document.title).toBe('Test Diagram');
      expect(result.document.width).toBe(10);
      expect(result.document.height).toBe(5);
      expect(result.document.tags).toEqual(['test', 'example']);
    });

    it('should include ASCII rendering', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormat(doc);

      expect(result.ascii).toContain('┌─┐');
      expect(result.ascii).toContain('│A│');
      expect(result.ascii).toContain('└─┘');
    });

    it('should include visible layer metadata', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormat(doc);

      expect(result.metadata.layers).toHaveLength(1);
      expect(result.metadata.layers[0].name).toBe('Main');
      expect(result.metadata.layers[0].width).toBe(10);
      expect(result.metadata.layers[0].height).toBe(5);
    });

    it('should filter out invisible layers', () => {
      const layer1 = createLayer('l1', 'Visible', 10, 5);
      const layer2 = createLayer('l2', 'Hidden', 10, 5);
      layer2.visible = false;

      const doc = makeTestDocument({ layers: [layer1, layer2] });
      const result = exportLLMFormat(doc);

      expect(result.metadata.layers).toHaveLength(1);
      expect(result.metadata.layers[0].name).toBe('Visible');
    });

    it('should include design system metadata when present', () => {
      const doc = makeTestDocument({ designSystem: makeDesignSystem() });
      const result = exportLLMFormat(doc);

      expect(result.metadata.designSystem).not.toBeNull();
      expect(result.metadata.designSystem!.name).toBe('Test DS');
      expect(result.metadata.designSystem!.version).toBe('1.0.0');
      expect(result.metadata.designSystem!.componentCount).toBe(2);
      expect(result.metadata.designSystem!.componentNames).toEqual(['Button', 'Card']);
    });

    it('should have null design system when not present', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormat(doc);

      expect(result.metadata.designSystem).toBeNull();
    });

    it('should handle empty document', () => {
      const layer = createLayer('l1', 'Empty', 3, 3);
      const doc = makeTestDocument({ layers: [layer], tags: [] });
      const result = exportLLMFormat(doc);

      expect(result.ascii).toBeDefined();
      expect(result.metadata.components).toEqual([]);
      expect(result.metadata.relationships).toEqual([]);
    });

    it('should produce valid JSON when serialized', () => {
      const doc = makeTestDocument({ designSystem: makeDesignSystem() });
      const result = exportLLMFormat(doc);
      const json = JSON.stringify(result);
      const parsed = JSON.parse(json);

      expect(parsed.format).toBe('illustrate-llm-v1');
      expect(parsed.ascii).toContain('┌─┐');
    });
  });

  describe('exportLLMFormatAsText', () => {
    it('should produce human-readable text format', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('# illustrate.md — LLM Export');
      expect(result).toContain('**Format:** illustrate-llm-v1');
      expect(result).toContain('**Title:** Test Diagram');
      expect(result).toContain('**Size:** 10×5');
    });

    it('should include ASCII in code block', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('```text');
      expect(result).toContain('┌─┐');
      expect(result).toContain('```');
    });

    it('should include tags', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('**Tags:** test, example');
    });

    it('should include design system section when present', () => {
      const doc = makeTestDocument({ designSystem: makeDesignSystem() });
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('## Design System');
      expect(result).toContain('**Name:** Test DS');
      expect(result).toContain('**Components:** 2');
      expect(result).toContain('Button, Card');
    });

    it('should omit design system section when absent', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).not.toContain('## Design System');
    });

    it('should include layers section', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('## Layers');
      expect(result).toContain('**Main**');
    });

    it('should include footer metadata', () => {
      const doc = makeTestDocument();
      const result = exportLLMFormatAsText(doc);

      expect(result).toContain('10×5 canvas');
      expect(result).toContain('1 layer(s)');
    });
  });

  describe('calculateSpatialRelationships', () => {
    it('should return empty array for no components', () => {
      expect(calculateSpatialRelationships([])).toEqual([]);
    });

    it('should detect containment', () => {
      const components: ComponentInstance[] = [
        {
          componentId: 'c1', name: 'Outer', role: 'container',
          description: '', x: 0, y: 0, width: 20, height: 10,
          slots: [], tags: [],
        },
        {
          componentId: 'c2', name: 'Inner', role: 'input',
          description: '', x: 2, y: 2, width: 5, height: 3,
          slots: [], tags: [],
        },
      ];

      const rels = calculateSpatialRelationships(components);
      expect(rels).toContainEqual({ from: 'Outer', to: 'Inner', type: 'contains' });
      expect(rels).toContainEqual({ from: 'Inner', to: 'Outer', type: 'contained-by' });
    });

    it('should detect vertical adjacency', () => {
      const components: ComponentInstance[] = [
        {
          componentId: 'c1', name: 'Top', role: 'display',
          description: '', x: 0, y: 0, width: 10, height: 3,
          slots: [], tags: [],
        },
        {
          componentId: 'c2', name: 'Bottom', role: 'display',
          description: '', x: 0, y: 3, width: 10, height: 3,
          slots: [], tags: [],
        },
      ];

      const rels = calculateSpatialRelationships(components);
      expect(rels).toContainEqual({ from: 'Top', to: 'Bottom', type: 'above' });
      expect(rels).toContainEqual({ from: 'Bottom', to: 'Top', type: 'below' });
    });

    it('should detect horizontal adjacency', () => {
      const components: ComponentInstance[] = [
        {
          componentId: 'c1', name: 'Left', role: 'display',
          description: '', x: 0, y: 0, width: 5, height: 5,
          slots: [], tags: [],
        },
        {
          componentId: 'c2', name: 'Right', role: 'display',
          description: '', x: 5, y: 0, width: 5, height: 5,
          slots: [], tags: [],
        },
      ];

      const rels = calculateSpatialRelationships(components);
      expect(rels).toContainEqual({ from: 'Left', to: 'Right', type: 'left-of' });
      expect(rels).toContainEqual({ from: 'Right', to: 'Left', type: 'right-of' });
    });

    it('should detect overlap', () => {
      const components: ComponentInstance[] = [
        {
          componentId: 'c1', name: 'A', role: 'display',
          description: '', x: 0, y: 0, width: 10, height: 5,
          slots: [], tags: [],
        },
        {
          componentId: 'c2', name: 'B', role: 'display',
          description: '', x: 5, y: 2, width: 10, height: 5,
          slots: [], tags: [],
        },
      ];

      const rels = calculateSpatialRelationships(components);
      expect(rels).toContainEqual({ from: 'A', to: 'B', type: 'overlaps' });
    });
  });

  describe('extractComponentInstances', () => {
    it('should return empty array (pending F021)', () => {
      const doc = makeTestDocument();
      const result = extractComponentInstances(doc);
      expect(result).toEqual([]);
    });
  });
});
