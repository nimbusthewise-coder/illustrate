/**
 * F032: Plain ASCII Text Render Endpoint
 * 
 * HTTP rendering utilities for diagram-to-ASCII conversion.
 * Provides rate limiting, validation, and rendering options.
 */

import type { CanvasDocument } from './types.js';
import { exportPlainAscii } from './export.js';

/**
 * Options for rendering a diagram to ASCII
 */
export interface RenderOptions {
  /** Maximum width to render (for clipping oversized diagrams) */
  maxWidth?: number;
  /** Maximum height to render (for clipping oversized diagrams) */
  maxHeight?: number;
  /** Whether to trim trailing whitespace (default: true) */
  trimWhitespace?: boolean;
  /** Line ending style: 'lf' (default) or 'crlf' */
  lineEnding?: 'lf' | 'crlf';
}

/**
 * Result of a render operation
 */
export interface RenderResult {
  /** The rendered ASCII text */
  ascii: string;
  /** Width of the rendered output */
  width: number;
  /** Height of the rendered output */
  height: number;
  /** Number of visible layers that were composited */
  layerCount: number;
  /** Whether the output was clipped due to size limits */
  clipped: boolean;
}

/**
 * Default render options
 */
const DEFAULT_RENDER_OPTIONS: Required<RenderOptions> = {
  maxWidth: 1000,
  maxHeight: 1000,
  trimWhitespace: true,
  lineEnding: 'lf',
};

/**
 * Validate a canvas document for rendering
 * @throws Error if document is invalid
 */
export function validateDocument(document: unknown): asserts document is CanvasDocument {
  if (!document || typeof document !== 'object') {
    throw new Error('Document must be an object');
  }

  const doc = document as Partial<CanvasDocument>;

  if (typeof doc.width !== 'number' || doc.width < 1) {
    throw new Error('Document width must be a positive number');
  }

  if (typeof doc.height !== 'number' || doc.height < 1) {
    throw new Error('Document height must be a positive number');
  }

  if (!Array.isArray(doc.layers)) {
    throw new Error('Document must have a layers array');
  }

  // Validate each layer has required structure
  for (const layer of doc.layers) {
    if (!layer || typeof layer !== 'object') {
      throw new Error('Each layer must be an object');
    }
    if (!layer.buffer || typeof layer.buffer !== 'object') {
      throw new Error('Each layer must have a buffer');
    }
  }
}

/**
 * Render a canvas document to ASCII text with options
 * 
 * @param document - The canvas document to render
 * @param options - Rendering options
 * @returns Render result with ASCII text and metadata
 */
export function renderToAscii(
  document: CanvasDocument,
  options?: RenderOptions
): RenderResult {
  // Merge options with defaults
  const opts: Required<RenderOptions> = {
    ...DEFAULT_RENDER_OPTIONS,
    ...options,
  };

  // Check if document exceeds size limits
  const clipped = document.width > opts.maxWidth || document.height > opts.maxHeight;
  
  if (clipped) {
    // Create a clipped version of the document
    const clippedDoc: CanvasDocument = {
      ...document,
      width: Math.min(document.width, opts.maxWidth),
      height: Math.min(document.height, opts.maxHeight),
    };
    
    // Export the clipped document
    let ascii = exportPlainAscii(clippedDoc);
    
    // Apply line ending conversion if needed
    if (opts.lineEnding === 'crlf') {
      ascii = ascii.replace(/\n/g, '\r\n');
    }
    
    const visibleLayers = clippedDoc.layers.filter(l => l.visible);
    
    return {
      ascii,
      width: clippedDoc.width,
      height: clippedDoc.height,
      layerCount: visibleLayers.length,
      clipped: true,
    };
  }

  // Export at full size
  let ascii = exportPlainAscii(document);
  
  // Apply line ending conversion if needed
  if (opts.lineEnding === 'crlf') {
    ascii = ascii.replace(/\n/g, '\r\n');
  }
  
  const visibleLayers = document.layers.filter(l => l.visible);
  
  return {
    ascii,
    width: document.width,
    height: document.height,
    layerCount: visibleLayers.length,
    clipped: false,
  };
}

/**
 * Simple in-memory rate limiter
 * Tracks requests by IP address
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (e.g., IP address)
   * @returns true if request is allowed, false if rate limited
   */
  check(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove requests outside the window
    requests = requests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);
    
    return true;
  }
  
  /**
   * Get the number of requests remaining for an identifier
   */
  remaining(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const requests = this.requests.get(identifier) || [];
    const activeRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - activeRequests.length);
  }
  
  /**
   * Clear all rate limit data (for testing)
   */
  clear(): void {
    this.requests.clear();
  }
}
