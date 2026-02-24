/**
 * F054: Terminal Renderer
 * 
 * Main entry point for rendering diagrams in terminal environments.
 * Combines detection, layout, colors, and navigation for optimal terminal display.
 */

import type { CanvasDocument, Buffer } from './types.js';
import { compositeLayers } from './layer.js';
import { getChar } from './buffer.js';
import {
  detectTerminalCapabilities,
  type TerminalCapabilities
} from './utils/terminal-detector.js';
import { rgbaToAnsi, stripAnsi } from './utils/terminal-colors.js';
import {
  calculateLayout,
  extractViewport,
  addBorder,
  createStatusLine,
  type LayoutResult
} from './utils/terminal-layout.js';
import { streamToOutput } from './utils/streaming-renderer.js';

export interface TerminalRenderOptions {
  capabilities?: TerminalCapabilities;
  colorize?: boolean;
  showBorder?: boolean;
  title?: string;
  showStatus?: boolean;
  streaming?: boolean;
  centerContent?: boolean;
}

/**
 * Render buffer to terminal-optimized string array
 */
export function bufferToTerminalLines(
  buffer: Buffer,
  capabilities: TerminalCapabilities,
  colorize: boolean = true
): string[] {
  const lines: string[] = [];

  for (let row = 0; row < buffer.height; row++) {
    let line = '';
    let lastFg = 0;
    let lastBg = 0;
    let hasColors = false;

    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      const char = getChar(buffer, row, col);

      if (colorize && capabilities.supportsColor) {
        const fg = buffer.fg[index];
        const bg = buffer.bg[index];

        // Apply color codes if they changed and are not default
        if (fg !== lastFg) {
          const fgCode = rgbaToAnsi(fg, true, capabilities);
          if (fgCode) {
            line += fgCode;
            hasColors = true;
          }
          lastFg = fg;
        }
        if (bg !== lastBg) {
          const bgCode = rgbaToAnsi(bg, false, capabilities);
          if (bgCode) {
            line += bgCode;
            hasColors = true;
          }
          lastBg = bg;
        }
      }

      line += char;
    }

    // Reset colors at end of line if any colors were used
    if (hasColors) {
      line += '\x1b[0m';
    }

    lines.push(line.trimEnd());
  }

  return lines;
}

/**
 * Render buffer to terminal with layout optimization
 */
export function renderBufferToTerminal(
  buffer: Buffer,
  options: TerminalRenderOptions = {}
): string {
  const capabilities = options.capabilities || detectTerminalCapabilities();
  const colorize = options.colorize ?? capabilities.supportsColor;
  const showBorder = options.showBorder ?? false;
  const showStatus = options.showStatus ?? false;

  // Calculate optimal layout
  const layout = calculateLayout(
    buffer.width,
    buffer.height,
    capabilities,
    { centerContent: options.centerContent ?? true }
  );

  // Extract viewport if needed
  const displayBuffer = layout.needsPagination
    ? extractViewport(buffer, layout.viewport)
    : buffer;

  // Convert to lines
  let lines = bufferToTerminalLines(displayBuffer, capabilities, colorize);

  // Add border if requested
  if (showBorder) {
    lines = addBorder(lines, capabilities, options.title);
  }

  // Add status line if needed
  if (showStatus && layout.needsPagination) {
    const statusLine = createStatusLine(layout, buffer.width, buffer.height, capabilities);
    if (statusLine) {
      lines.push('');
      lines.push(statusLine);
    }
  }

  return lines.join('\n');
}

/**
 * Render canvas document to terminal
 */
export function renderToTerminal(
  document: CanvasDocument,
  options: TerminalRenderOptions = {}
): string {
  // Composite all visible layers
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );

  return renderBufferToTerminal(composited, {
    ...options,
    title: options.title || document.title
  });
}

/**
 * Stream render canvas document to output stream
 */
export async function streamRenderToTerminal(
  document: CanvasDocument,
  outputStream: { write: (str: string) => boolean },
  options: TerminalRenderOptions = {}
): Promise<void> {
  const capabilities = options.capabilities || detectTerminalCapabilities();

  // Composite all visible layers
  const composited = compositeLayers(
    document.layers,
    document.width,
    document.height
  );

  // Calculate layout
  const layout = calculateLayout(
    composited.width,
    composited.height,
    capabilities,
    { centerContent: options.centerContent ?? true }
  );

  // Extract viewport if needed
  const displayBuffer = layout.needsPagination
    ? extractViewport(composited, layout.viewport)
    : composited;

  // Stream to output
  await streamToOutput(displayBuffer, outputStream, capabilities, {
    colorize: options.colorize ?? capabilities.supportsColor
  });

  // Add status if needed
  if (options.showStatus && layout.needsPagination) {
    const statusLine = createStatusLine(layout, composited.width, composited.height, capabilities);
    if (statusLine) {
      outputStream.write('\n' + statusLine + '\n');
    }
  }
}

/**
 * Get information about how a diagram will render in terminal
 */
export function getTerminalRenderInfo(
  document: CanvasDocument,
  capabilities?: TerminalCapabilities
): {
  capabilities: TerminalCapabilities;
  layout: LayoutResult;
  fitsInTerminal: boolean;
  requiresInteraction: boolean;
} {
  const caps = capabilities || detectTerminalCapabilities();

  const layout = calculateLayout(
    document.width,
    document.height,
    caps
  );

  return {
    capabilities: caps,
    layout,
    fitsInTerminal: !layout.needsPagination,
    requiresInteraction: layout.needsPagination && caps.isInteractive
  };
}

/**
 * Export all terminal rendering utilities
 */
export * from './utils/terminal-detector.js';
export * from './utils/terminal-colors.js';
export * from './utils/terminal-layout.js';
export * from './utils/streaming-renderer.js';
// Note: terminal-navigation.js is not exported as it uses Node.js APIs (readline)
// and is only meant for CLI usage. Import directly if needed in Node.js context.
