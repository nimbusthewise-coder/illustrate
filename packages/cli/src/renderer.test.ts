/**
 * Tests for terminal renderer (F054)
 */

import { describe, it, expect } from 'vitest';
import { 
  detectColorLevel, 
  ColorLevel, 
  renderBuffer, 
  renderDocument,
  renderDocumentWithFrame 
} from './renderer';
import { createBuffer, setChar } from '@illustrate.md/core';
import type { CanvasDocument, Layer } from '@illustrate.md/core';

describe('Terminal Renderer', () => {
  describe('detectColorLevel', () => {
    it('should detect a color level', () => {
      const level = detectColorLevel();
      // Just verify it returns a valid enum value
      expect(Object.values(ColorLevel)).toContain(level);
    });
  });
  
  describe('renderBuffer', () => {
    it('should render empty buffer', () => {
      const buffer = createBuffer(5, 3);
      const output = renderBuffer(buffer, ColorLevel.None);
      
      // Empty buffer should render as empty lines
      const lines = output.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines.every(line => line === '')).toBe(true);
    });
    
    it('should render simple text', () => {
      const buffer = createBuffer(10, 1);
      
      // Write "Hello"
      setChar(buffer, 0, 0, 'H'.charCodeAt(0));
      setChar(buffer, 0, 1, 'e'.charCodeAt(0));
      setChar(buffer, 0, 2, 'l'.charCodeAt(0));
      setChar(buffer, 0, 3, 'l'.charCodeAt(0));
      setChar(buffer, 0, 4, 'o'.charCodeAt(0));
      
      const output = renderBuffer(buffer, ColorLevel.None);
      expect(output).toBe('Hello');
    });
    
    it('should render box-drawing characters', () => {
      const buffer = createBuffer(5, 3);
      
      // Top border: ┌───┐
      setChar(buffer, 0, 0, '┌'.charCodeAt(0));
      setChar(buffer, 0, 1, '─'.charCodeAt(0));
      setChar(buffer, 0, 2, '─'.charCodeAt(0));
      setChar(buffer, 0, 3, '─'.charCodeAt(0));
      setChar(buffer, 0, 4, '┐'.charCodeAt(0));
      
      // Middle: │   │
      setChar(buffer, 1, 0, '│'.charCodeAt(0));
      setChar(buffer, 1, 4, '│'.charCodeAt(0));
      
      // Bottom: └───┘
      setChar(buffer, 2, 0, '└'.charCodeAt(0));
      setChar(buffer, 2, 1, '─'.charCodeAt(0));
      setChar(buffer, 2, 2, '─'.charCodeAt(0));
      setChar(buffer, 2, 3, '─'.charCodeAt(0));
      setChar(buffer, 2, 4, '┘'.charCodeAt(0));
      
      const output = renderBuffer(buffer, ColorLevel.None);
      const lines = output.split('\n');
      
      expect(lines[0]).toBe('┌───┐');
      expect(lines[1]).toBe('│   │');
      expect(lines[2]).toBe('└───┘');
    });
    
    it('should trim trailing whitespace', () => {
      const buffer = createBuffer(10, 1);
      
      // Write "Hi" followed by spaces
      setChar(buffer, 0, 0, 'H'.charCodeAt(0));
      setChar(buffer, 0, 1, 'i'.charCodeAt(0));
      // Remaining cells are spaces (charCode 0)
      
      const output = renderBuffer(buffer, ColorLevel.None);
      expect(output).toBe('Hi');
    });
    
    it('should handle colors when supported', () => {
      const buffer = createBuffer(5, 1);
      
      // Write "Test" with colors
      setChar(buffer, 0, 0, 'T'.charCodeAt(0));
      
      // Set foreground color (red-ish: RGB 255, 0, 0)
      const index = 0;
      buffer.fg[index] = (255 << 24) | (0 << 16) | (0 << 8) | 255; // RGBA
      
      // Render with truecolor support
      const output = renderBuffer(buffer, ColorLevel.TrueColor);
      
      // Should contain ANSI escape codes
      expect(output).toContain('\x1b[');
      expect(output).toContain('T');
    });
  });
  
  describe('renderDocument', () => {
    it('should render document with single layer', () => {
      const buffer = createBuffer(5, 1);
      setChar(buffer, 0, 0, 'H'.charCodeAt(0));
      setChar(buffer, 0, 1, 'i'.charCodeAt(0));
      
      const layer: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer
      };
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test Document',
        width: 5,
        height: 1,
        layers: [layer],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const output = renderDocument(document, ColorLevel.None);
      expect(output).toBe('Hi');
    });
    
    it('should composite multiple layers', () => {
      // Base layer with box
      const baseBuffer = createBuffer(5, 3);
      setChar(baseBuffer, 0, 0, '┌'.charCodeAt(0));
      setChar(baseBuffer, 0, 4, '┐'.charCodeAt(0));
      setChar(baseBuffer, 2, 0, '└'.charCodeAt(0));
      setChar(baseBuffer, 2, 4, '┘'.charCodeAt(0));
      
      // Text layer with "Hi"
      const textBuffer = createBuffer(2, 1);
      setChar(textBuffer, 0, 0, 'H'.charCodeAt(0));
      setChar(textBuffer, 0, 1, 'i'.charCodeAt(0));
      
      const baseLayer: Layer = {
        id: 'base',
        name: 'Base',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: baseBuffer
      };
      
      const textLayer: Layer = {
        id: 'text',
        name: 'Text',
        parentId: null,
        visible: true,
        locked: false,
        x: 1,  // Offset by 1 column
        y: 1,  // Offset by 1 row
        buffer: textBuffer
      };
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Composite Test',
        width: 5,
        height: 3,
        layers: [baseLayer, textLayer],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const output = renderDocument(document, ColorLevel.None);
      const lines = output.split('\n');
      
      // Should have composited layers
      expect(lines[0]).toContain('┌');
      expect(lines[0]).toContain('┐');
      expect(lines[1]).toContain('Hi');
      expect(lines[2]).toContain('└');
      expect(lines[2]).toContain('┘');
    });
    
    it('should skip invisible layers', () => {
      const buffer1 = createBuffer(5, 1);
      setChar(buffer1, 0, 0, 'A'.charCodeAt(0));
      
      const buffer2 = createBuffer(5, 1);
      setChar(buffer2, 0, 0, 'B'.charCodeAt(0));
      
      const layer1: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: buffer1
      };
      
      const layer2: Layer = {
        id: 'layer2',
        name: 'Layer 2',
        parentId: null,
        visible: false,  // Invisible
        locked: false,
        x: 0,
        y: 0,
        buffer: buffer2
      };
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Visibility Test',
        width: 5,
        height: 1,
        layers: [layer1, layer2],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const output = renderDocument(document, ColorLevel.None);
      expect(output).toBe('A');  // Only layer1 visible
    });
  });
  
  describe('renderDocumentWithFrame', () => {
    it('should render with title frame', () => {
      const buffer = createBuffer(5, 1);
      setChar(buffer, 0, 0, 'H'.charCodeAt(0));
      setChar(buffer, 0, 1, 'i'.charCodeAt(0));
      
      const layer: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer
      };
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test',
        width: 5,
        height: 1,
        layers: [layer],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const output = renderDocumentWithFrame(document, true, ColorLevel.None);
      const lines = output.split('\n').filter(l => l.length > 0);
      
      // Should have frame around content
      expect(lines.length).toBeGreaterThan(1);
      expect(output).toContain('Test');  // Title
      expect(output).toContain('Hi');    // Content
    });
    
    it('should render without frame when disabled', () => {
      const buffer = createBuffer(5, 1);
      setChar(buffer, 0, 0, 'H'.charCodeAt(0));
      setChar(buffer, 0, 1, 'i'.charCodeAt(0));
      
      const layer: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer
      };
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test',
        width: 5,
        height: 1,
        layers: [layer],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const output = renderDocumentWithFrame(document, false, ColorLevel.None);
      expect(output).toBe('Hi');
    });
  });
});
