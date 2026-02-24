/**
 * Character Grid Rendering System
 * F002: Character grid rendering with guaranteed alignment
 * 
 * Provides precise positioning calculations for character grids,
 * ensuring perfect alignment across all zoom levels and character types.
 */

import type { Buffer } from './types.js';
import { getChar, getForeground, getBackground, getIndex } from './buffer.js';

/**
 * Character width categories for alignment handling
 */
export type CharWidthCategory = 'narrow' | 'wide' | 'zero-width' | 'unknown';

/**
 * Grid cell with rendering metadata
 */
export interface RenderCell {
  /** The character to display */
  char: string;
  /** Column position in the grid */
  col: number;
  /** Row position in the grid */
  row: number;
  /** Foreground color as RGBA uint32 */
  fg: number;
  /** Background color as RGBA uint32 */
  bg: number;
  /** Style flags (bit 0 = bold, bit 1 = italic, bit 2 = underline) */
  flags: number;
  /** Character width category */
  widthCategory: CharWidthCategory;
  /** Number of grid cells this character occupies (1 for narrow, 2 for wide) */
  cellSpan: number;
  /** Whether this cell is a continuation of a wide character */
  isContinuation: boolean;
}

/**
 * Grid metrics for pixel-precise positioning
 */
export interface GridMetrics {
  /** Width of a single cell in pixels */
  cellWidth: number;
  /** Height of a single cell in pixels */
  cellHeight: number;
  /** Font size in pixels (derived from cell height) */
  fontSize: number;
  /** Total grid width in pixels */
  totalWidth: number;
  /** Total grid height in pixels */
  totalHeight: number;
  /** Number of columns */
  cols: number;
  /** Number of rows */
  rows: number;
}

/**
 * Alignment validation result
 */
export interface AlignmentResult {
  /** Whether the grid is properly aligned */
  isAligned: boolean;
  /** List of misalignment issues found */
  issues: AlignmentIssue[];
}

/**
 * A specific alignment issue
 */
export interface AlignmentIssue {
  row: number;
  col: number;
  description: string;
}

/**
 * Unicode ranges for wide characters (East Asian Width)
 * Characters in these ranges typically occupy 2 cells in a monospace grid
 */
const WIDE_CHAR_RANGES: [number, number][] = [
  [0x1100, 0x115F],   // Hangul Jamo
  [0x2E80, 0x303E],   // CJK Radicals, Kangxi, Ideographic Description, CJK Symbols
  [0x3041, 0x33BF],   // Hiragana, Katakana, Bopomofo, Hangul Compat, Kanbun, CJK Compat
  [0x3400, 0x4DBF],   // CJK Unified Ideographs Extension A
  [0x4E00, 0x9FFF],   // CJK Unified Ideographs
  [0xA000, 0xA4CF],   // Yi
  [0xAC00, 0xD7AF],   // Hangul Syllables
  [0xF900, 0xFAFF],   // CJK Compatibility Ideographs
  [0xFE30, 0xFE4F],   // CJK Compatibility Forms
  [0xFF01, 0xFF60],   // Fullwidth Forms
  [0xFFE0, 0xFFE6],   // Fullwidth Signs
];

/**
 * Zero-width character ranges
 */
const ZERO_WIDTH_RANGES: [number, number][] = [
  [0x200B, 0x200F],   // Zero-width space, joiners, direction marks
  [0x2028, 0x202F],   // Line/paragraph separator, direction controls
  [0x2060, 0x2069],   // Word joiner, invisible separators
  [0xFE00, 0xFE0F],   // Variation selectors
  [0xFEFF, 0xFEFF],   // BOM / Zero-width no-break space
];

/**
 * Determine the width category of a character
 */
export function getCharWidthCategory(char: string): CharWidthCategory {
  if (!char || char === '' || char === ' ') return 'narrow';
  
  const code = char.codePointAt(0);
  if (code === undefined) return 'unknown';
  
  // Check zero-width first (fast path)
  for (const [start, end] of ZERO_WIDTH_RANGES) {
    if (code >= start && code <= end) return 'zero-width';
  }
  
  // Check combining characters (U+0300 to U+036F, U+1AB0-U+1AFF, U+1DC0-U+1DFF, U+20D0-U+20FF, U+FE20-U+FE2F)
  if ((code >= 0x0300 && code <= 0x036F) ||
      (code >= 0x1AB0 && code <= 0x1AFF) ||
      (code >= 0x1DC0 && code <= 0x1DFF) ||
      (code >= 0x20D0 && code <= 0x20FF) ||
      (code >= 0xFE20 && code <= 0xFE2F)) {
    return 'zero-width';
  }
  
  // Check wide characters
  for (const [start, end] of WIDE_CHAR_RANGES) {
    if (code >= start && code <= end) return 'wide';
  }
  
  // Emoji detection (basic - surrogate pairs / high code points)
  if (code > 0xFFFF) return 'wide';
  
  return 'narrow';
}

