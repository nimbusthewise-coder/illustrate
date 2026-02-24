/**
 * Core data types for illustrate.md
 */

export interface Buffer {
  width: number;
  height: number;
  chars: Uint16Array;   // Unicode character codes
  fg: Uint32Array;      // Foreground color (RGBA)
  bg: Uint32Array;      // Background color (RGBA)
  flags: Uint8Array;    // Bold, italic, underline, etc.
}

export interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  buffer: Buffer;
}

export interface CanvasDocument {
  id: string;
  title: string;
  width: number;
  height: number;
  layers: Layer[];
  designSystem: DesignSystem | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Delta {
  index: number;
  before: [charCode: number, fg: number, bg: number, flags: number];
  after: [charCode: number, fg: number, bg: number, flags: number];
}

export interface UndoEntry {
  timestamp: number;
  label: string;
  deltas: Delta[];
}

export type ToolType = 
  | 'select'
  | 'box'
  | 'line'
  | 'text'
  | 'eraser'
  | 'fill';

export interface Point {
  x: number;
  y: number;
}

// Design System Types

export interface BoxChars {
  tl: string;   // top-left
  tr: string;   // top-right
  bl: string;   // bottom-left
  br: string;   // bottom-right
  h: string;    // horizontal
  v: string;    // vertical
}

export interface ConnectorChars {
  left: string;      // ├
  right: string;     // ┤
  top: string;       // ┬
  bottom: string;    // ┴
  cross: string;     // ┼
}

export interface ArrowChars {
  left: string;      // ←
  right: string;     // →
  up: string;        // ↑
  down: string;      // ↓
  leftFilled: string;  // ◀
  rightFilled: string; // ▶
  upFilled: string;    // ▲
  downFilled: string;  // ▼
}

export interface CharacterSet {
  boxLight: BoxChars;
  boxHeavy: BoxChars;
  boxDouble: BoxChars;
  boxRound: BoxChars;
  connectors: ConnectorChars;
  arrows: ArrowChars;
  fills: string[];  // [' ', '░', '▒', '▓', '█']
}

export type ComponentRole =
  | 'container'    // modals, cards, panels
  | 'navigation'   // nav bars, tabs, breadcrumbs
  | 'input'        // buttons, text fields, dropdowns
  | 'display'      // labels, badges, status indicators
  | 'layout'       // dividers, spacers, grids
  | 'feedback';    // alerts, toasts, progress bars

export interface Slot {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  default: string;  // placeholder text
}

export interface Component {
  id: string;
  name: string;
  description: string;
  role: ComponentRole;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
  template: Buffer;
  slots: Slot[];
  tags: string[];
}

export interface DesignSystem {
  id: string;
  name: string;
  description: string;
  version: string;
  charset: CharacterSet;
  components: Component[];
  createdAt: number;
  updatedAt: number;
}
