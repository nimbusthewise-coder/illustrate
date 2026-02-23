/**
 * Grid buffer structure for character canvas
 */

import { Buffer } from './types';

export type { Buffer };

export function createBuffer(width: number, height: number): Buffer {
  const size = width * height;
  return {
    width,
    height,
    chars: new Uint16Array(size),
    fg: new Uint32Array(size),
    bg: new Uint32Array(size),
    flags: new Uint8Array(size),
  };
}

export function getCell(buffer: Buffer, col: number, row: number): {
  char: number;
  fg: number;
  bg: number;
  flags: number;
} | null {
  if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
    return null;
  }
  const idx = row * buffer.width + col;
  return {
    char: buffer.chars[idx],
    fg: buffer.fg[idx],
    bg: buffer.bg[idx],
    flags: buffer.flags[idx],
  };
}

export function setCell(
  buffer: Buffer,
  col: number,
  row: number,
  char: number,
  fg: number = 0xffffffff,
  bg: number = 0x00000000,
  flags: number = 0
): void {
  if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
    return;
  }
  const idx = row * buffer.width + col;
  buffer.chars[idx] = char;
  buffer.fg[idx] = fg;
  buffer.bg[idx] = bg;
  buffer.flags[idx] = flags;
}

export function clearBuffer(buffer: Buffer): void {
  buffer.chars.fill(0);
  buffer.fg.fill(0xffffffff);
  buffer.bg.fill(0x00000000);
  buffer.flags.fill(0);
}

export function getChar(buffer: Buffer, row: number, col: number): number {
  if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
    return 0;
  }
  const idx = row * buffer.width + col;
  return buffer.chars[idx];
}

/**
 * Helper: setChar - wrapper for setting characters
 * Supports both string and number for the char parameter
 * Uses (col, row) order to match setCell signature
 */
export function setChar(
  buffer: Buffer,
  col: number,
  row: number,
  char: string | number,
  fg: number = 0xffffffff,
  bg: number = 0x00000000,
  flags: number = 0
): void {
  if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
    return;
  }
  const charCode = typeof char === 'string' ? char.charCodeAt(0) : char;
  const idx = row * buffer.width + col;
  buffer.chars[idx] = charCode;
  buffer.fg[idx] = fg;
  buffer.bg[idx] = bg;
  buffer.flags[idx] = flags;
}

export function isInBounds(buffer: Buffer, col: number, row: number): boolean {
  return col >= 0 && col < buffer.width && row >= 0 && row < buffer.height;
}
