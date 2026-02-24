/**
 * F054: Terminal Color Support and Fallbacks
 * 
 * Handles ANSI color codes with graceful degradation based on terminal capabilities.
 */

import type { TerminalCapabilities } from './terminal-detector.js';

/**
 * ANSI color codes
 */
export const ANSI = {
  // Reset
  reset: '\x1b[0m',
  
  // Basic 16 colors (foreground)
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright colors (foreground)
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

/**
 * Convert RGB to closest basic ANSI color (16 colors)
 */
function rgbToBasicAnsi(r: number, g: number, b: number, isForeground: boolean): string {
  // Calculate luminance
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  
  // Determine which color channel is dominant
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  // If grayscale
  if (delta < 30) {
    if (luminance < 64) return isForeground ? ANSI.black : ANSI.bgBlack;
    if (luminance < 128) return isForeground ? ANSI.brightBlack : ANSI.bgBlack;
    if (luminance < 192) return isForeground ? ANSI.white : ANSI.bgWhite;
    return isForeground ? ANSI.brightWhite : ANSI.bgWhite;
  }
  
  // Determine dominant color
  const isRed = r === max;
  const isGreen = g === max;
  const isBlue = b === max;
  
  // Check if bright variant (high luminance)
  const isBright = luminance > 128;
  
  if (isRed && r > g && r > b) {
    return isForeground 
      ? (isBright ? ANSI.brightRed : ANSI.red)
      : ANSI.bgRed;
  }
  if (isGreen && g > r && g > b) {
    return isForeground
      ? (isBright ? ANSI.brightGreen : ANSI.green)
      : ANSI.bgGreen;
  }
  if (isBlue && b > r && b > g) {
    return isForeground
      ? (isBright ? ANSI.brightBlue : ANSI.blue)
      : ANSI.bgBlue;
  }
  
  // Mixed colors
  if (r > 128 && g > 128 && b < 128) {
    return isForeground
      ? (isBright ? ANSI.brightYellow : ANSI.yellow)
      : ANSI.bgYellow;
  }
  if (r > 128 && b > 128 && g < 128) {
    return isForeground
      ? (isBright ? ANSI.brightMagenta : ANSI.magenta)
      : ANSI.bgMagenta;
  }
  if (g > 128 && b > 128 && r < 128) {
    return isForeground
      ? (isBright ? ANSI.brightCyan : ANSI.cyan)
      : ANSI.bgCyan;
  }
  
  // Default to white/black
  return isForeground
    ? (luminance > 128 ? ANSI.brightWhite : ANSI.white)
    : (luminance > 128 ? ANSI.bgWhite : ANSI.bgBlack);
}

/**
 * Convert RGB to 256-color ANSI code
 */
function rgbTo256Ansi(r: number, g: number, b: number, isForeground: boolean): string {
  // Convert to 6x6x6 color cube (216 colors) + grayscale ramp (24 colors)
  
  // Check if grayscale
  const delta = Math.max(r, g, b) - Math.min(r, g, b);
  if (delta < 10) {
    // Use grayscale ramp (232-255)
    const gray = Math.round((r + g + b) / 3);
    const index = 232 + Math.round((gray / 255) * 23);
    const code = isForeground ? 38 : 48;
    return `\x1b[${code};5;${index}m`;
  }
  
  // Use 6x6x6 color cube (16-231)
  const r6 = Math.round((r / 255) * 5);
  const g6 = Math.round((g / 255) * 5);
  const b6 = Math.round((b / 255) * 5);
  const index = 16 + (r6 * 36) + (g6 * 6) + b6;
  
  const code = isForeground ? 38 : 48;
  return `\x1b[${code};5;${index}m`;
}

/**
 * Convert RGB to true color (24-bit) ANSI code
 */
function rgbToTrueColorAnsi(r: number, g: number, b: number, isForeground: boolean): string {
  const code = isForeground ? 38 : 48;
  return `\x1b[${code};2;${r};${g};${b}m`;
}

/**
 * Convert RGBA color to ANSI escape sequence with fallback based on capabilities
 */
export function rgbaToAnsi(
  rgba: number,
  isForeground: boolean,
  capabilities: TerminalCapabilities
): string {
  // Extract RGB components (RGBA is stored as 0xRRGGBBAA)
  const r = (rgba >> 24) & 0xFF;
  const g = (rgba >> 16) & 0xFF;
  const b = (rgba >> 8) & 0xFF;
  const a = rgba & 0xFF;
  
  // If fully transparent or no color support, don't apply color
  if (a === 0 || capabilities.colorLevel === 0) {
    return '';
  }
  
  // Apply color based on terminal capability
  switch (capabilities.colorLevel) {
    case 1: // Basic 16 colors
      return rgbToBasicAnsi(r, g, b, isForeground);
    
    case 2: // 256 colors
      return rgbTo256Ansi(r, g, b, isForeground);
    
    case 3: // True color
      return rgbToTrueColorAnsi(r, g, b, isForeground);
    
    default:
      return '';
  }
}

/**
 * Strip all ANSI escape codes from a string
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get the visual width of a string (excluding ANSI codes)
 */
export function visualWidth(text: string): number {
  return stripAnsi(text).length;
}

/**
 * Wrap text with color codes and ensure proper reset
 */
export function colorize(
  text: string,
  fgRgba: number | null,
  bgRgba: number | null,
  capabilities: TerminalCapabilities
): string {
  if (!capabilities.supportsColor) {
    return text;
  }
  
  let result = '';
  
  if (fgRgba !== null) {
    result += rgbaToAnsi(fgRgba, true, capabilities);
  }
  if (bgRgba !== null) {
    result += rgbaToAnsi(bgRgba, false, capabilities);
  }
  
  result += text;
  
  if (fgRgba !== null || bgRgba !== null) {
    result += ANSI.reset;
  }
  
  return result;
}
