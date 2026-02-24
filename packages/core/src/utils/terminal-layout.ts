/**
 * F054: Terminal-Optimized Layout Engine
 * 
 * Handles layout calculations for rendering diagrams in terminal environments,
 * including scaling, cropping, and viewport management.
 */

import type { Buffer } from '../types.js';
import type { TerminalCapabilities } from './terminal-detector.js';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  viewport: Viewport;
  scale: number;
  cropLeft: number;
  cropTop: number;
  cropRight: number;
  cropBottom: number;
  needsPagination: boolean;
}

/**
 * Calculate optimal layout for displaying a buffer in terminal
 */
export function calculateLayout(
  bufferWidth: number,
  bufferHeight: number,
  capabilities: TerminalCapabilities,
  options: {
    preserveAspect?: boolean;
    centerContent?: boolean;
    maxScale?: number;
  } = {}
): LayoutResult {
  const {
    preserveAspect = true,
    centerContent = true,
    maxScale = 1
  } = options;

  // Available space (leave margin for UI chrome)
  const availableWidth = Math.max(1, capabilities.width - 4);
  const availableHeight = Math.max(1, capabilities.height - 2);

  // Determine if we need to scale or crop
  const fitsHorizontally = bufferWidth <= availableWidth;
  const fitsVertically = bufferHeight <= availableHeight;

  if (fitsHorizontally && fitsVertically) {
    // Diagram fits completely - no scaling or cropping needed
    const x = centerContent ? Math.floor((availableWidth - bufferWidth) / 2) : 0;
    const y = centerContent ? Math.floor((availableHeight - bufferHeight) / 2) : 0;

    return {
      viewport: {
        x,
        y,
        width: bufferWidth,
        height: bufferHeight
      },
      scale: 1,
      cropLeft: 0,
      cropTop: 0,
      cropRight: 0,
      cropBottom: 0,
      needsPagination: false
    };
  }

  // Calculate scale factor if preserving aspect ratio
  let scale = 1;
  if (preserveAspect) {
    const scaleX = availableWidth / bufferWidth;
    const scaleY = availableHeight / bufferHeight;
    scale = Math.min(scaleX, scaleY, maxScale);

    // For terminal display, we don't actually scale (no sub-character rendering)
    // Instead, we note that content needs to be cropped
    scale = Math.min(scale, 1);
  }

  // Determine viewport (what portion of buffer to show)
  const viewportWidth = Math.min(bufferWidth, availableWidth);
  const viewportHeight = Math.min(bufferHeight, availableHeight);

  // Calculate crop amounts
  const cropLeft = 0; // Start from left for now (pan feature would change this)
  const cropTop = 0;  // Start from top
  const cropRight = Math.max(0, bufferWidth - viewportWidth);
  const cropBottom = Math.max(0, bufferHeight - viewportHeight);

  return {
    viewport: {
      x: 0,
      y: 0,
      width: viewportWidth,
      height: viewportHeight
    },
    scale,
    cropLeft,
    cropTop,
    cropRight,
    cropBottom,
    needsPagination: cropRight > 0 || cropBottom > 0
  };
}

/**
 * Extract a viewport region from a buffer
 */
export function extractViewport(buffer: Buffer, viewport: Viewport): Buffer {
  const { x, y, width, height } = viewport;

  // Create new buffer for the viewport
  const result: Buffer = {
    width,
    height,
    chars: new Uint16Array(width * height),
    fg: new Uint32Array(width * height),
    bg: new Uint32Array(width * height),
    flags: new Uint8Array(width * height)
  };

  // Copy data from source buffer
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const srcRow = y + row;
      const srcCol = x + col;

      // Bounds check
      if (srcRow < 0 || srcRow >= buffer.height || srcCol < 0 || srcCol >= buffer.width) {
        continue;
      }

      const srcIndex = srcRow * buffer.width + srcCol;
      const dstIndex = row * width + col;

      result.chars[dstIndex] = buffer.chars[srcIndex];
      result.fg[dstIndex] = buffer.fg[srcIndex];
      result.bg[dstIndex] = buffer.bg[srcIndex];
      result.flags[dstIndex] = buffer.flags[srcIndex];
    }
  }

  return result;
}

/**
 * Calculate pagination info for large diagrams
 */
export interface PageInfo {
  currentPage: number;
  totalPages: number;
  pageWidth: number;
  pageHeight: number;
  viewportsPerRow: number;
  viewportsPerColumn: number;
}

export function calculatePagination(
  bufferWidth: number,
  bufferHeight: number,
  capabilities: TerminalCapabilities
): PageInfo {
  const availableWidth = Math.max(1, capabilities.width - 4);
  const availableHeight = Math.max(1, capabilities.height - 2);

  const viewportsPerRow = Math.ceil(bufferWidth / availableWidth);
  const viewportsPerColumn = Math.ceil(bufferHeight / availableHeight);
  const totalPages = viewportsPerRow * viewportsPerColumn;

  return {
    currentPage: 0,
    totalPages,
    pageWidth: availableWidth,
    pageHeight: availableHeight,
    viewportsPerRow,
    viewportsPerColumn
  };
}

/**
 * Get viewport for a specific page number
 */
export function getPageViewport(
  pageNum: number,
  pageInfo: PageInfo
): Viewport {
  const row = Math.floor(pageNum / pageInfo.viewportsPerRow);
  const col = pageNum % pageInfo.viewportsPerRow;

  return {
    x: col * pageInfo.pageWidth,
    y: row * pageInfo.pageHeight,
    width: pageInfo.pageWidth,
    height: pageInfo.pageHeight
  };
}

/**
 * Create a border around content for better visual separation
 */
export function addBorder(
  content: string[],
  capabilities: TerminalCapabilities,
  title?: string
): string[] {
  if (!capabilities.supportsBoxDrawing) {
    // ASCII fallback
    return [
      `+${'-'.repeat(content[0]?.length || 0)}+`,
      ...content.map(line => `|${line}|`),
      `+${'-'.repeat(content[0]?.length || 0)}+`
    ];
  }

  // Unicode box drawing
  const width = content[0]?.length || 0;
  const top = title
    ? `┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 4))}┐`
    : `┌${'─'.repeat(width)}┐`;

  return [
    top,
    ...content.map(line => `│${line}│`),
    `└${'─'.repeat(width)}┘`
  ];
}

/**
 * Create a status line showing viewport position
 */
export function createStatusLine(
  layout: LayoutResult,
  bufferWidth: number,
  bufferHeight: number,
  capabilities: TerminalCapabilities
): string {
  if (!layout.needsPagination) {
    return '';
  }

  const { viewport, cropRight, cropBottom } = layout;
  const totalWidth = bufferWidth;
  const totalHeight = bufferHeight;

  const status = `View: ${viewport.x},${viewport.y} | ` +
    `Size: ${viewport.width}×${viewport.height} | ` +
    `Total: ${totalWidth}×${totalHeight}` +
    (cropRight > 0 ? ` | →${cropRight} more cols` : '') +
    (cropBottom > 0 ? ` | ↓${cropBottom} more rows` : '');

  // Center the status line
  const padding = Math.max(0, Math.floor((capabilities.width - status.length) / 2));
  return ' '.repeat(padding) + status;
}
