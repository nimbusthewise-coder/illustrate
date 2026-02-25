/**
 * Selection Store — tracks canvas selection for component creation
 */

import { create } from 'zustand';

export interface SelectionBounds {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SelectionState {
  selection: SelectionBounds | null;
  setSelection: (selection: SelectionBounds | null) => void;
  clearSelection: () => void;
  getSelectedChars: (layers: Array<{ buffer: { chars: string[]; width: number; height: number }; visible: boolean }>) => string[][];
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  selection: null,
  
  setSelection: (selection) => set({ selection }),
  
  clearSelection: () => set({ selection: null }),
  
  // Extract chars from selection across all visible layers
  getSelectedChars: (layers) => {
    const { selection } = get();
    if (!selection) return [];
    
    const { startRow, startCol, endRow, endCol } = selection;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    
    // Initialize with spaces
    const chars: string[][] = Array.from({ length: height }, () =>
      Array(width).fill(' ')
    );
    
    // Composite visible layers
    for (const layer of layers) {
      if (!layer.visible || !layer.buffer) continue;
      
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const sourceRow = minRow + r;
          const sourceCol = minCol + c;
          const idx = sourceRow * layer.buffer.width + sourceCol;
          const char = layer.buffer.chars[idx];
          if (char && char !== ' ') {
            chars[r][c] = char;
          }
        }
      }
    }
    
    return chars;
  },
}));
