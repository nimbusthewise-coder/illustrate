/**
 * F054: Render Diagram in Terminal
 * 
 * Interactive terminal rendering with color support, pagination,
 * and keyboard navigation for large diagrams.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import {
  deserializeBuffer,
  renderToTerminal,
  streamRenderToTerminal,
  getTerminalRenderInfo,
  detectTerminalCapabilities,
  extractViewport,
  bufferToTerminalLines,
  compositeLayers,
  addBorder,
  createStatusLine,
  NavigationSession,
  clearScreen,
  showCursor
} from '@illustrate.md/core';
import type { CanvasDocument } from '@illustrate.md/core';

interface RenderOptions {
  file?: string;
  noColor?: boolean;
  noBorder?: boolean;
  interactive?: boolean;
  stream?: boolean;
}

/**
 * Load a diagram from a local file or cloud (placeholder for future cloud integration)
 */
async function loadDiagram(id: string, options: RenderOptions): Promise<CanvasDocument> {
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
 * Render a diagram in interactive mode with navigation
 */
async function renderInteractive(document: CanvasDocument, options: RenderOptions): Promise<void> {
  const capabilities = detectTerminalCapabilities();
  
  // Get render info
  const info = getTerminalRenderInfo(document, capabilities);
  
  if (!info.requiresInteraction) {
    // Diagram fits in terminal, just render it
    const output = renderToTerminal(document, {
      capabilities,
      colorize: !options.noColor,
      showBorder: !options.noBorder,
      showStatus: false
    });
    
    console.log(output);
    return;
  }
  
  // Large diagram - use interactive navigation
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );
  
  const renderView = (state: any) => {
    const viewportBuffer = extractViewport(composited, state.viewport);
    let lines = bufferToTerminalLines(
      viewportBuffer,
      capabilities,
      !options.noColor
    );
    
    if (!options.noBorder) {
      lines = addBorder(lines, capabilities, document.title);
    }
    
    // Add status
    const statusLine = createStatusLine(
      {
        viewport: state.viewport,
        scale: 1,
        cropLeft: state.panX,
        cropTop: state.panY,
        cropRight: document.width - state.viewport.width - state.panX,
        cropBottom: document.height - state.viewport.height - state.panY,
        needsPagination: true
      },
      document.width,
      document.height,
      capabilities
    );
    
    lines.push('');
    lines.push(statusLine);
    lines.push('');
    lines.push('Use arrow keys to navigate. Press H for help, Q to quit.');
    
    console.log(lines.join('\n'));
  };
  
  // Start navigation session
  clearScreen();
  
  const session = new NavigationSession(
    {
      x: 0,
      y: 0,
      width: Math.min(document.width, capabilities.width - 4),
      height: Math.min(document.height, capabilities.height - 6)
    },
    document.width,
    document.height,
    capabilities,
    renderView,
    () => {
      clearScreen();
      showCursor();
      process.exit(0);
    }
  );
  
  session.start();
}

/**
 * Render command handler
 */
export async function renderCommand(id: string, options: RenderOptions): Promise<void> {
  try {
    // Load the diagram
    const document = await loadDiagram(id, options);
    
    // Detect terminal capabilities
    const capabilities = detectTerminalCapabilities();
    
    // Check if interactive mode is requested or needed
    const info = getTerminalRenderInfo(document, capabilities);
    const useInteractive = options.interactive !== false && info.requiresInteraction;
    
    if (useInteractive) {
      await renderInteractive(document, options);
      return;
    }
    
    // Non-interactive rendering
    if (options.stream) {
      // Use streaming for large diagrams
      await streamRenderToTerminal(document, process.stdout, {
        capabilities,
        colorize: !options.noColor,
        showBorder: !options.noBorder,
        showStatus: info.layout.needsPagination
      });
    } else {
      // Standard rendering
      const output = renderToTerminal(document, {
        capabilities,
        colorize: !options.noColor,
        showBorder: !options.noBorder,
        showStatus: info.layout.needsPagination
      });
      
      process.stdout.write(output + '\n');
    }
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    // Write errors to stderr, not stdout
    if (error instanceof Error) {
      process.stderr.write(`Error: ${error.message}\n`);
    } else {
      process.stderr.write(`Error: ${String(error)}\n`);
    }
    process.exit(1);
  }
}
