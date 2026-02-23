/**
 * Tool store with modal input support for BUG-001 fix
 */

import { create } from 'zustand';
import { ToolType, EraserSize, ToolSettings } from '@/types/tools';

interface TextCursor {
  col: number;
  row: number;
  visible: boolean;
}

interface ToolState {
  currentTool: ToolType;
  settings: ToolSettings;
  isInputActive: boolean;  // Modal input flag - prevents tool shortcuts while typing
  textCursor: TextCursor | null;
  
  // Actions
  setTool: (tool: ToolType) => void;
  setEraserSize: (size: EraserSize) => void;
  setInputActive: (active: boolean) => void;
  setTextCursor: (cursor: TextCursor | null) => void;
  exitTextMode: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'select',
  settings: {
    eraserSize: 1,
  },
  isInputActive: false,
  textCursor: null,

  setTool: (tool: ToolType) => {
    set({ 
      currentTool: tool,
      isInputActive: false,  // Reset input mode when switching tools
      textCursor: null,      // Clear cursor when switching away from text tool
    });
  },

  setEraserSize: (size: EraserSize) => {
    set(state => ({
      settings: {
        ...state.settings,
        eraserSize: size,
      },
    }));
  },

  setInputActive: (active: boolean) => {
    set({ isInputActive: active });
  },

  setTextCursor: (cursor: TextCursor | null) => {
    set({ 
      textCursor: cursor,
      isInputActive: cursor?.visible || false,  // Auto-activate input mode when cursor is visible
    });
  },

  exitTextMode: () => {
    set({ 
      isInputActive: false,
      textCursor: null,
    });
  },
}));
