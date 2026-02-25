/**
 * Output Manager
 * 
 * Manages output options for generated diagrams.
 * Supports terminal display, file save, or both.
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve, extname } from 'path';
import { renderToTerminal, exportPlainAscii, detectTerminalCapabilities } from '@illustrate.md/core';
import type { CanvasDocument } from '@illustrate.md/core';

export interface OutputOptions {
  /** Output file path */
  out?: string;
  
  /** Display in terminal */
  display?: boolean;
  
  /** Export format (for file output) */
  format?: 'illustrate' | 'ascii' | 'markdown';
  
  /** Disable colors in terminal output */
  noColor?: boolean;
  
  /** Disable border in terminal output */
  noBorder?: boolean;
  
  /** Quiet mode (suppress terminal output except errors) */
  quiet?: boolean;
}

/**
 * Handle output of generated diagram
 * 
 * @param document - The generated canvas document
 * @param options - Output options
 */
export async function handleOutput(
  document: CanvasDocument,
  options: OutputOptions
): Promise<void> {
  const { out, display = !out, format = 'illustrate', noColor, noBorder, quiet } = options;
  
  // Save to file if output path specified
  if (out) {
    await saveToFile(document, out, format);
    
    if (!quiet) {
      console.log(`\n✓ Saved to ${out}`);
    }
  }
  
  // Display in terminal if requested or if no file output
  if (display && !quiet) {
    displayInTerminal(document, { noColor, noBorder });
  }
}

/**
 * Save document to file
 */
async function saveToFile(
  document: CanvasDocument,
  filepath: string,
  format: 'illustrate' | 'ascii' | 'markdown'
): Promise<void> {
  // Ensure directory exists
  const dir = dirname(filepath);
  await mkdir(dir, { recursive: true });
  
  let content: string;
  let actualPath = filepath;
  
  switch (format) {
    case 'illustrate': {
      // Ensure .illustrate extension
      if (!filepath.endsWith('.illustrate')) {
        actualPath = filepath + '.illustrate';
      }
      
      // Serialize document to JSON
      content = serializeDocument(document);
      break;
    }
    
    case 'ascii': {
      // Ensure .txt extension
      if (!filepath.endsWith('.txt') && !filepath.endsWith('.ascii')) {
        actualPath = filepath + '.txt';
      }
      
      content = exportPlainAscii(document);
      break;
    }
    
    case 'markdown': {
      // Ensure .md extension
      if (!filepath.endsWith('.md')) {
        actualPath = filepath + '.md';
      }
      
      const ascii = exportPlainAscii(document);
      content = `# ${document.title}\n\n\`\`\`ascii\n${ascii}\n\`\`\`\n`;
      
      // Add tags if present
      if (document.tags && document.tags.length > 0) {
        const tagsLine = `\n*Tags: ${document.tags.join(', ')}*\n`;
        content = `# ${document.title}\n${tagsLine}\n\`\`\`ascii\n${ascii}\n\`\`\`\n`;
      }
      break;
    }
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  
  await writeFile(actualPath, content, 'utf-8');
}

/**
 * Display document in terminal
 */
function displayInTerminal(
  document: CanvasDocument,
  options: { noColor?: boolean; noBorder?: boolean }
): void {
  console.log('\n');
  
  const output = renderToTerminal(document, {
    capabilities: detectTerminalCapabilities(),
    colorize: !options.noColor,
    showBorder: !options.noBorder,
    showStatus: false
  });
  
  console.log(output);
  console.log('\n');
}

/**
 * Serialize document to JSON (for .illustrate files)
 */
function serializeDocument(document: CanvasDocument): string {
  // Convert typed arrays to plain arrays for JSON serialization
  const serializable = {
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
  
  return JSON.stringify(serializable, null, 2);
}

/**
 * Get suggested filename from prompt
 */
export function suggestFilename(prompt: string, format: 'illustrate' | 'ascii' | 'markdown' = 'illustrate'): string {
  // Clean prompt to create a filename
  const cleaned = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const ext = format === 'illustrate' ? '.illustrate' : format === 'markdown' ? '.md' : '.txt';
  return `${cleaned || 'generated'}${ext}`;
}

/**
 * Display save hint
 */
export function displaySaveHint(prompt: string): void {
  const suggested = suggestFilename(prompt);
  console.log(`\n💡 Tip: Save to a file with --out ${suggested}`);
}