/**
 * Get the cell span for a character (how many grid cells it occupies)
 */
export function getCharCellSpan(char: string): number {
  const category = getCharWidthCategory(char);
  switch (category) {
    case 'wide': return 2;
    case 'zero-width': return 0;
    default: return 1;
  }
}

/**
 * Calculate grid metrics for pixel-precise rendering
 * 
 * @param cols - Number of columns
 * @param rows - Number of rows  
 * @param cellWidth - Width of each cell in pixels
 * @param cellHeight - Height of each cell in pixels
 */
export function calculateGridMetrics(
  cols: number,
  rows: number,
  cellWidth: number,
  cellHeight: number
): GridMetrics {
  return {
    cellWidth,
    cellHeight,
    fontSize: Math.floor(cellHeight * 0.8),
    totalWidth: cols * cellWidth,
    totalHeight: rows * cellHeight,
    cols,
    rows,
  };
}

/**
 * Get pixel position for a grid cell
 */
export function getCellPosition(
  metrics: GridMetrics,
  row: number,
  col: number
): { x: number; y: number } {
  return {
    x: col * metrics.cellWidth,
    y: row * metrics.cellHeight,
  };
}

/**
 * Convert pixel coordinates to grid cell coordinates
 */
export function pixelToCell(
  metrics: GridMetrics,
  x: number,
  y: number
): { row: number; col: number } {
  return {
    row: Math.floor(y / metrics.cellHeight),
    col: Math.floor(x / metrics.cellWidth),
  };
}

/**
 * Convert a Buffer to an array of RenderCells for rendering
 * Handles wide characters by marking continuation cells
 */
export function bufferToRenderCells(buffer: Buffer): RenderCell[][] {
  const grid: RenderCell[][] = [];
  
  for (let row = 0; row < buffer.height; row++) {
    const rowCells: RenderCell[] = [];
    let col = 0;
    
    while (col < buffer.width) {
      const index = getIndex(buffer.width, row, col);
      const charCode = buffer.chars[index];
      const char = charCode === 0 ? ' ' : String.fromCharCode(charCode);
      const widthCategory = getCharWidthCategory(char);
      const cellSpan = getCharCellSpan(char);
      
      // Create the primary cell
      rowCells.push({
        char,
        col,
        row,
        fg: buffer.fg[index],
        bg: buffer.bg[index],
        flags: buffer.flags[index],
        widthCategory,
        cellSpan: Math.max(1, cellSpan), // At least 1 cell
        isContinuation: false,
      });
      
      // If wide character, add continuation cell(s)
      if (cellSpan === 2 && col + 1 < buffer.width) {
        rowCells.push({
          char: '',
          col: col + 1,
          row,
          fg: buffer.fg[index],
          bg: buffer.bg[index],
          flags: buffer.flags[index],
          widthCategory: 'narrow',
          cellSpan: 1,
          isContinuation: true,
        });
        col += 2;
      } else {
        col += 1;
      }
    }
    
    grid.push(rowCells);
  }
  
  return grid;
}

/**
 * Validate grid alignment - checks that all rows have consistent column counts
 * and that wide characters are properly accounted for
 */
export function validateAlignment(renderGrid: RenderCell[][], expectedCols: number): AlignmentResult {
  const issues: AlignmentIssue[] = [];
  
  for (let row = 0; row < renderGrid.length; row++) {
    const rowCells = renderGrid[row];
    
    // Count effective columns (including continuation cells)
    let effectiveCols = 0;
    for (const cell of rowCells) {
      if (cell.isContinuation) {
        effectiveCols += 1;
      } else {
        effectiveCols += Math.max(1, cell.cellSpan);
      }
    }
    
    if (effectiveCols !== expectedCols) {
      issues.push({
        row,
        col: effectiveCols,
        description: `Row ${row}: expected ${expectedCols} columns but found ${effectiveCols}`,
      });
    }
    
    // Check for orphaned continuation cells
    for (let i = 0; i < rowCells.length; i++) {
      const cell = rowCells[i];
      if (cell.isContinuation && (i === 0 || rowCells[i - 1].cellSpan < 2)) {
        issues.push({
          row: cell.row,
          col: cell.col,
          description: `Orphaned continuation cell at (${cell.row}, ${cell.col})`,
        });
      }
    }
  }
  
  return {
    isAligned: issues.length === 0,
    issues,
  };
}

