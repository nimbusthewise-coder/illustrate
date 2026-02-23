/**
 * Design System types for illustrate.md
 * Based on PRD section 5.6
 */

import { Buffer } from './canvas';

export type ComponentRole =
  | 'container'    // modals, cards, panels
  | 'navigation'   // nav bars, tabs, breadcrumbs
  | 'input'        // buttons, text fields, dropdowns
  | 'display'      // labels, badges, status indicators
  | 'layout'       // dividers, spacers, grids
  | 'feedback';    // alerts, toasts, progress bars

export interface Slot {
  name: string;    // e.g. "title", "body", "icon"
  x: number;
  y: number;
  width: number;
  height: number;
  default: string;  // placeholder text
}

export interface Component {
  id: string;
  name: string;           // e.g. "Button", "Modal", "NavBar", "ChatBubble"
  description: string;
  role: ComponentRole;    // semantic category
  minWidth: number;
  minHeight: number;
  resizable: boolean;
  template: Buffer;       // the ASCII pattern at default size
  slots: Slot[];          // named editable regions within the component
  tags: string[];
}

export interface BoxChars {
  tl: string;   // top-left
  tr: string;   // top-right
  bl: string;   // bottom-left
  br: string;   // bottom-right
  h: string;    // horizontal
  v: string;    // vertical
}

export interface ConnectorChars {
  left: string;     // ├
  right: string;    // ┤
  top: string;      // ┬
  bottom: string;   // ┴
  cross: string;    // ┼
}

export interface ArrowChars {
  left: string;     // ←
  right: string;    // →
  up: string;       // ↑
  down: string;     // ↓
  leftSolid: string;  // ◀
  rightSolid: string; // ▶
  upSolid: string;    // ▲
  downSolid: string;  // ▼
}

export interface CharacterSet {
  boxLight: BoxChars;    // ┌ ─ ┐ │ └ ┘
  boxHeavy: BoxChars;    // ┏ ━ ┓ ┃ ┗ ┛
  boxDouble: BoxChars;   // ╔ ═ ╗ ║ ╚ ╝
  boxRound: BoxChars;    // ╭ ─ ╮ │ ╰ ╯
  connectors: ConnectorChars;
  arrows: ArrowChars;
  fills: string[];       // [' ', '░', '▒', '▓', '█']
}

export interface DesignSystem {
  id: string;
  name: string;           // e.g. "mobile-app", "dashboard", "cli-ui"
  description: string;
  version: string;        // semver for shared systems
  charset: CharacterSet;  // which box-drawing chars, connectors, fills to use
  components: Component[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Default character sets
 */
export const DEFAULT_CHARSET: CharacterSet = {
  boxLight: {
    tl: '┌',
    tr: '┐',
    bl: '└',
    br: '┘',
    h: '─',
    v: '│',
  },
  boxHeavy: {
    tl: '┏',
    tr: '┓',
    bl: '┗',
    br: '┛',
    h: '━',
    v: '┃',
  },
  boxDouble: {
    tl: '╔',
    tr: '╗',
    bl: '╚',
    br: '╝',
    h: '═',
    v: '║',
  },
  boxRound: {
    tl: '╭',
    tr: '╮',
    bl: '╰',
    br: '╯',
    h: '─',
    v: '│',
  },
  connectors: {
    left: '├',
    right: '┤',
    top: '┬',
    bottom: '┴',
    cross: '┼',
  },
  arrows: {
    left: '←',
    right: '→',
    up: '↑',
    down: '↓',
    leftSolid: '◀',
    rightSolid: '▶',
    upSolid: '▲',
    downSolid: '▼',
  },
  fills: [' ', '░', '▒', '▓', '█'],
};

/**
 * Generate a unique ID for components
 */
export function generateComponentId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for design systems
 */
export function generateDesignSystemId(): string {
  return `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty design system
 */
export function createDesignSystem(name: string, description: string = ''): DesignSystem {
  return {
    id: generateDesignSystemId(),
    name,
    description,
    version: '1.0.0',
    charset: DEFAULT_CHARSET,
    components: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
