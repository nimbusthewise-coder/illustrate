/**
 * Integration tests for render command
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { createBuffer, createLayer, type CanvasDocument } from '@illustrate.md/core';

describe('Render Command Integration', () => {
  const testDir = resolve('./test-diagrams');
  const smallDiagram = resolve(testDir, 'small.illustrate');
  const coloredDiagram = resolve(testDir, 'colored.illustrate');

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Create a small test diagram
    const smallBuffer = createBuffer(20, 5);
    
    // Draw a simple box
    for (let i = 0; i < 20; i++) {
      smallBuffer.chars[i] = 0x2D; // '-'
      smallBuffer.chars[4 * 20 + i] = 0x2D; // '-'
    }
    for (let i = 1; i < 4; i++) {
      smallBuffer.chars[i * 20] = 0x7C; // '|'
      smallBuffer.chars[i * 20 + 19] = 0x7C; // '|'
    }
    
    // Add corners
    smallBuffer.chars[0] = 0x2B; // '+'
    smallBuffer.chars[19] = 0x2B; // '+'
    smallBuffer.chars[4 * 20] = 0x2B; // '+'
    smallBuffer.chars[4 * 20 + 19] = 0x2B; // '+'
    
    // Add some text
    const text = 'Hello';
    for (let i = 0; i < text.length; i++) {
      smallBuffer.chars[2 * 20 + 7 + i] = text.charCodeAt(i);
    }

    const smallDoc: CanvasDocument = {
      id: 'test-small',
      title: 'Small Test Diagram',
      width: 20,
      height: 5,
      layers: [
        createLayer('layer1', 'Layer 1', 20, 5)
      ],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    smallDoc.layers[0].buffer = smallBuffer;
    await writeFile(smallDiagram, JSON.stringify(smallDoc));

    // Create a colored test diagram
    const coloredBuffer = createBuffer(30, 8);
    
    // Set some colored characters
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 30; col++) {
        const index = row * 30 + col;
        coloredBuffer.chars[index] = 0x2588; // '█' (block)
        
        // Create a color gradient
        const r = Math.floor((col / 30) * 255);
        const g = Math.floor((row / 8) * 255);
        const b = 128;
        
        // RGBA format: 0xRRGGBBAA
        coloredBuffer.fg[index] = (r << 24) | (g << 16) | (b << 8) | 0xFF;
      }
    }

    const coloredDoc: CanvasDocument = {
      id: 'test-colored',
      title: 'Colored Test Diagram',
      width: 30,
      height: 8,
      layers: [
        createLayer('layer1', 'Layer 1', 30, 8)
      ],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    coloredDoc.layers[0].buffer = coloredBuffer;
    await writeFile(coloredDiagram, JSON.stringify(coloredDoc));
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await unlink(smallDiagram);
      await unlink(coloredDiagram);
    } catch (error) {
      // Ignore errors
    }
  });

  describe('Terminal Rendering', () => {
    it('should render a small diagram correctly', async () => {
      const { renderToTerminal, deserializeBuffer } = await import('@illustrate.md/core');
      const { readFile } = await import('fs/promises');
      
      const content = await readFile(smallDiagram, 'utf-8');
      const document = JSON.parse(content) as CanvasDocument;
      
      // Restore typed arrays using deserializeBuffer
      for (const layer of document.layers) {
        if (layer.buffer) {
          layer.buffer = deserializeBuffer(layer.buffer as any);
        }
      }
      
      const output = renderToTerminal(document, {
        colorize: false,
        showBorder: false
      });
      
      // Basic checks - the output should not be empty
      expect(output.length).toBeGreaterThan(0);
      expect(typeof output).toBe('string');
    });

    it('should detect terminal capabilities', async () => {
      const { detectTerminalCapabilities } = await import('@illustrate.md/core');
      
      const caps = detectTerminalCapabilities();
      
      expect(caps).toHaveProperty('width');
      expect(caps).toHaveProperty('height');
      expect(caps).toHaveProperty('supportsColor');
      expect(caps).toHaveProperty('colorLevel');
      expect(caps.width).toBeGreaterThan(0);
      expect(caps.height).toBeGreaterThan(0);
    });

    it('should render with colors when supported', async () => {
      const { renderToTerminal, detectTerminalCapabilities, deserializeBuffer } = await import('@illustrate.md/core');
      const { readFile } = await import('fs/promises');
      
      const content = await readFile(coloredDiagram, 'utf-8');
      const document = JSON.parse(content) as CanvasDocument;
      
      // Restore typed arrays using deserializeBuffer
      for (const layer of document.layers) {
        if (layer.buffer) {
          layer.buffer = deserializeBuffer(layer.buffer as any);
        }
      }
      
      const caps = detectTerminalCapabilities();
      const output = renderToTerminal(document, {
        capabilities: caps,
        colorize: true,
        showBorder: false
      });
      
      // Basic checks
      expect(output.length).toBeGreaterThan(0);
      expect(typeof output).toBe('string');
    });

    it('should add borders when requested', async () => {
      const { renderToTerminal, deserializeBuffer, detectTerminalCapabilities } = await import('@illustrate.md/core');
      const { readFile } = await import('fs/promises');
      
      const content = await readFile(smallDiagram, 'utf-8');
      const document = JSON.parse(content) as CanvasDocument;
      
      // Restore typed arrays using deserializeBuffer
      for (const layer of document.layers) {
        if (layer.buffer) {
          layer.buffer = deserializeBuffer(layer.buffer as any);
        }
      }
      
      const caps = detectTerminalCapabilities();
      const withoutBorder = renderToTerminal(document, {
        capabilities: caps,
        colorize: false,
        showBorder: false
      });
      
      const withBorder = renderToTerminal(document, {
        capabilities: caps,
        colorize: false,
        showBorder: true,
        title: 'Test'
      });
      
      // With border should have more lines than without
      const linesWithout = withoutBorder.split('\n').length;
      const linesWith = withBorder.split('\n').length;
      
      expect(linesWith).toBeGreaterThan(linesWithout);
    });

    it('should calculate layout correctly', async () => {
      const { calculateLayout, detectTerminalCapabilities } = await import('@illustrate.md/core');
      
      const caps = detectTerminalCapabilities();
      const layout = calculateLayout(100, 50, caps);
      
      expect(layout).toHaveProperty('viewport');
      expect(layout).toHaveProperty('scale');
      expect(layout).toHaveProperty('needsPagination');
      expect(layout.viewport.width).toBeGreaterThan(0);
      expect(layout.viewport.height).toBeGreaterThan(0);
    });
  });
});
