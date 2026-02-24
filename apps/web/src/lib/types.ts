/**
 * Core types for illustrate.md
 * Based on PRD §5.1 Buffer Structure, §5.2 Layer Model, §5.3 Canvas Document, §5.4 Delta/Undo
 */

/**
 * Buffer — flat typed-array representation of a canvas region
 * Per PRD §5.1
 */
export interface Buffer {
  width: number;
  height: number;
  chars: string[]; // Unicode characters (simplified from Uint16Array for now)
  fg: string[]; // Foreground colors (hex strings)
  bg: string[]; // Background colors (hex strings)
  flags: number[]; // Style flags (bold, italic, underline)
}

/**
 * Layer — named, positioned buffer instance
 * Per PRD §5.2
 */
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

/**
 * Cell position in grid coordinates
 */
export interface CellPosition {
  row: number;
  col: number;
}

/**
 * Delta — record of cell-level changes for undo/redo
 * Per PRD §5.4
 */
export interface CellDelta {
  row: number;
  col: number;
  before: string;
  after: string;
}

export interface OperationDelta {
  layerId: string;
  cells: CellDelta[];
}

/**
 * Tool types
 */
export type ToolType = 'select' | 'box' | 'line' | 'text' | 'fill' | 'eraser' | 'pan';

/**
 * Selection — rectangular region on canvas
 * F010: Multi-cell Selection Tool
 */
export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  layerId: string;
}

/**
 * Slot — editable region within a component
 * F020: Define Reusable Named Components
 */
export interface ComponentSlot {
  id: string;
  name: string;
  row: number;
  col: number;
  width: number;
  height: number;
  defaultContent?: string;
}

/**
 * Component — reusable template with slots
 * F020: Define Reusable Named Components
 */
export interface Component {
  id: string;
  name: string;
  description: string;
  role: string; // e.g., "dialog", "button", "header", "menu"
  buffer: Buffer; // Template structure captured from selection
  slots: ComponentSlot[]; // Editable regions
  createdAt: number;
  updatedAt: number;
}

/**
 * ComponentInstance — a placed component on canvas
 * F021: Place Components on Canvas
 */
export interface ComponentInstance {
  id: string;
  componentId: string; // Reference to Component
  layerId: string; // Layer where instance is placed
  row: number; // Top-left position
  col: number;
  slotContents: Record<string, string>; // slotId -> content override
  createdAt: number;
}
