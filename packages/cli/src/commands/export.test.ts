/**
 * Tests for export command (F062)
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, type CanvasDocument, exportToPlainASCII } from '@illustrate.md/core';

describe('export command', () => {
  describe('document export', () => {
    it('should export a simple box diagram', () => {
      // Create a simple box with text
      const buffer = createBuffer(5, 3);
      
      // Top row: +---+
      buffer.chars[0] = 43;  // +
      buffer.chars[1] = 45;  // -
      buffer.chars[2] = 45;  // -
      buffer.chars[3] = 45;  // -
      buffer.chars[4] = 43;  // +
      
      // Middle row: |Hi!|
      buffer.chars[5] = 124;  // |
      buffer.chars[6] = 72;   // H
      buffer.chars[7] = 105;  // i
      buffer.chars[8] = 33;   // !
      buffer.chars[9] = 124;  // |
      
      // Bottom row: +---+
      buffer.chars[10] = 43;  // +
      buffer.chars[11] = 45;  // -
      buffer.chars[12] = 45;  // -
      buffer.chars[13] = 45;  // -
      buffer.chars[14] = 43;  // +
      
      const document: CanvasDocument = {
        id: 'test-123',
        title: 'Test Box',
        width: 5,
        height: 3,
        layers: [
          {
            id: 'layer-1',
            name: 'Main',
            parentId: null,
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            buffer,
          },
        ],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const result = exportToPlainASCII(document);
      
      expect(result).toBe('+---+\n|Hi!|\n+---+');
    });
    
    it('should composite multiple layers', () => {
      // Layer 1: Box frame
      const layer1Buffer = createBuffer(5, 3);
      layer1Buffer.chars[0] = 43;   // +
      layer1Buffer.chars[1] = 45;   // -
      layer1Buffer.chars[2] = 45;   // -
      layer1Buffer.chars[3] = 45;   // -
      layer1Buffer.chars[4] = 43;   // +
      layer1Buffer.chars[5] = 124;  // |
      layer1Buffer.chars[9] = 124;  // |
      layer1Buffer.chars[10] = 43;  // +
      layer1Buffer.chars[11] = 45;  // -
      layer1Buffer.chars[12] = 45;  // -
      layer1Buffer.chars[13] = 45;  // -
      layer1Buffer.chars[14] = 43;  // +
      
      // Layer 2: Text overlay
      const layer2Buffer = createBuffer(3, 1);
      layer2Buffer.chars[0] = 72;   // H
      layer2Buffer.chars[1] = 105;  // i
      layer2Buffer.chars[2] = 33;   // !
      
      const document: CanvasDocument = {
        id: 'test-456',
        title: 'Layered Box',
        width: 5,
        height: 3,
        layers: [
          {
            id: 'layer-1',
            name: 'Frame',
            parentId: null,
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            buffer: layer1Buffer,
          },
          {
            id: 'layer-2',
            name: 'Text',
            parentId: null,
            visible: true,
            locked: false,
            x: 1,
            y: 1,
            buffer: layer2Buffer,
          },
        ],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const result = exportToPlainASCII(document);
      
      expect(result).toBe('+---+\n|Hi!|\n+---+');
    });
    
    it('should skip hidden layers', () => {
      const visibleBuffer = createBuffer(3, 1);
      visibleBuffer.chars[0] = 65;  // A
      visibleBuffer.chars[1] = 65;  // A
      visibleBuffer.chars[2] = 65;  // A
      
      const hiddenBuffer = createBuffer(3, 1);
      hiddenBuffer.chars[0] = 66;  // B
      hiddenBuffer.chars[1] = 66;  // B
      hiddenBuffer.chars[2] = 66;  // B
      
      const document: CanvasDocument = {
        id: 'test-789',
        title: 'Hidden Layer Test',
        width: 3,
        height: 1,
        layers: [
          {
            id: 'layer-1',
            name: 'Visible',
            parentId: null,
            visible: true,
            locked: false,
            x: 0,
            y: 0,
            buffer: visibleBuffer,
          },
          {
            id: 'layer-2',
            name: 'Hidden',
            parentId: null,
            visible: false,
            locked: false,
            x: 0,
            y: 0,
            buffer: hiddenBuffer,
          },
        ],
        designSystem: null,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      const result = exportToPlainASCII(document);
      
      expect(result).toBe('AAA');
    });
  });
});
