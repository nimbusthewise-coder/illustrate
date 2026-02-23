/**
 * Editor state management
 */

import { Buffer, createBuffer } from './buffer.js';
import { ToolState, createToolState, ToolType, setActiveTool, setInputActive } from './tools.js';

export interface TextCursor {
  col: number;
  row: number;
  visible: boolean;
}

export interface EditorState {
  buffer: Buffer;
  toolState: ToolState;
  cursor: TextCursor | null;
}

export function createEditorState(width: number, height: number): EditorState {
  return {
    buffer: createBuffer(width, height),
    toolState: createToolState(),
    cursor: null,
  };
}

export function switchTool(state: EditorState, tool: ToolType): EditorState {
  return {
    ...state,
    toolState: setActiveTool(state.toolState, tool),
    cursor: tool === 'text' ? state.cursor : null,
  };
}

export function activateTextCursor(state: EditorState, col: number, row: number): EditorState {
  return {
    ...state,
    cursor: { col, row, visible: true },
    toolState: setInputActive(state.toolState, true),
  };
}

export function deactivateTextCursor(state: EditorState): EditorState {
  return {
    ...state,
    cursor: state.cursor ? { ...state.cursor, visible: false } : null,
    toolState: setInputActive(state.toolState, false),
  };
}

export function moveTextCursor(state: EditorState, col: number, row: number): EditorState {
  if (!state.cursor) return state;
  
  // Clamp to buffer bounds
  const clampedCol = Math.max(0, Math.min(col, state.buffer.width - 1));
  const clampedRow = Math.max(0, Math.min(row, state.buffer.height - 1));
  
  return {
    ...state,
    cursor: {
      ...state.cursor,
      col: clampedCol,
      row: clampedRow,
    },
  };
}
