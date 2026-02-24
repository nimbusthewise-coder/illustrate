/**
 * F062: Pipe ASCII to stdout
 * F042: Markdown code block export
 * 
 * Export diagram as plain ASCII text or markdown to stdout.
 * Composable with unix pipes (e.g., `illustrate export abc | pbcopy`)
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { exportPlainAscii, exportMarkdownCodeBlock, deserializeBuffer } from '@illustrate.md/core';
import type { CanvasDocument, MarkdownExportOptions } from '@illustrate.md/core';

interface ExportOptions {
  file?: string;
  format?: 'ascii' | 'markdown';
  lang?: string;
  title?: string;
  headingLevel?: number;
  metadata?: boolean;
}

/**
 * Load a diagram from a local file or cloud (placeholder for future cloud integration)
 */
async function loadDiagram(id: string, options: ExportOptions): Promise<CanvasDocument> {
  let data: any;
  
  // If --file flag is provided, load from local file
  if (options.file) {
    const filePath = resolve(options.file);
    const content = await readFile(filePath, 'utf-8');
    data = JSON.parse(content);
  } else {
    // Cloud loading: Phase 3 feature (F050, F063)
    // For now, try to load from ./{id}.illustrate
    try {
      const filePath = resolve(`./${id}.illustrate`);
      const content = await readFile(filePath, 'utf-8');
      data = JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Could not load diagram "${id}". ` +
        `Try using --file <path> to load from a local file, ` +
        `or create a "${id}.illustrate" file in the current directory.`
      );
    }
  }
  
  // Deserialize buffers (convert plain arrays to typed arrays)
  if (data.layers && Array.isArray(data.layers)) {
    for (const layer of data.layers) {
      if (layer.buffer) {
        layer.buffer = deserializeBuffer(layer.buffer);
      }
    }
  }
  
  return data as CanvasDocument;
}

/**
 * Export command handler
 * Pipes plain ASCII or markdown to stdout for composability with unix pipes
 */
export async function exportCommand(id: string, options: ExportOptions): Promise<void> {
  try {
    // Load the diagram
    const document = await loadDiagram(id, options);
    
    let output: string;
    
    // Export based on format option
    if (options.format === 'markdown') {
      // F042: Export as markdown code block
      const markdownOptions: MarkdownExportOptions = {
        language: options.lang,
        title: options.title,
        headingLevel: options.headingLevel,
        includeMetadata: options.metadata,
      };
      output = exportMarkdownCodeBlock(document, markdownOptions);
    } else {
      // F041: Export as plain ASCII (default)
      output = exportPlainAscii(document);
    }
    
    // Pipe to stdout (no newline after - let unix tools handle that)
    process.stdout.write(output);
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    // Write errors to stderr, not stdout (keep stdout clean for piping)
    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`);
    } else {
      process.stderr.write(`Error: ${String(error)}\n`);
    }
    process.exit(1);
  }
}
