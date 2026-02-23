/**
 * Export command - F062: Pipe ASCII to stdout
 * 
 * Usage: illustrate export {id}
 * Example: illustrate export abc | pbcopy
 */

import { Command } from 'commander';
import { exportToPlainASCII, type CanvasDocument } from '@illustrate.md/core';

const DEFAULT_API_URL = process.env.ILLUSTRATE_API_URL || 'http://localhost:3000';

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
 * Create the export command
 */
export function createExportCommand(): Command {
  const command = new Command('export');
  
  command
    .description('Export a diagram as plain ASCII text to stdout')
    .argument('<id>', 'Document ID to export')
    .option('--api-url <url>', 'API base URL', DEFAULT_API_URL)
    .action(async (id: string, options: { apiUrl: string }) => {
      try {
        // Fetch document from API
        const document = await fetchDocument(id, options.apiUrl);
        
        // Export to plain ASCII using core export function (F041)
        const ascii = exportToPlainASCII(document);
        
        // Pipe to stdout (F062)
        process.stdout.write(ascii);
        
        // Add trailing newline if not already present
        if (!ascii.endsWith('\n')) {
          process.stdout.write('\n');
        }
        
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
