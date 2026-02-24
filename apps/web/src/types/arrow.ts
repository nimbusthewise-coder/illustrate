/**
 * Arrow/Connector Types — F013: Arrow / Connector Tool
 *
 * Defines types for arrows and connectors in the text-based diagram system.
 */

/**
 * Point in grid coordinates (col, row)
 */
export interface Point {
  col: number;
  row: number;
}

/**
 * Direction for routing
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Arrow/Connector stored in a layer
 * Represents a connection between two points with Manhattan routing
 */
export interface Arrow {
  id: string;
  layerId: string;
  start: Point;
  end: Point;
  path: Point[]; // Calculated path through the grid
  style: ArrowStyle;
  createdAt: number;
  updatedAt: number;
}

/**
 * Arrow styling options
 */
export interface ArrowStyle {
  /** Whether to show arrowhead at end */
  arrowhead: boolean;
  /** Whether to show arrowhead at start (bidirectional) */
  bidirectional: boolean;
  /** Line style */
  lineStyle: 'light' | 'heavy' | 'double';
}

/**
 * Character set for drawing arrows
 */
export interface ArrowCharSet {
  horizontal: string;     // ─
  vertical: string;       // │
  arrowUp: string;        // ↑
  arrowDown: string;      // ↓
  arrowLeft: string;      // ←
  arrowRight: string;     // →
  cornerTL: string;       // └
  cornerTR: string;       // ┘
  cornerBL: string;       // ┌
  cornerBR: string;       // ┐
  teeUp: string;          // ┴
  teeDown: string;        // ┬
  teeLeft: string;        // ┤
  teeRight: string;       // ├
  cross: string;          // ┼
}

/**
 * Default arrow character set (light box drawing)
 */
export const DEFAULT_ARROW_CHARSET: ArrowCharSet = {
  horizontal: '─',
  vertical: '│',
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  cornerTL: '└',
  cornerTR: '┘',
  cornerBL: '┌',
  cornerBR: '┐',
  teeUp: '┴',
  teeDown: '┬',
  teeLeft: '┤',
  teeRight: '├',
  cross: '┼',
};

/**
 * Heavy arrow character set
 */
export const HEAVY_ARROW_CHARSET: ArrowCharSet = {
  horizontal: '━',
  vertical: '┃',
  arrowUp: '⬆',
  arrowDown: '⬇',
  arrowLeft: '⬅',
  arrowRight: '➡',
  cornerTL: '┗',
  cornerTR: '┛',
  cornerBL: '┏',
  cornerBR: '┓',
  teeUp: '┻',
  teeDown: '┳',
  teeLeft: '┫',
  teeRight: '┣',
  cross: '╋',
};

/**
 * Double line arrow character set
 */
export const DOUBLE_ARROW_CHARSET: ArrowCharSet = {
  horizontal: '═',
  vertical: '║',
  arrowUp: '⇑',
  arrowDown: '⇓',
  arrowLeft: '⇐',
  arrowRight: '⇒',
  cornerTL: '╚',
  cornerTR: '╝',
  cornerBL: '╔',
  cornerBR: '╗',
  teeUp: '╩',
  teeDown: '╦',
  teeLeft: '╣',
  teeRight: '╠',
  cross: '╬',
};

/**
 * Get character set for arrow style
 */
export function getArrowCharSet(style: ArrowStyle['lineStyle']): ArrowCharSet {
  switch (style) {
    case 'heavy':
      return HEAVY_ARROW_CHARSET;
    case 'double':
      return DOUBLE_ARROW_CHARSET;
    case 'light':
    default:
      return DEFAULT_ARROW_CHARSET;
  }
}
