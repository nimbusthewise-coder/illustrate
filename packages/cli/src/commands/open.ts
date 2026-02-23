/**
 * Open command - F063: Render local .illustrate file in terminal
 * 
 * Usage: illustrate open {file.illustrate}
 * Example: illustrate open my-diagram.illustrate
 */

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { CanvasDocument } from '@illustrate.md/core';
import { renderDocumentWithFrame, ColorLevel } from '../renderer.js';

/**
 * File format structure (PRD 5.4)
 */
interface IllustrateFile {
  version: string;
  document: any;
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
 * Read and parse a local .illustrate file
 */
async function readIllustrateFile(filePath: string): Promise<CanvasDocument> {
  const absolutePath = resolve(filePath);
  
  try {
    const fileContent = await readFile(absolutePath, 'utf-8');
    const fileData: IllustrateFile = JSON.parse(fileContent);
    
    // Validate file format
    if (!fileData.version) {
      throw new Error('Invalid .illustrate file: missing version field');
    }
    
    if (!fileData.document) {
      throw new Error('Invalid .illustrate file: missing document field');
    }
    
    // Currently only support version "1"
    if (fileData.version !== '1') {
      throw new Error(`Unsupported .illustrate file version: ${fileData.version} (expected "1")`);
    }
    
    // Deserialize document
    return deserializeDocument(fileData.document);
  } catch (error) {
    if (error instanceof Error) {
      if ((error as any).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
    throw new Error(`Failed to read .illustrate file: ${error}`);
  }
}

/**
 * Parse color level option
 */
function parseColorLevel(value: string): ColorLevel {
  const level = value.toLowerCase();
  switch (level) {
    case 'none':
      return ColorLevel.None;
    case 'basic':
      return ColorLevel.Basic;
    case '256':
      return ColorLevel.Ansi256;
    case 'truecolor':
      return ColorLevel.TrueColor;
    default:
      throw new Error(`Invalid color level: ${value} (expected: none, basic, 256, truecolor)`);
  }
}

/**
 * Create the open command
 */
export function createOpenCommand(): Command {
  const command = new Command('open');
  
  command
    .description('Open and render a local .illustrate file in the terminal')
    .argument('<file>', 'Path to .illustrate file')
    .option('--no-frame', 'Hide title frame')
    .option('--color <level>', 'Override color level (none|basic|256|truecolor)')
    .action(async (file: string, options: { frame: boolean; color?: string }) => {
      try {
        // Read and parse the local file
        const document = await readIllustrateFile(file);
        
        // Determine color level
        const colorLevel = options.color
          ? parseColorLevel(options.color)
          : undefined; // Let renderer auto-detect
        
        // Render document in terminal using F054 renderer
        const output = renderDocumentWithFrame(
          document,
          options.frame,
          colorLevel
        );
        
        // Print to stdout
        process.stdout.write(output);
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
