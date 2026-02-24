/**
 * Tool Store — F009: Fill Tool + F010: Select Tool
 * 
 * Zustand store for managing active tool and tool-specific settings.
 * Supports fill tool with character selection and preview.
 * Also supports temporary tool switching (e.g., holding spacebar for pan).
 */

import { create } from 'zustand';
import type { ToolType } from '@/lib/types';

export interface ToolState {
  activeTool: ToolType;
  temporaryTool: ToolType | null; // Temporarily active tool (e.g., pan while holding spacebar)
  fillCharacter: string; // Character to use for fill operations
  previewPositions: Array<{ row: number; col: number }>; // Preview positions before fill
  
  setActiveTool: (tool: ToolType) => void;
  setTemporaryTool: (tool: ToolType | null) => void;
  getEffectiveTool: () => ToolType;
  setFillCharacter: (char: string) => void;
  setPreviewPositions: (positions: Array<{ row: number; col: number }>) => void;
  clearPreview: () => void;
}

export const useToolStore = create<ToolState>()((set, get) => ({
  activeTool: 'select',
  temporaryTool: null,
  fillCharacter: '█', // Default fill character (solid block)
  previewPositions: [],
  
  setActiveTool: (tool: ToolType) => {
    set({ activeTool: tool, previewPositions: [] });
  },
  
  setTemporaryTool: (tool: ToolType | null) => {
    set({ temporaryTool: tool });
  },
  
  getEffectiveTool: () => {
    const state = get();
    return state.temporaryTool ?? state.activeTool;
  },
  
  setFillCharacter: (char: string) => {
    // Ensure single character
    const normalized = char.length > 0 ? char[0] : '█';
    set({ fillCharacter: normalized });
  },
  
  setPreviewPositions: (positions: Array<{ row: number; col: number }>) => {
    set({ previewPositions: positions });
  },
  
  clearPreview: () => {
    set({ previewPositions: [] });
  },
}));
