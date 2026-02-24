/**
 * F063: Local .illustrate File Operations
 * 
 * Parser for .illustrate file format
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { deserializeBuffer } from '@illustrate.md/core';
import type { CanvasDocument } from '@illustrate.md/core';
import type { IllustrateFile } from '../types/illustrate-file.js';

/**
 * Parse a .illustrate file from JSON string
 */
export function parseIllustrateFile(content: string): IllustrateFile {
  let data: any;
  
  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  // Check for required top-level fields
  if (!data.version) {
    throw new Error('Missing required field: version');
  }
  
  if (!data.metadata) {
    throw new Error('Missing required field: metadata');
  }
  
  if (!data.document) {
    throw new Error('Missing required field: document');
  }
  
  return data as IllustrateFile;
}

/**
 * Load and parse a .illustrate file from disk
 */
export async function loadIllustrateFile(filePath: string): Promise<IllustrateFile> {
  const resolvedPath = resolve(filePath);
  const content = await readFile(resolvedPath, 'utf-8');
  return parseIllustrateFile(content);
}

/**
 * Deserialize buffers in a .illustrate file
 * 
 * Converts plain arrays to typed arrays for efficient rendering
 */
export function deserializeIllustrateFile(file: IllustrateFile): IllustrateFile {
  const document = { ...file.document };
  
  if (document.layers && Array.isArray(document.layers)) {
    document.layers = document.layers.map(layer => ({
      ...layer,
      buffer: deserializeBuffer(layer.buffer as any)
    }));
  }
  
  return {
    ...file,
    document
  };
}

/**
 * Extract canvas document from .illustrate file
 * 
 * This is a convenience function for commands that only need the document
 */
export function extractDocument(file: IllustrateFile): CanvasDocument {
  return file.document;
}

/**
 * Serialize a canvas document to .illustrate file format
 */
export function serializeToIllustrateFile(
  document: CanvasDocument,
  metadata?: Partial<IllustrateFile['metadata']>
): IllustrateFile {
  const now = new Date().toISOString();
  
  return {
    version: '1.0',
    metadata: {
      created: metadata?.created || now,
      modified: now,
      author: metadata?.author,
      description: metadata?.description,
      exportedFrom: metadata?.exportedFrom || 'illustrate.md CLI v0.1.0'
    },
    document: serializeDocument(document)
  };
}

/**
 * Serialize a canvas document (convert typed arrays to plain arrays)
 */
function serializeDocument(document: CanvasDocument): any {
  return {
    ...document,
    layers: document.layers.map(layer => ({
      ...layer,
      buffer: {
        width: layer.buffer.width,
        height: layer.buffer.height,
        chars: Array.from(layer.buffer.chars),
        fg: Array.from(layer.buffer.fg),
        bg: Array.from(layer.buffer.bg),
        flags: Array.from(layer.buffer.flags)
      }
    }))
  };
}
