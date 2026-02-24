'use client';

import React, { useMemo, useCallback } from 'react';

/**
 * Monospace font stack per PRD §8.1
 * SF Mono (Apple), JetBrains Mono (cross-platform fallback), then common monospace fonts
 */
export const MONOSPACE_FONT_STACK =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";

/**
 * Default cell dimensions in pixels.
 * These are standard monospace character metrics at 14px font size.
 * The ch unit is unreliable cross-browser, so we use fixed px values
 * calculated from the font metrics to guarantee grid alignment.
 */
export const DEFAULT_CELL_WIDTH = 8.4;
export const DEFAULT_CELL_HEIGHT = 18;
export const DEFAULT_FONT_SIZE = 14;

export interface CellData {
  /** Unicode character to display. Space or empty string for empty cells. */
  char: string;
  /** CSS color for foreground. Defaults to 'inherit'. */
  fg?: string;
  /** CSS color for background. Defaults to 'transparent'. */
  bg?: string;
}

export interface CharacterGridProps {
  /** Grid width in characters (columns) */
  width: number;
  /** Grid height in characters (rows) */
  height: number;
  /** Cell data indexed by `row * width + col`. Missing entries render as empty. */
  cells?: CellData[];
  /** Font size in pixels. Default: 14 */
  fontSize?: number;
  /** Cell width in pixels. If not provided, measured from font. */
  cellWidth?: number;
  /** Cell height in pixels (line-height). If not provided, uses fontSize * 1.286. */
  cellHeight?: number;
  /** Additional className for the outer container */
  className?: string;
  /** Click handler - receives grid column, row */
  onCellClick?: (col: number, row: number) => void;
  /** Pointer move handler - receives grid column, row */
  onCellPointerMove?: (col: number, row: number) => void;
}

/**
 * CharacterGrid renders a fixed-size character grid using CSS Grid.
 * 
 * Every cell occupies exactly one grid unit — no sub-character positioning.
 * Monospace font is enforced to guarantee alignment across browsers.
 * 
 * Implementation uses CSS Grid with fixed cell dimensions calculated from
 * font metrics, ensuring pixel-perfect alignment regardless of browser
 * font rendering differences.
 */
export const CharacterGrid: React.FC<CharacterGridProps> = ({
  width,
  height,
  cells,
  fontSize = DEFAULT_FONT_SIZE,
  cellWidth,
  cellHeight,
  className,
  onCellClick,
  onCellPointerMove,
}) => {
  const cw = cellWidth ?? DEFAULT_CELL_WIDTH;
  const ch = cellHeight ?? DEFAULT_CELL_HEIGHT;

  // Grid container style — defines the fixed grid layout
  const gridStyle = useMemo<React.CSSProperties>(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${width}, ${cw}px)`,
      gridTemplateRows: `repeat(${height}, ${ch}px)`,
      fontFamily: MONOSPACE_FONT_STACK,
      fontSize: `${fontSize}px`,
      lineHeight: `${ch}px`,
      width: `${width * cw}px`,
      height: `${height * ch}px`,
      // Prevent sub-pixel text rendering issues
      textRendering: 'optimizeLegibility',
      // Prevent user text selection which would break grid
      userSelect: 'none',
      // Prevent ligatures which would break character alignment
      fontVariantLigatures: 'none',
      fontFeatureSettings: '"liga" 0, "calt" 0',
      // Prevent any letter/word spacing overrides
      letterSpacing: '0px',
      wordSpacing: '0px',
      // Ensure no wrapping or overflow per cell
      whiteSpace: 'pre',
      overflow: 'hidden',
    }),
    [width, height, cw, ch, fontSize]
  );

  // Shared cell style — every cell is identical size
  const cellStyle = useMemo<React.CSSProperties>(
    () => ({
      width: `${cw}px`,
      height: `${ch}px`,
      lineHeight: `${ch}px`,
      textAlign: 'center',
      overflow: 'hidden',
      // Box model: no padding, no margin — pure character cell
      padding: 0,
      margin: 0,
      boxSizing: 'border-box',
    }),
    [cw, ch]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onCellClick) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / cw);
      const row = Math.floor((e.clientY - rect.top) / ch);
      if (col >= 0 && col < width && row >= 0 && row < height) {
        onCellClick(col, row);
      }
    },
    [onCellClick, cw, ch, width, height]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!onCellPointerMove) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left) / cw);
      const row = Math.floor((e.clientY - rect.top) / ch);
      if (col >= 0 && col < width && row >= 0 && row < height) {
        onCellPointerMove(col, row);
      }
    },
    [onCellPointerMove, cw, ch, width, height]
  );

  // Build cell spans
  const cellElements = useMemo(() => {
    const elements: React.ReactElement[] = [];
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const index = row * width + col;
        const cell = cells?.[index];
        const char = cell?.char ?? ' ';
        const fg = cell?.fg;
        const bg = cell?.bg;

        // Only create per-cell style if colours differ from defaults
        const hasCustomStyle = fg || bg;
        const perCellStyle: React.CSSProperties | undefined = hasCustomStyle
          ? {
              ...cellStyle,
              ...(fg ? { color: fg } : undefined),
              ...(bg ? { backgroundColor: bg } : undefined),
            }
          : cellStyle;

        elements.push(
          <span
            key={index}
            data-col={col}
            data-row={row}
            style={perCellStyle}
            aria-hidden="true"
          >
            {char}
          </span>
        );
      }
    }
    return elements;
  }, [width, height, cells, cellStyle]);

  return (
    <div
      className={className}
      style={gridStyle}
      role="img"
      aria-label={`Character grid ${width}×${height}`}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      data-testid="character-grid"
    >
      {cellElements}
    </div>
  );
};

export default CharacterGrid;
