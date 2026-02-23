/**
 * Tests for F041: Plain ASCII text export
 * 
 * Acceptance Criteria:
 * - All visible layers composited
 * - Trailing whitespace trimmed
 * - Output matches canvas exactly
 * - Newline-delimited rows
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, setCell } from './buffer';
import { exportToPlainASCII, exportToMarkdown, compositeLayers } from './export';
import { CanvasDocument, Layer } from './types';

// Helper function to set just character code
function setChar(buffer: any, row: number, col: number, charCode: number) {
  setCell(buffer, col, row, charCode);
}

describe('F041: Plain ASCII text export', () => {
  it('exports empty canvas as empty string', () => {
    const doc: CanvasDocument = {
      id: 'test-1',
      title: 'Empty Canvas',
      width: 10,
      height: 5,
      layers: [],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    // Empty canvas should produce empty lines (all trimmed)
    expect(result).toBe('\n\n\n\n');
  });
  
  it('exports simple text correctly', () => {
    const buffer = createBuffer(20, 3);
    
    // Write "Hello" on first row
    const text = 'Hello';
    for (let i = 0; i < text.length; i++) {
      setChar(buffer, 0, i, text.charCodeAt(i));
    }
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Text Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-2',
      title: 'Simple Text',
      width: 20,
      height: 3,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    expect(result).toBe('Hello\n\n');
  });
  
  it('trims trailing whitespace per row', () => {
    const buffer = createBuffer(20, 3);
    
    // Write "Test" with spaces after
    const text = 'Test';
    for (let i = 0; i < text.length; i++) {
      setChar(buffer, 0, i, text.charCodeAt(i));
    }
    // Add trailing spaces (should be trimmed)
    for (let i = text.length; i < 10; i++) {
      setChar(buffer, 0, i, ' '.charCodeAt(0));
    }
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Text Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-3',
      title: 'Trailing Whitespace',
      width: 20,
      height: 3,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    expect(result).toBe('Test\n\n');
    expect(result).not.toContain('Test     '); // No trailing spaces
  });
  
  it('composites multiple visible layers in order', () => {
    const buffer1 = createBuffer(10, 3);
    const buffer2 = createBuffer(10, 3);
    
    // Bottom layer: "Bottom"
    const text1 = 'Bottom';
    for (let i = 0; i < text1.length; i++) {
      setChar(buffer1, 0, i, text1.charCodeAt(i));
    }
    
    // Top layer: "Top" (should overwrite first 3 chars)
    const text2 = 'Top';
    for (let i = 0; i < text2.length; i++) {
      setChar(buffer2, 0, i, text2.charCodeAt(i));
    }
    
    const layer1: Layer = {
      id: 'layer-1',
      name: 'Bottom Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer: buffer1,
    };
    
    const layer2: Layer = {
      id: 'layer-2',
      name: 'Top Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer: buffer2,
    };
    
    const doc: CanvasDocument = {
      id: 'test-4',
      title: 'Multi-layer',
      width: 10,
      height: 3,
      layers: [layer1, layer2], // layer2 composited on top of layer1
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    expect(result).toBe('Toptom\n\n'); // "Top" overwrites "Bot", leaving "tom"
  });
  
  it('skips invisible layers', () => {
    const buffer = createBuffer(10, 3);
    
    const text = 'Hidden';
    for (let i = 0; i < text.length; i++) {
      setChar(buffer, 0, i, text.charCodeAt(i));
    }
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Hidden Layer',
      parentId: null,
      visible: false, // INVISIBLE
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-5',
      title: 'Hidden Layer',
      width: 10,
      height: 3,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    expect(result).toBe('\n\n'); // Should be empty (invisible layer excluded)
  });
  
  it('respects layer offsets (x, y)', () => {
    const buffer = createBuffer(5, 2);
    
    const text = 'Box';
    for (let i = 0; i < text.length; i++) {
      setChar(buffer, 0, i, text.charCodeAt(i));
    }
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Offset Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 3,  // Offset 3 columns to the right
      y: 1,  // Offset 1 row down
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-6',
      title: 'Offset Layer',
      width: 10,
      height: 5,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    const lines = result.split('\n');
    
    expect(lines[0]).toBe(''); // First row empty
    expect(lines[1]).toBe('   Box'); // Second row: 3 spaces + "Box"
  });
  
  it('draws a box with box-drawing characters', () => {
    const buffer = createBuffer(10, 5);
    
    // Draw a simple box using box-drawing chars
    // ┌────┐
    // │    │
    // └────┘
    
    const chars = {
      tl: '┌'.charCodeAt(0),
      tr: '┐'.charCodeAt(0),
      bl: '└'.charCodeAt(0),
      br: '┘'.charCodeAt(0),
      h: '─'.charCodeAt(0),
      v: '│'.charCodeAt(0),
    };
    
    // Top border
    setChar(buffer, 0, 0, chars.tl);
    for (let col = 1; col < 5; col++) {
      setChar(buffer, 0, col, chars.h);
    }
    setChar(buffer, 0, 5, chars.tr);
    
    // Sides
    setChar(buffer, 1, 0, chars.v);
    setChar(buffer, 1, 5, chars.v);
    setChar(buffer, 2, 0, chars.v);
    setChar(buffer, 2, 5, chars.v);
    
    // Bottom border
    setChar(buffer, 3, 0, chars.bl);
    for (let col = 1; col < 5; col++) {
      setChar(buffer, 3, col, chars.h);
    }
    setChar(buffer, 3, 5, chars.br);
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Box Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-7',
      title: 'Box Drawing',
      width: 10,
      height: 5,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToPlainASCII(doc);
    const lines = result.split('\n');
    
    expect(lines[0]).toBe('┌────┐');
    expect(lines[1]).toBe('│    │');
    expect(lines[2]).toBe('│    │');
    expect(lines[3]).toBe('└────┘');
  });
});

describe('F042: Markdown code block export', () => {
  it('wraps ASCII in markdown code fence', () => {
    const buffer = createBuffer(10, 2);
    
    const text = 'Hello';
    for (let i = 0; i < text.length; i++) {
      setChar(buffer, 0, i, text.charCodeAt(i));
    }
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Text Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-8',
      title: 'Markdown Export',
      width: 10,
      height: 2,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToMarkdown(doc);
    expect(result).toBe('```ascii\nHello\n\n```');
  });
  
  it('supports custom language hint', () => {
    const buffer = createBuffer(10, 1);
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Layer',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    const doc: CanvasDocument = {
      id: 'test-9',
      title: 'Custom Language',
      width: 10,
      height: 1,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    const result = exportToMarkdown(doc, 'text');
    expect(result).toContain('```text');
  });
});

describe('compositeLayers', () => {
  it('handles out-of-bounds layer offsets gracefully', () => {
    const buffer = createBuffer(5, 5);
    setChar(buffer, 0, 0, 'X'.charCodeAt(0));
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Out of bounds',
      parentId: null,
      visible: true,
      locked: false,
      x: 100, // Way outside canvas
      y: 100,
      buffer,
    };
    
    const result = compositeLayers([layer], 10, 10);
    
    // Should not crash, should produce empty buffer
    expect(result.width).toBe(10);
    expect(result.height).toBe(10);
  });
  
  it('handles negative layer offsets', () => {
    const buffer = createBuffer(5, 5);
    
    // Put text in bottom-right of layer buffer
    setChar(buffer, 4, 4, 'X'.charCodeAt(0));
    
    const layer: Layer = {
      id: 'layer-1',
      name: 'Negative offset',
      parentId: null,
      visible: true,
      locked: false,
      x: -2, // Negative offset
      y: -2,
      buffer,
    };
    
    const result = compositeLayers([layer], 10, 10);
    
    // The 'X' at (4,4) in layer becomes (2,2) in result
    expect(result.chars[2 * 10 + 2]).toBe('X'.charCodeAt(0));
  });
});
