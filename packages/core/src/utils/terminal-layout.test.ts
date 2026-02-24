/**
 * Tests for terminal layout utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLayout,
  extractViewport,
  addBorder,
  calculatePagination,
  getPageViewport,
  createStatusLine
} from './terminal-layout';
import type { Buffer } from '../types';
import type { TerminalCapabilities } from './terminal-detector';

describe('Terminal Layout', () => {
  const caps: TerminalCapabilities = {
    width: 80,
    height: 24,
    supportsColor: true,
    colorLevel: 3,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    terminalType: 'xterm',
    isInteractive: true
  };

  describe('calculateLayout', () => {
    it('should fit small diagrams without cropping', () => {
      const layout = calculateLayout(40, 10, caps);
      
      expect(layout.needsPagination).toBe(false);
      expect(layout.viewport.width).toBe(40);
      expect(layout.viewport.height).toBe(10);
      expect(layout.cropLeft).toBe(0);
      expect(layout.cropTop).toBe(0);
      expect(layout.cropRight).toBe(0);
      expect(layout.cropBottom).toBe(0);
    });

    it('should crop large diagrams', () => {
      const layout = calculateLayout(200, 100, caps);
      
      expect(layout.needsPagination).toBe(true);
      expect(layout.viewport.width).toBeLessThan(200);
      expect(layout.viewport.height).toBeLessThan(100);
      expect(layout.cropRight).toBeGreaterThan(0);
      expect(layout.cropBottom).toBeGreaterThan(0);
    });

    it('should center content when requested', () => {
      const layout = calculateLayout(40, 10, caps, { centerContent: true });
      
      expect(layout.viewport.x).toBeGreaterThan(0);
      expect(layout.viewport.y).toBeGreaterThan(0);
    });

    it('should not center content when not requested', () => {
      const layout = calculateLayout(40, 10, caps, { centerContent: false });
      
      expect(layout.viewport.x).toBe(0);
      expect(layout.viewport.y).toBe(0);
    });
  });

  describe('extractViewport', () => {
    it('should extract a viewport region from buffer', () => {
      const buffer: Buffer = {
        width: 10,
        height: 10,
        chars: new Uint16Array(100).fill(65), // 'A'
        fg: new Uint32Array(100).fill(0xFFFFFFFF),
        bg: new Uint32Array(100).fill(0x00000000),
        flags: new Uint8Array(100)
      };

      const viewport = { x: 2, y: 2, width: 5, height: 5 };
      const result = extractViewport(buffer, viewport);

      expect(result.width).toBe(5);
      expect(result.height).toBe(5);
      expect(result.chars.length).toBe(25);
    });

    it('should handle boundary cases gracefully', () => {
      const buffer: Buffer = {
        width: 10,
        height: 10,
        chars: new Uint16Array(100).fill(65),
        fg: new Uint32Array(100).fill(0xFFFFFFFF),
        bg: new Uint32Array(100).fill(0x00000000),
        flags: new Uint8Array(100)
      };

      // Viewport partially outside buffer
      const viewport = { x: 8, y: 8, width: 5, height: 5 };
      const result = extractViewport(buffer, viewport);

      expect(result.width).toBe(5);
      expect(result.height).toBe(5);
    });
  });

  describe('addBorder', () => {
    it('should add ASCII border when box drawing not supported', () => {
      const noBoxCaps = { ...caps, supportsBoxDrawing: false };
      const content = ['Hello', 'World'];
      const result = addBorder(content, noBoxCaps);

      expect(result.length).toBe(4); // top + 2 content + bottom
      expect(result[0]).toContain('+');
      expect(result[0]).toContain('-');
      expect(result[1]).toContain('|Hello|');
      expect(result[2]).toContain('|World|');
      expect(result[3]).toContain('+');
    });

    it('should add Unicode border when supported', () => {
      const content = ['Hello', 'World'];
      const result = addBorder(content, caps);

      expect(result.length).toBe(4);
      expect(result[0]).toContain('┌');
      expect(result[0]).toContain('┐');
      expect(result[1]).toContain('│Hello│');
      expect(result[2]).toContain('│World│');
      expect(result[3]).toContain('└');
      expect(result[3]).toContain('┘');
    });

    it('should add title to border', () => {
      const content = ['Hello'];
      const result = addBorder(content, caps, 'Test');

      expect(result[0]).toContain('Test');
    });
  });

  describe('calculatePagination', () => {
    it('should calculate pagination for large diagrams', () => {
      const info = calculatePagination(200, 100, caps);

      expect(info.totalPages).toBeGreaterThan(1);
      expect(info.viewportsPerRow).toBeGreaterThan(1);
      expect(info.viewportsPerColumn).toBeGreaterThan(1);
      expect(info.pageWidth).toBeGreaterThan(0);
      expect(info.pageHeight).toBeGreaterThan(0);
    });

    it('should calculate single page for small diagrams', () => {
      const info = calculatePagination(40, 10, caps);

      expect(info.totalPages).toBe(1);
      expect(info.viewportsPerRow).toBe(1);
      expect(info.viewportsPerColumn).toBe(1);
    });
  });

  describe('getPageViewport', () => {
    it('should get correct viewport for page number', () => {
      const pageInfo = {
        currentPage: 0,
        totalPages: 4,
        pageWidth: 76,
        pageHeight: 22,
        viewportsPerRow: 2,
        viewportsPerColumn: 2
      };

      // Page 0 (top-left)
      const vp0 = getPageViewport(0, pageInfo);
      expect(vp0.x).toBe(0);
      expect(vp0.y).toBe(0);

      // Page 1 (top-right)
      const vp1 = getPageViewport(1, pageInfo);
      expect(vp1.x).toBe(76);
      expect(vp1.y).toBe(0);

      // Page 2 (bottom-left)
      const vp2 = getPageViewport(2, pageInfo);
      expect(vp2.x).toBe(0);
      expect(vp2.y).toBe(22);

      // Page 3 (bottom-right)
      const vp3 = getPageViewport(3, pageInfo);
      expect(vp3.x).toBe(76);
      expect(vp3.y).toBe(22);
    });
  });

  describe('createStatusLine', () => {
    it('should create status line for paginated content', () => {
      const layout = {
        viewport: { x: 0, y: 0, width: 76, height: 22 },
        scale: 1,
        cropLeft: 0,
        cropTop: 0,
        cropRight: 100,
        cropBottom: 50,
        needsPagination: true
      };

      const status = createStatusLine(layout, 176, 72, caps);

      expect(status).toContain('View:');
      expect(status).toContain('Size:');
      expect(status).toContain('Total:');
      expect(status).toContain('176×72');
    });

    it('should return empty string for non-paginated content', () => {
      const layout = {
        viewport: { x: 0, y: 0, width: 40, height: 10 },
        scale: 1,
        cropLeft: 0,
        cropTop: 0,
        cropRight: 0,
        cropBottom: 0,
        needsPagination: false
      };

      const status = createStatusLine(layout, 40, 10, caps);

      expect(status).toBe('');
    });
  });
});
