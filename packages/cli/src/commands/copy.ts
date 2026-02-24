/**
 * F045: Copy to Clipboard Command
 * 
 * CLI command to copy ASCII diagrams directly to the system clipboard.
 * Provides an alternative to piping to pbcopy/xclip manually.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { copyToClipboard } from '@illustrate.md/core';
import type { CanvasDocument } from '@illustrate.md/core';
import { createBestClipboard } from '../utils/clipboard.js';

export interface CopyOptions {
  /**
   * Path to local file
   */
  file?: string;
  
  /**
   * Include ANSI color codes
   */
  colors?: boolean;
  
  /**
   * Verbose output
   */
  verbose?: boolean;
}

/**
 * Load a diagram from a local file or cloud (placeholder for future cloud integration)
 */
async function loadDiagram(id: string, options: CopyOptions): Promise<CanvasDocument> {
  // If --file flag is provided, load from local file
  if (options.file) {
    const filePath = resolve(options.file);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as CanvasDocument;
  }
  
  // Cloud loading: Phase 3 feature (F050, F063)
  // For now, try to load from ./{id}.illustrate
  try {
    const filePath = resolve(`./${id}.illustrate`);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as CanvasDocument;
  } catch (error) {
    throw new Error(
      `Could not load diagram "${id}". ` +
      `Try using --file <path> to load from a local file, ` +
      `or create a "${id}.illustrate" file in the current directory.`
    );
  }
}

/**
 * Copy command handler
 * Copies ASCII diagram directly to system clipboard
 */
export async function copyCommand(id: string, options: CopyOptions): Promise<void> {
  try {
    // Load the diagram
    if (options.verbose) {
      process.stderr.write(`Loading diagram "${id}"...\n`);
    }
    
    const document = await loadDiagram(id, options);
    
    if (options.verbose) {
      process.stderr.write(`Loaded: ${document.title} (${document.width}x${document.height})\n`);
    }
    
    // Create clipboard adapter
    const adapter = await createBestClipboard();
    
    if (!adapter.isSupported()) {
      throw new Error(
        'Clipboard operations are not supported on this platform. ' +
        'Try using the export command and pipe to your clipboard: ' +
        'illustrate export <id> | pbcopy (macOS) or ' +
        'illustrate export <id> | xclip (Linux) or ' +
        'illustrate export <id> | clip (Windows)'
      );
    }
    
    // Copy to clipboard
    if (options.verbose) {
      process.stderr.write('Copying to clipboard...\n');
    }
    
    const result = await copyToClipboard(document, adapter, {
      includeColors: options.colors
    });
    
    if (result.success) {
      // Success message to stderr (stdout stays clean)
      const lines = result.content?.split('\n').length || 0;
      const chars = result.content?.length || 0;
      
      if (options.verbose) {
        process.stderr.write(
          `✓ Copied to clipboard (${lines} lines, ${chars} characters)\n`
        );
      } else {
        process.stderr.write('✓ Copied to clipboard\n');
      }
      
      process.exit(0);
    } else {
      throw new Error(result.error || 'Failed to copy to clipboard');
    }
  } catch (error) {
    // Write errors to stderr
    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`);
    } else {
      process.stderr.write(`Error: ${String(error)}\n`);
    }
    process.exit(1);
  }
}

/**
 * Copy arbitrary text to clipboard (utility function)
 * Can be used for copying text that's not a diagram
 */
export async function copyText(text: string, verbose = false): Promise<void> {
  try {
    const adapter = await createBestClipboard();
    
    if (!adapter.isSupported()) {
      throw new Error('Clipboard operations are not supported on this platform');
    }
    
    const result = await adapter.writeText(text);
    
    if (result.success) {
      if (verbose) {
        const lines = text.split('\n').length;
        const chars = text.length;
        process.stderr.write(
          `✓ Copied to clipboard (${lines} lines, ${chars} characters)\n`
        );
      }
    } else {
      throw new Error(result.error || 'Failed to copy to clipboard');
    }
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? `Clipboard error: ${error.message}`
        : 'Failed to copy to clipboard'
    );
  }
}
