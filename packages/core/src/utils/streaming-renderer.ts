/**
 * F054: Streaming Renderer for Large Diagrams
 * 
 * Renders large diagrams incrementally to avoid memory issues and provide
 * better user experience with progress indication.
 */

import type { Buffer } from '../types.js';
import type { TerminalCapabilities } from './terminal-detector.js';
import { rgbaToAnsi } from './terminal-colors.js';
import { getChar } from '../buffer.js';

export interface StreamOptions {
  chunkSize?: number;
  showProgress?: boolean;
  onProgress?: (current: number, total: number) => void;
  colorize?: boolean;
}

/**
 * Stream buffer content line by line
 * Useful for large diagrams to avoid memory spikes
 */
export async function* streamBufferLines(
  buffer: Buffer,
  capabilities: TerminalCapabilities,
  options: StreamOptions = {}
): AsyncGenerator<string> {
  const {
    chunkSize = 10,
    showProgress = false,
    onProgress,
    colorize = true
  } = options;

  const totalRows = buffer.height;
  let processedRows = 0;

  for (let row = 0; row < buffer.height; row++) {
    let line = '';
    let lastFg = 0;
    let lastBg = 0;

    for (let col = 0; col < buffer.width; col++) {
      const index = row * buffer.width + col;
      const char = getChar(buffer, row, col);

      if (colorize && capabilities.supportsColor) {
        const fg = buffer.fg[index];
        const bg = buffer.bg[index];

        // Apply color codes if they changed
        if (fg !== lastFg) {
          const fgCode = rgbaToAnsi(fg, true, capabilities);
          if (fgCode) {
            line += fgCode;
          }
          lastFg = fg;
        }
        if (bg !== lastBg) {
          const bgCode = rgbaToAnsi(bg, false, capabilities);
          if (bgCode) {
            line += bgCode;
          }
          lastBg = bg;
        }
      }

      line += char;
    }

    // Reset colors at end of line
    if (colorize && capabilities.supportsColor && (lastFg !== 0 || lastBg !== 0)) {
      line += '\x1b[0m';
    }

    yield line.trimEnd();

    processedRows++;

    // Report progress
    if (showProgress && processedRows % chunkSize === 0) {
      if (onProgress) {
        onProgress(processedRows, totalRows);
      }
    }
  }

  // Final progress update
  if (showProgress && onProgress) {
    onProgress(totalRows, totalRows);
  }
}

/**
 * Stream buffer content to a writable stream (e.g., process.stdout)
 */
export async function streamToOutput(
  buffer: Buffer,
  outputStream: { write: (str: string) => boolean },
  capabilities: TerminalCapabilities,
  options: StreamOptions = {}
): Promise<void> {
  const generator = streamBufferLines(buffer, capabilities, options);

  for await (const line of generator) {
    outputStream.write(line + '\n');
  }
}

/**
 * Render buffer with progress indicator
 */
export async function renderWithProgress(
  buffer: Buffer,
  outputStream: { write: (str: string) => boolean },
  capabilities: TerminalCapabilities
): Promise<void> {
  const totalRows = buffer.height;
  let lastProgress = 0;

  const onProgress = (current: number, total: number) => {
    const percent = Math.floor((current / total) * 100);
    if (percent > lastProgress) {
      // Move cursor up, clear line, show progress
      if (capabilities.isInteractive) {
        outputStream.write(`\x1b[1A\x1b[2K`);
        outputStream.write(`Rendering: ${percent}%...\n`);
      }
      lastProgress = percent;
    }
  };

  if (capabilities.isInteractive) {
    outputStream.write('Rendering: 0%...\n');
  }

  await streamToOutput(buffer, outputStream, capabilities, {
    showProgress: capabilities.isInteractive,
    onProgress,
    colorize: capabilities.supportsColor
  });

  // Clear progress line
  if (capabilities.isInteractive) {
    outputStream.write('\x1b[1A\x1b[2K');
  }
}

/**
 * Chunk buffer into manageable pieces for processing
 */
export function* chunkBuffer(
  buffer: Buffer,
  chunkHeight: number = 100
): Generator<Buffer> {
  for (let startRow = 0; startRow < buffer.height; startRow += chunkHeight) {
    const height = Math.min(chunkHeight, buffer.height - startRow);
    const width = buffer.width;

    const chunk: Buffer = {
      width,
      height,
      chars: new Uint16Array(width * height),
      fg: new Uint32Array(width * height),
      bg: new Uint32Array(width * height),
      flags: new Uint8Array(width * height)
    };

    // Copy chunk data
    for (let row = 0; row < height; row++) {
      const srcRow = startRow + row;
      const srcStart = srcRow * buffer.width;
      const dstStart = row * width;

      chunk.chars.set(buffer.chars.subarray(srcStart, srcStart + width), dstStart);
      chunk.fg.set(buffer.fg.subarray(srcStart, srcStart + width), dstStart);
      chunk.bg.set(buffer.bg.subarray(srcStart, srcStart + width), dstStart);
      chunk.flags.set(buffer.flags.subarray(srcStart, srcStart + width), dstStart);
    }

    yield chunk;
  }
}