/**
 * Correct alignment issues in a render grid by normalizing column counts
 * Returns a new grid with guaranteed alignment
 */
export function correctAlignment(renderGrid: RenderCell[][], expectedCols: number): RenderCell[][] {
  return renderGrid.map((rowCells, rowIndex) => {
    // Count effective columns
    let effectiveCols = 0;
    for (const cell of rowCells) {
      if (cell.isContinuation) {
        effectiveCols += 1;
      } else {
        effectiveCols += Math.max(1, cell.cellSpan);
      }
    }
    
    const corrected = [...rowCells];
    
    // Pad with empty cells if too few
    while (effectiveCols < expectedCols) {
      corrected.push({
        char: ' ',
        col: effectiveCols,
        row: rowIndex,
        fg: 0,
        bg: 0,
        flags: 0,
        widthCategory: 'narrow',
        cellSpan: 1,
        isContinuation: false,
      });
      effectiveCols++;
    }
    
    // Truncate if too many (remove from end)
    while (effectiveCols > expectedCols && corrected.length > 0) {
      const last = corrected[corrected.length - 1];
      const lastSpan = last.isContinuation ? 1 : Math.max(1, last.cellSpan);
      corrected.pop();
      effectiveCols -= lastSpan;
    }
    
    return corrected;
  });
}

/**
 * Generate CSS styles for guaranteed grid alignment
 * Returns an object suitable for React's style prop
 */
export function getGridContainerStyle(metrics: GridMetrics): Record<string, string | number> {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${metrics.cols}, ${metrics.cellWidth}px)`,
    gridTemplateRows: `repeat(${metrics.rows}, ${metrics.cellHeight}px)`,
    width: `${metrics.totalWidth}px`,
    height: `${metrics.totalHeight}px`,
    fontFamily: "'Courier New', Courier, 'Liberation Mono', 'DejaVu Sans Mono', monospace",
    fontSize: `${metrics.fontSize}px`,
    lineHeight: `${metrics.cellHeight}px`,
    letterSpacing: '0px',
    wordSpacing: '0px',
    fontKerning: 'none',
    fontVariantLigatures: 'none',
    textRendering: 'geometricPrecision',
    WebkitFontSmoothing: 'antialiased',
  };
}

/**
 * Generate CSS styles for a single grid cell
 */
export function getCellStyle(
  cell: RenderCell,
  metrics: GridMetrics,
  showGrid: boolean = false
): Record<string, string | number> {
  const style: Record<string, string | number> = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${cell.cellSpan * metrics.cellWidth}px`,
    height: `${metrics.cellHeight}px`,
    overflow: 'hidden',
    whiteSpace: 'pre',
    userSelect: 'none',
    boxSizing: 'border-box',
    padding: '0',
    margin: '0',
  };
  
  // Apply foreground color
  if (cell.fg) {
    const r = (cell.fg >> 24) & 0xff;
    const g = (cell.fg >> 16) & 0xff;
    const b = (cell.fg >> 8) & 0xff;
    const a = cell.fg & 0xff;
    if (a > 0) {
      style.color = `rgba(${r},${g},${b},${a / 255})`;
    }
  }
  
  // Apply background color
  if (cell.bg) {
    const r = (cell.bg >> 24) & 0xff;
    const g = (cell.bg >> 16) & 0xff;
    const b = (cell.bg >> 8) & 0xff;
    const a = cell.bg & 0xff;
    if (a > 0) {
      style.backgroundColor = `rgba(${r},${g},${b},${a / 255})`;
    }
  }
  
  // Apply style flags
  if (cell.flags & 0x01) style.fontWeight = 'bold';
  if (cell.flags & 0x02) style.fontStyle = 'italic';
  if (cell.flags & 0x04) style.textDecoration = 'underline';
  
  // Wide character spans 2 columns
  if (cell.cellSpan > 1) {
    style.gridColumn = `span ${cell.cellSpan}`;
  }
  
  // Debug grid lines
  if (showGrid) {
    style.border = '1px solid rgba(128, 128, 128, 0.2)';
  }
  
  return style;
}

/**
 * Flatten a 2D render grid into a 1D array for rendering,
 * skipping continuation cells (handled by gridColumn span)
 */
export function flattenRenderGrid(grid: RenderCell[][]): RenderCell[] {
  const flat: RenderCell[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (!cell.isContinuation) {
        flat.push(cell);
      }
    }
  }
  return flat;
}
