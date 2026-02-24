/**
 * Tests for SVG renderer
 * F030: SVG Render Endpoint
 */

import { describe, it, expect } from 'vitest';
import { bufferToSvg, exportSvg, calculateSvgDimensions } from './svg.js';
import { createBuffer, setChar } from '../buffer.js';
import type { CanvasDocument, Layer } from '../types.js';

describe('SVG Renderer', () => {
  describe('bufferToSvg', () => {
    it('should render a simple ASCII box', () => {
      const buffer = createBuffer(5, 3);
      
      // Draw a simple box
      setChar(buffer, 0, 0, '┌');
      setChar(buffer, 0, 1, '─');
      setChar(buffer, 0, 2, '─');
      setChar(buffer, 0, 3, '─');
      setChar(buffer, 0, 4, '┐');
      
      setChar(buffer, 1, 0, '│');
      setChar(buffer, 1, 4, '│');
      
      setChar(buffer, 2, 0, '└');
      setChar(buffer, 2, 1, '─');
      setChar(buffer, 2, 2, '─');
      setChar(buffer, 2, 3, '─');
      setChar(buffer, 2, 4, '┘');
      
      const svg = bufferToSvg(buffer);
      
      expect(svg).toContain('<?xml version="1.0"');
      expect(svg).toContain('<svg');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('<text');
      expect(svg).toContain('┌');
      expect(svg).toContain('─');
      expect(svg).toContain('│');
      expect(svg).toContain('</svg>');
    });
    
    it('should escape XML special characters', () => {
      const buffer = createBuffer(5, 1);
      
      setChar(buffer, 0, 0, '<');
      setChar(buffer, 0, 1, '>');
      setChar(buffer, 0, 2, '&');
      setChar(buffer, 0, 3, '"');
      setChar(buffer, 0, 4, "'");
      
      const svg = bufferToSvg(buffer);
      
      expect(svg).toContain('&lt;');
      expect(svg).toContain('&gt;');
      expect(svg).toContain('&amp;');
      expect(svg).toContain('&quot;');
      expect(svg).toContain('&apos;');
    });
    
    it('should respect includeXmlDeclaration option', () => {
      const buffer = createBuffer(3, 1);
      setChar(buffer, 0, 0, 'A');
      
      const withDeclaration = bufferToSvg(buffer, { includeXmlDeclaration: true });
      const withoutDeclaration = bufferToSvg(buffer, { includeXmlDeclaration: false });
      
      expect(withDeclaration).toContain('<?xml version="1.0"');
      expect(withoutDeclaration).not.toContain('<?xml version="1.0"');
    });
    
    it('should apply custom padding', () => {
      const buffer = createBuffer(10, 10);
      
      const defaultPadding = bufferToSvg(buffer);
      const customPadding = bufferToSvg(buffer, { padding: 32 });
      
      // Default padding is 16, so width should be 10 * 8.4 + 16 * 2 = 116
      expect(defaultPadding).toContain('width="116"');
      
      // Custom padding of 32, so width should be 10 * 8.4 + 32 * 2 = 148
      expect(customPadding).toContain('width="148"');
    });
    
    it('should render colors when includeColors is true', () => {
      const buffer = createBuffer(3, 1);
      
      // Set character with red foreground
      const redColor = 0xFF0000FF; // Red with full alpha
      buffer.chars[0] = 'A'.charCodeAt(0);
      buffer.fg[0] = redColor;
      
      const svg = bufferToSvg(buffer, { includeColors: true });
      
      expect(svg).toContain('fill="#ff0000"');
    });
    
    it('should use default colors when includeColors is false', () => {
      const buffer = createBuffer(3, 1);
      
      // Set character with red foreground
      const redColor = 0xFF0000FF;
      buffer.chars[0] = 'A'.charCodeAt(0);
      buffer.fg[0] = redColor;
      
      const svg = bufferToSvg(buffer, { 
        includeColors: false,
        defaultForeground: '#333333'
      });
      
      expect(svg).toContain('fill="#333333"');
      expect(svg).not.toContain('fill="#ff0000"');
    });
    
    it('should skip rendering spaces without background', () => {
      const buffer = createBuffer(5, 1);
      
      setChar(buffer, 0, 0, 'A');
      setChar(buffer, 0, 1, ' ');
      setChar(buffer, 0, 2, ' ');
      setChar(buffer, 0, 3, ' ');
      setChar(buffer, 0, 4, 'B');
      
      const svg = bufferToSvg(buffer);
      
      // Should have text elements for A and B but not for spaces
      const textMatches = svg.match(/<text/g);
      expect(textMatches).toHaveLength(2);
    });
    
    it('should render background colors', () => {
      const buffer = createBuffer(3, 1);
      
      // Set character with blue background
      const blueColor = 0x0000FFFF; // Blue with full alpha
      buffer.chars[0] = 'A'.charCodeAt(0);
      buffer.bg[0] = blueColor;
      
      const svg = bufferToSvg(buffer, { includeColors: true });
      
      expect(svg).toContain('<rect');
      expect(svg).toContain('fill="#0000ff"');
    });
    
    it('should apply custom font settings', () => {
      const buffer = createBuffer(3, 1);
      setChar(buffer, 0, 0, 'A');
      
      const svg = bufferToSvg(buffer, {
        fontFamily: '"Courier New"',
        fontSize: 16,
      });
      
      expect(svg).toContain('font-family: "Courier New"');
      expect(svg).toContain('font-size: 16px');
    });
  });
  
  describe('exportSvg', () => {
    it('should export a canvas document to SVG', () => {
      const layer: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(5, 3),
      };
      
      // Draw a box on the layer
      setChar(layer.buffer, 0, 0, '┌');
      setChar(layer.buffer, 0, 4, '┐');
      setChar(layer.buffer, 2, 0, '└');
      setChar(layer.buffer, 2, 4, '┘');
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test Document',
        width: 5,
        height: 3,
        layers: [layer],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const svg = exportSvg(document);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('┌');
      expect(svg).toContain('┐');
      expect(svg).toContain('└');
      expect(svg).toContain('┘');
    });
    
    it('should composite multiple visible layers', () => {
      const layer1: Layer = {
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(5, 3),
      };
      
      const layer2: Layer = {
        id: 'layer2',
        name: 'Layer 2',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(5, 3),
      };
      
      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer2.buffer, 0, 1, 'B');
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test Document',
        width: 5,
        height: 3,
        layers: [layer1, layer2],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const svg = exportSvg(document);
      
      expect(svg).toContain('>A<');
      expect(svg).toContain('>B<');
    });
    
    it('should skip invisible layers', () => {
      const layer1: Layer = {
        id: 'layer1',
        name: 'Visible Layer',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(5, 3),
      };
      
      const layer2: Layer = {
        id: 'layer2',
        name: 'Hidden Layer',
        parentId: null,
        visible: false, // Hidden
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(5, 3),
      };
      
      setChar(layer1.buffer, 0, 0, 'A');
      setChar(layer2.buffer, 0, 1, 'B');
      
      const document: CanvasDocument = {
        id: 'doc1',
        title: 'Test Document',
        width: 5,
        height: 3,
        layers: [layer1, layer2],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const svg = exportSvg(document);
      
      expect(svg).toContain('>A<');
      expect(svg).not.toContain('>B<');
    });
  });
  
  describe('calculateSvgDimensions', () => {
    it('should calculate correct dimensions with default options', () => {
      const dims = calculateSvgDimensions(80, 24);
      
      // 80 * 8.4 + 16 * 2 = 704
      // 24 * 18 + 16 * 2 = 464
      expect(dims.width).toBe(704);
      expect(dims.height).toBe(464);
    });
    
    it('should respect custom padding', () => {
      const dims = calculateSvgDimensions(80, 24, { padding: 0 });
      
      // 80 * 8.4 = 672
      // 24 * 18 = 432
      expect(dims.width).toBe(672);
      expect(dims.height).toBe(432);
    });
    
    it('should respect custom character size', () => {
      const dims = calculateSvgDimensions(80, 24, {
        charWidth: 10,
        charHeight: 20,
        padding: 0,
      });
      
      expect(dims.width).toBe(800);
      expect(dims.height).toBe(480);
    });
  });
});
