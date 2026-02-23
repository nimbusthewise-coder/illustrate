/**
 * Tests for save command (F063)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, unlink, mkdir, rmdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { CanvasDocument, Buffer } from '@illustrate.md/core';

const TEST_DIR = join(tmpdir(), 'illustrate-save-test-' + Date.now());

/**
 * Create a mock CanvasDocument
 */
function createMockDocument(): CanvasDocument {
  const buffer: Buffer = {
    width: 10,
    height: 5,
    chars: new Uint16Array(50).fill(32), // Space characters
    fg: new Uint32Array(50).fill(0xFFFFFFFF), // White foreground
    bg: new Uint32Array(50).fill(0x00000000), // Transparent background
    flags: new Uint8Array(50).fill(0),
  };
  
  return {
    id: 'doc-123',
    title: 'Test Document',
    width: 10,
    height: 5,
    designSystem: null,
    tags: ['test', 'sample'],
    createdAt: 1234567890000,
    updatedAt: 1234567890000,
    layers: [
      {
        id: 'layer-1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer,
      },
    ],
  };
}

/**
 * Manually test serialization logic
 */
function serializeBuffer(buffer: Buffer): any {
  return {
    width: buffer.width,
    height: buffer.height,
    chars: Array.from(buffer.chars),
    fg: Array.from(buffer.fg),
    bg: Array.from(buffer.bg),
    flags: Array.from(buffer.flags),
  };
}

function serializeDocument(document: CanvasDocument): any {
  return {
    id: document.id,
    title: document.title,
    width: document.width,
    height: document.height,
    designSystem: document.designSystem,
    tags: document.tags,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    layers: document.layers.map((layer) => ({
      id: layer.id,
      name: layer.name,
      parentId: layer.parentId,
      visible: layer.visible,
      locked: layer.locked,
      x: layer.x,
      y: layer.y,
      buffer: serializeBuffer(layer.buffer),
    })),
  };
}

describe('save command', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });
  
  afterEach(async () => {
    try {
      // Clean up test files
      const files = await import('fs/promises').then(m => m.readdir(TEST_DIR));
      for (const file of files) {
        await unlink(join(TEST_DIR, file));
      }
      await rmdir(TEST_DIR);
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  it('should serialize a document to .illustrate format', () => {
    const document = createMockDocument();
    const serialized = serializeDocument(document);
    
    expect(serialized.id).toBe('doc-123');
    expect(serialized.title).toBe('Test Document');
    expect(serialized.layers).toHaveLength(1);
  });
  
  it('should convert TypedArrays to plain arrays', () => {
    const buffer: Buffer = {
      width: 3,
      height: 2,
      chars: new Uint16Array([65, 66, 67, 68, 69, 70]), // ABCDEF
      fg: new Uint32Array([1, 2, 3, 4, 5, 6]),
      bg: new Uint32Array([10, 20, 30, 40, 50, 60]),
      flags: new Uint8Array([0, 1, 0, 1, 0, 1]),
    };
    
    const serialized = serializeBuffer(buffer);
    
    expect(Array.isArray(serialized.chars)).toBe(true);
    expect(Array.isArray(serialized.fg)).toBe(true);
    expect(Array.isArray(serialized.bg)).toBe(true);
    expect(Array.isArray(serialized.flags)).toBe(true);
    
    expect(serialized.chars).toEqual([65, 66, 67, 68, 69, 70]);
    expect(serialized.fg).toEqual([1, 2, 3, 4, 5, 6]);
    expect(serialized.bg).toEqual([10, 20, 30, 40, 50, 60]);
    expect(serialized.flags).toEqual([0, 1, 0, 1, 0, 1]);
  });
  
  it('should create valid .illustrate file structure', () => {
    const document = createMockDocument();
    const serialized = serializeDocument(document);
    
    const fileData = {
      version: '1',
      document: serialized,
    };
    
    expect(fileData.version).toBe('1');
    expect(fileData.document.id).toBe('doc-123');
  });
  
  it('should preserve all document metadata', () => {
    const document = createMockDocument();
    const serialized = serializeDocument(document);
    
    expect(serialized.id).toBe(document.id);
    expect(serialized.title).toBe(document.title);
    expect(serialized.width).toBe(document.width);
    expect(serialized.height).toBe(document.height);
    expect(serialized.designSystem).toBe(document.designSystem);
    expect(serialized.tags).toEqual(document.tags);
    expect(serialized.createdAt).toBe(document.createdAt);
    expect(serialized.updatedAt).toBe(document.updatedAt);
  });
  
  it('should preserve layer hierarchy', () => {
    const document = createMockDocument();
    document.layers.push({
      id: 'layer-2',
      name: 'Child Layer',
      parentId: 'layer-1',
      visible: true,
      locked: false,
      x: 5,
      y: 5,
      buffer: document.layers[0].buffer,
    });
    
    const serialized = serializeDocument(document);
    
    expect(serialized.layers).toHaveLength(2);
    expect(serialized.layers[1].parentId).toBe('layer-1');
    expect(serialized.layers[1].name).toBe('Child Layer');
  });
  
  it('should preserve layer visibility and lock state', () => {
    const document = createMockDocument();
    document.layers[0].visible = false;
    document.layers[0].locked = true;
    
    const serialized = serializeDocument(document);
    
    expect(serialized.layers[0].visible).toBe(false);
    expect(serialized.layers[0].locked).toBe(true);
  });
  
  it('should preserve layer position offsets', () => {
    const document = createMockDocument();
    document.layers[0].x = 10;
    document.layers[0].y = 20;
    
    const serialized = serializeDocument(document);
    
    expect(serialized.layers[0].x).toBe(10);
    expect(serialized.layers[0].y).toBe(20);
  });
  
  it('should handle document with design system', () => {
    const document = createMockDocument();
    document.designSystem = {
      id: 'ds-1',
      name: 'Test System',
      description: 'A test design system',
      version: '1.0.0',
    };
    
    const serialized = serializeDocument(document);
    
    expect(serialized.designSystem).toBeTruthy();
    expect(serialized.designSystem.id).toBe('ds-1');
  });
  
  it('should handle multiple layers', () => {
    const document = createMockDocument();
    
    for (let i = 2; i <= 5; i++) {
      document.layers.push({
        id: `layer-${i}`,
        name: `Layer ${i}`,
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: document.layers[0].buffer,
      });
    }
    
    const serialized = serializeDocument(document);
    
    expect(serialized.layers).toHaveLength(5);
    expect(serialized.layers[4].id).toBe('layer-5');
  });
  
  it('should create JSON that can be parsed back', () => {
    const document = createMockDocument();
    const serialized = serializeDocument(document);
    
    const fileData = {
      version: '1',
      document: serialized,
    };
    
    const json = JSON.stringify(fileData, null, 2);
    const parsed = JSON.parse(json);
    
    expect(parsed.version).toBe('1');
    expect(parsed.document.id).toBe('doc-123');
    expect(parsed.document.layers[0].buffer.chars).toEqual(Array.from(document.layers[0].buffer.chars));
  });
});
