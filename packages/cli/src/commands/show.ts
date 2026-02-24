/**
 * F063: Local .illustrate File Operations
 * 
 * Display .illustrate file contents in terminal
 */

import { readIllustrateFile } from '../utils/file-manager.js';
import { deserializeIllustrateFile } from '../utils/illustrate-parser.js';
import { renderToTerminal, detectTerminalCapabilities } from '@illustrate.md/core';

interface ShowOptions {
  noColor?: boolean;
  noBorder?: boolean;
  json?: boolean;
  metadata?: boolean;
}

/**
 * Show file contents in terminal
 */
export async function showCommand(filePath: string, options: ShowOptions = {}): Promise<void> {
  try {
    const file = await readIllustrateFile(filePath);
    
    // JSON output
    if (options.json) {
      console.log(JSON.stringify(file, null, 2));
      process.exit(0);
      return;
    }
    
    // Metadata only
    if (options.metadata) {
      console.log('Metadata:');
      console.log(`  Version: ${file.version}`);
      console.log(`  Created: ${file.metadata.created}`);
      console.log(`  Modified: ${file.metadata.modified}`);
      if (file.metadata.author) {
        console.log(`  Author: ${file.metadata.author}`);
      }
      if (file.metadata.description) {
        console.log(`  Description: ${file.metadata.description}`);
      }
      if (file.metadata.exportedFrom) {
        console.log(`  Exported from: ${file.metadata.exportedFrom}`);
      }
      console.log();
      console.log('Document:');
      console.log(`  ID: ${file.document.id}`);
      console.log(`  Title: ${file.document.title}`);
      console.log(`  Size: ${file.document.width}x${file.document.height}`);
      console.log(`  Layers: ${file.document.layers.length}`);
      console.log(`  Tags: ${file.document.tags.join(', ') || '(none)'}`);
      process.exit(0);
      return;
    }
    
    // Render the diagram
    const deserializedFile = deserializeIllustrateFile(file);
    const capabilities = detectTerminalCapabilities();
    
    const output = renderToTerminal(deserializedFile.document, {
      capabilities,
      colorize: !options.noColor,
      showBorder: !options.noBorder,
      showStatus: false
    });
    
    console.log(output);
    process.exit(0);
  } catch (error) {
    console.error(`Error showing file: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
