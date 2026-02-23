/**
 * Save command - F063: Save diagram to local .illustrate file
 * 
 * Usage: illustrate save {id} --out {file}
 * Example: illustrate save abc123 --out my-diagram.illustrate
 */

import { Command } from 'commander';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { CanvasDocument, Buffer } from '@illustrate.md/core';

const DEFAULT_API_URL = process.env.ILLUSTRATE_API_URL || 'http://localhost:3000';

/**
 * File format structure (PRD 5.4)
 */
interface IllustrateFile {
  version: string;
  document: any;
}

/**
 * Convert Buffer TypedArrays to plain arrays for JSON serialization
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

/**
 * Convert CanvasDocument to serializable format
 */
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

/**
 * Fetch a document from the API
 */
async function fetchDocument(id: string, apiUrl: string): Promise<CanvasDocument> {
  const url = `${apiUrl}/api/documents/${id}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Document not found: ${id}`);
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert buffer data from JSON to TypedArrays
    return deserializeDocument(data);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to fetch document: ${error}`);
  }
}

/**
 * Convert document from JSON format to CanvasDocument with TypedArrays
 */
function deserializeDocument(data: any): CanvasDocument {
  return {
    id: data.id,
    title: data.title,
    width: data.width,
    height: data.height,
    designSystem: data.designSystem || null,
    tags: data.tags || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    layers: data.layers.map((layer: any) => ({
      id: layer.id,
      name: layer.name,
      parentId: layer.parentId,
      visible: layer.visible,
      locked: layer.locked,
      x: layer.x,
      y: layer.y,
      buffer: {
        width: layer.buffer.width,
        height: layer.buffer.height,
        chars: new Uint16Array(layer.buffer.chars),
        fg: new Uint32Array(layer.buffer.fg),
        bg: new Uint32Array(layer.buffer.bg),
        flags: new Uint8Array(layer.buffer.flags),
      },
    })),
  };
}

/**
 * Save a CanvasDocument to a local .illustrate file
 */
async function saveIllustrateFile(
  document: CanvasDocument,
  filePath: string
): Promise<void> {
  const absolutePath = resolve(filePath);
  
  // Create file structure according to PRD 5.4
  const fileData: IllustrateFile = {
    version: '1',
    document: serializeDocument(document),
  };
  
  // Convert to JSON with pretty printing for readability
  const fileContent = JSON.stringify(fileData, null, 2);
  
  try {
    await writeFile(absolutePath, fileContent, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
    throw new Error(`Failed to write file: ${error}`);
  }
}

/**
 * Create the save command
 */
export function createSaveCommand(): Command {
  const command = new Command('save');
  
  command
    .description('Save a diagram to a local .illustrate file')
    .argument('<id>', 'Document ID to save')
    .requiredOption('--out <file>', 'Output file path (.illustrate)')
    .option('--api-url <url>', 'API base URL', DEFAULT_API_URL)
    .action(async (id: string, options: { out: string; apiUrl: string }) => {
      try {
        // Validate output file extension
        if (!options.out.endsWith('.illustrate')) {
          process.stderr.write('Warning: Output file should have .illustrate extension\n');
        }
        
        // Fetch document from API
        process.stderr.write(`Fetching document ${id}...\n`);
        const document = await fetchDocument(id, options.apiUrl);
        
        // Save to local file
        await saveIllustrateFile(document, options.out);
        
        process.stderr.write(`✓ Saved to ${options.out}\n`);
        process.exit(0);
      } catch (error) {
        if (error instanceof Error) {
          process.stderr.write(`Error: ${error.message}\n`);
        } else {
          process.stderr.write(`Error: ${error}\n`);
        }
        process.exit(1);
      }
    });
  
  return command;
}
