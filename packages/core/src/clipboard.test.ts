/**
 * F045: Copy to Clipboard - Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  formatForClipboard,
  copyToClipboard,
  copyTextToClipboard,
  type ClipboardAdapter,
  type ClipboardResult
} from './clipboard.js';
import { createBuffer } from './buffer.js';
import type { CanvasDocument } from './types.js';

/**
 * Create a minimal test document
 */
function createTestDocument(): CanvasDocument {
  const buffer = createBuffer(10, 5);
  return {
    id: 'test-doc',
    title: 'Test Document',
    width: 10,
    height: 5,
    layers: [
      {
        id: 'layer-1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer
      }
    ],
    designSystem: null,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Mock clipboard adapter for testing
 */
class MockClipboardAdapter implements ClipboardAdapter {
  private clipboard = '';
  private supported = true;
  private shouldFail = false;
  
  setSupported(supported: boolean): void {
    this.supported = supported;
  }
  
  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }
  
  getClipboard(): string {
    return this.clipboard;
  }
  
  async writeText(text: string): Promise<ClipboardResult> {
    if (this.shouldFail) {
      throw new Error('Mock clipboard write failed');
    }
    
    this.clipboard = text;
    return {
      success: true,
      content: text
    };
  }
  
  async readText(): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Mock clipboard read failed');
    }
    return this.clipboard;
  }
  
  isSupported(): boolean {
    return this.supported;
  }
}

describe('clipboard', () => {
  describe('formatForClipboard', () => {
    it('should export plain ASCII by default', () => {
      const doc = createTestDocument();
      const result = formatForClipboard(doc);
      
      // Should be plain text with no ANSI codes
      expect(result).not.toContain('\x1b[');
      expect(typeof result).toBe('string');
    });
    
    it('should export ANSI text when includeColors is true', () => {
      const doc = createTestDocument();
      // Format with colors - result might contain ANSI codes if colors are set
      const result = formatForClipboard(doc, { includeColors: true });
      expect(typeof result).toBe('string');
    });
    
    it('should use custom format function when provided', () => {
      const doc = createTestDocument();
      const customFormat = vi.fn(() => 'CUSTOM OUTPUT');
      
      const result = formatForClipboard(doc, { customFormat });
      
      expect(customFormat).toHaveBeenCalledWith(doc);
      expect(result).toBe('CUSTOM OUTPUT');
    });
  });
  
  describe('copyToClipboard', () => {
    it('should copy document to clipboard successfully', async () => {
      const doc = createTestDocument();
      const adapter = new MockClipboardAdapter();
      
      const result = await copyToClipboard(doc, adapter);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(adapter.getClipboard()).toBe(result.content);
    });
    
    it('should return error when clipboard is not supported', async () => {
      const doc = createTestDocument();
      const adapter = new MockClipboardAdapter();
      adapter.setSupported(false);
      
      const result = await copyToClipboard(doc, adapter);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
    });
    
    it('should handle adapter errors gracefully', async () => {
      const doc = createTestDocument();
      const adapter = new MockClipboardAdapter();
      adapter.setShouldFail(true);
      
      const result = await copyToClipboard(doc, adapter);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    it('should respect includeColors option', async () => {
      const doc = createTestDocument();
      const adapter = new MockClipboardAdapter();
      
      await copyToClipboard(doc, adapter, { includeColors: true });
      
      const clipboard = adapter.getClipboard();
      expect(clipboard).toBeDefined();
    });
    
    it('should use custom format when provided', async () => {
      const doc = createTestDocument();
      const adapter = new MockClipboardAdapter();
      const customFormat = () => 'CUSTOM';
      
      const result = await copyToClipboard(doc, adapter, { customFormat });
      
      expect(result.success).toBe(true);
      expect(adapter.getClipboard()).toBe('CUSTOM');
    });
  });
  
  describe('copyTextToClipboard', () => {
    it('should copy plain text to clipboard', async () => {
      const adapter = new MockClipboardAdapter();
      const text = 'Hello, World!';
      
      const result = await copyTextToClipboard(text, adapter);
      
      expect(result.success).toBe(true);
      expect(result.content).toBe(text);
      expect(adapter.getClipboard()).toBe(text);
    });
    
    it('should return error when clipboard is not supported', async () => {
      const adapter = new MockClipboardAdapter();
      adapter.setSupported(false);
      
      const result = await copyTextToClipboard('test', adapter);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported');
    });
    
    it('should handle adapter errors gracefully', async () => {
      const adapter = new MockClipboardAdapter();
      adapter.setShouldFail(true);
      
      const result = await copyTextToClipboard('test', adapter);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
