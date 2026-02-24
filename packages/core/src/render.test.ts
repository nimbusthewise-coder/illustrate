/**
 * Tests for F032: Plain ASCII Text Render Endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  validateDocument, 
  renderToAscii, 
  RateLimiter,
  type RenderOptions 
} from './render.js';
import { createBuffer } from './buffer.js';
import type { CanvasDocument, Layer } from './types.js';

describe('validateDocument', () => {
  it('accepts valid document', () => {
    const doc: CanvasDocument = {
      id: 'test',
      title: 'Test',
      width: 10,
      height: 5,
      layers: [{
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: createBuffer(10, 5),
      }],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    expect(() => validateDocument(doc)).not.toThrow();
  });
  
  it('rejects non-object', () => {
    expect(() => validateDocument(null)).toThrow('Document must be an object');
    expect(() => validateDocument('string')).toThrow('Document must be an object');
  });
  
  it('rejects invalid width', () => {
    const doc = {
      width: 0,
      height: 5,
      layers: [],
    };
    
    expect(() => validateDocument(doc)).toThrow('width must be a positive number');
  });
  
  it('rejects invalid height', () => {
    const doc = {
      width: 10,
      height: -1,
      layers: [],
    };
    
    expect(() => validateDocument(doc)).toThrow('height must be a positive number');
  });
  
  it('rejects missing layers', () => {
    const doc = {
      width: 10,
      height: 5,
    };
    
    expect(() => validateDocument(doc)).toThrow('must have a layers array');
  });
  
  it('rejects invalid layer structure', () => {
    const doc = {
      width: 10,
      height: 5,
      layers: [null],
    };
    
    expect(() => validateDocument(doc)).toThrow('Each layer must be an object');
  });
  
  it('rejects layer without buffer', () => {
    const doc = {
      width: 10,
      height: 5,
      layers: [{ id: 'test', name: 'Test' }],
    };
    
    expect(() => validateDocument(doc)).toThrow('Each layer must have a buffer');
  });
});

describe('renderToAscii', () => {
  function createTestDocument(width: number, height: number): CanvasDocument {
    const buffer = createBuffer(width, height);
    
    const layer: Layer = {
      id: 'layer1',
      name: 'Layer 1',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    };
    
    return {
      id: 'test',
      title: 'Test',
      width,
      height,
      layers: [layer],
      designSystem: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  it('renders simple document', () => {
    const doc = createTestDocument(5, 3);
    const result = renderToAscii(doc);
    
    expect(result.width).toBe(5);
    expect(result.height).toBe(3);
    expect(result.layerCount).toBe(1);
    expect(result.clipped).toBe(false);
    expect(result.ascii).toBeTruthy();
  });
  
  it('counts visible layers only', () => {
    const doc = createTestDocument(5, 3);
    doc.layers.push({
      id: 'layer2',
      name: 'Layer 2',
      parentId: null,
      visible: false,
      locked: false,
      x: 0,
      y: 0,
      buffer: createBuffer(5, 3),
    });
    
    const result = renderToAscii(doc);
    expect(result.layerCount).toBe(1); // Only first layer is visible
  });
  
  it('clips oversized documents', () => {
    const doc = createTestDocument(256, 256);
    const result = renderToAscii(doc, { maxWidth: 100, maxHeight: 100 });
    
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(result.clipped).toBe(true);
  });
  
  it('respects maxWidth option', () => {
    const doc = createTestDocument(256, 50);
    const result = renderToAscii(doc, { maxWidth: 100 });
    
    expect(result.width).toBe(100);
    expect(result.clipped).toBe(true);
  });
  
  it('respects maxHeight option', () => {
    const doc = createTestDocument(50, 256);
    const result = renderToAscii(doc, { maxHeight: 100 });
    
    expect(result.height).toBe(100);
    expect(result.clipped).toBe(true);
  });
  
  it('handles LF line endings by default', () => {
    const doc = createTestDocument(5, 3);
    const result = renderToAscii(doc);
    
    expect(result.ascii).toContain('\n');
    expect(result.ascii).not.toContain('\r\n');
  });
  
  it('converts to CRLF line endings when requested', () => {
    const doc = createTestDocument(5, 3);
    const result = renderToAscii(doc, { lineEnding: 'crlf' });
    
    expect(result.ascii).toContain('\r\n');
  });
});

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  
  beforeEach(() => {
    limiter = new RateLimiter(3, 1000); // 3 requests per second
  });
  
  it('allows requests under limit', () => {
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
    expect(limiter.check('ip1')).toBe(true);
  });
  
  it('blocks requests over limit', () => {
    limiter.check('ip1');
    limiter.check('ip1');
    limiter.check('ip1');
    
    expect(limiter.check('ip1')).toBe(false);
  });
  
  it('tracks different identifiers separately', () => {
    limiter.check('ip1');
    limiter.check('ip1');
    limiter.check('ip1');
    
    expect(limiter.check('ip1')).toBe(false);
    expect(limiter.check('ip2')).toBe(true);
  });
  
  it('returns correct remaining count', () => {
    expect(limiter.remaining('ip1')).toBe(3);
    
    limiter.check('ip1');
    expect(limiter.remaining('ip1')).toBe(2);
    
    limiter.check('ip1');
    expect(limiter.remaining('ip1')).toBe(1);
    
    limiter.check('ip1');
    expect(limiter.remaining('ip1')).toBe(0);
  });
  
  it('clears all data', () => {
    limiter.check('ip1');
    limiter.check('ip1');
    
    limiter.clear();
    
    expect(limiter.remaining('ip1')).toBe(3);
  });
  
  it('expires old requests', async () => {
    const shortLimiter = new RateLimiter(2, 100); // 2 requests per 100ms
    
    shortLimiter.check('ip1');
    shortLimiter.check('ip1');
    
    expect(shortLimiter.check('ip1')).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should allow new requests
    expect(shortLimiter.check('ip1')).toBe(true);
  });
});
