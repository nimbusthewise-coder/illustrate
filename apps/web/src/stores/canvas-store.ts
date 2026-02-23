import { create } from 'zustand';
import { Layer, CanvasDocument, createLayer, CompositeMode } from '@/types/canvas';
import { EraserSize } from '@/types/tools';
import { Component } from '@/types/design-system';

interface Selection {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

interface CanvasState {
  document: CanvasDocument | null;
  activeLayerId: string | null;
  selection: Selection | null;
  initializeDocument: (width: number, height: number, title?: string) => void;
  addLayer: () => void;
  renameLayer: (layerId: string, newName: string) => void;
  deleteLayer: (layerId: string) => void;
  reorderLayer: (layerId: string, newIndex: number) => void;
  moveLayerUp: (layerId: string) => void;
  moveLayerDown: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLayerCompositeMode: (layerId: string, mode: CompositeMode) => void;
  eraseCell: (layerId: string, col: number, row: number) => void;
  eraseCells: (layerId: string, col: number, row: number, size: EraserSize) => void;
  writeChar: (layerId: string, col: number, row: number, char: string, fg?: number, bg?: number) => void;
  drawLine: (layerId: string, startCol: number, startRow: number, endCol: number, endRow: number) => void;
  drawBox: (layerId: string, startCol: number, startRow: number, endCol: number, endRow: number) => void;
  setSelection: (startCol: number, startRow: number, endCol: number, endRow: number) => void;
  clearSelection: () => void;
  placeComponent: (component: Component, col: number, row: number, layerId?: string) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  document: null,
  activeLayerId: null,
  selection: null,

  initializeDocument: (width: number, height: number, title = 'Untitled') => {
    // Clamp dimensions to F001 constraints: 1-256
    const clampedWidth = Math.max(1, Math.min(256, Math.floor(width)));
    const clampedHeight = Math.max(1, Math.min(256, Math.floor(height)));
    
    const defaultLayer = createLayer('Layer 1', clampedWidth, clampedHeight);
    const document: CanvasDocument = {
      id: `doc-${Date.now()}`,
      title,
      width: clampedWidth,
      height: clampedHeight,
      layers: [defaultLayer],
      designSystemId: null,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    set({ document, activeLayerId: defaultLayer.id });
  },

  addLayer: () => {
    const { document } = get();
    if (!document) return;

    const newLayerNumber = document.layers.length + 1;
    const newLayer = createLayer(
      `Layer ${newLayerNumber}`,
      document.width,
      document.height
    );

    set({
      document: {
        ...document,
        layers: [...document.layers, newLayer],
        updatedAt: Date.now(),
      },
      activeLayerId: newLayer.id,
    });
  },

  renameLayer: (layerId: string, newName: string) => {
    const { document } = get();
    if (!document) return;

    set({
      document: {
        ...document,
        layers: document.layers.map((layer) =>
          layer.id === layerId ? { ...layer, name: newName } : layer
        ),
        updatedAt: Date.now(),
      },
    });
  },

  deleteLayer: (layerId: string) => {
    const { document, activeLayerId } = get();
    if (!document) return;

    // Ensure at least one layer exists
    if (document.layers.length <= 1) {
      return;
    }

    const updatedLayers = document.layers.filter((layer) => layer.id !== layerId);
    
    // If deleting the active layer, switch to the first remaining layer
    const newActiveLayerId = activeLayerId === layerId
      ? updatedLayers[0]?.id || null
      : activeLayerId;

    set({
      document: {
        ...document,
        layers: updatedLayers,
        updatedAt: Date.now(),
      },
      activeLayerId: newActiveLayerId,
    });
  },

  reorderLayer: (layerId: string, newIndex: number) => {
    const { document } = get();
    if (!document) return;

    const currentIndex = document.layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex === -1) return;

    // Clamp newIndex to valid range
    const clampedIndex = Math.max(0, Math.min(document.layers.length - 1, newIndex));
    
    // No change needed
    if (currentIndex === clampedIndex) return;

    const updatedLayers = [...document.layers];
    const [movedLayer] = updatedLayers.splice(currentIndex, 1);
    updatedLayers.splice(clampedIndex, 0, movedLayer);

    set({
      document: {
        ...document,
        layers: updatedLayers,
        updatedAt: Date.now(),
      },
    });
  },

  moveLayerUp: (layerId: string) => {
    const { document, reorderLayer } = get();
    if (!document) return;

    const currentIndex = document.layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex === -1 || currentIndex === document.layers.length - 1) return;

    // Move up means higher in the stack (later in the array, rendered on top)
    reorderLayer(layerId, currentIndex + 1);
  },

  moveLayerDown: (layerId: string) => {
    const { document, reorderLayer } = get();
    if (!document) return;

    const currentIndex = document.layers.findIndex((layer) => layer.id === layerId);
    if (currentIndex === -1 || currentIndex === 0) return;

    // Move down means lower in the stack (earlier in the array, rendered below)
    reorderLayer(layerId, currentIndex - 1);
  },

  setActiveLayer: (layerId: string) => {
    set({ activeLayerId: layerId });
  },

  toggleLayerVisibility: (layerId: string) => {
    const { document } = get();
    if (!document) return;

    set({
      document: {
        ...document,
        layers: document.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ),
        updatedAt: Date.now(),
      },
    });
  },

  setLayerOpacity: (layerId: string, opacity: number) => {
    const { document } = get();
    if (!document) return;

    // Clamp opacity to 0-100 range
    const clampedOpacity = Math.max(0, Math.min(100, opacity));

    set({
      document: {
        ...document,
        layers: document.layers.map((layer) =>
          layer.id === layerId ? { ...layer, opacity: clampedOpacity } : layer
        ),
        updatedAt: Date.now(),
      },
    });
  },

  setLayerCompositeMode: (layerId: string, mode: CompositeMode) => {
    const { document } = get();
    if (!document) return;

    set({
      document: {
        ...document,
        layers: document.layers.map((layer) =>
          layer.id === layerId ? { ...layer, compositeMode: mode } : layer
        ),
        updatedAt: Date.now(),
      },
    });
  },

  eraseCell: (layerId: string, col: number, row: number) => {
    const { document } = get();
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    const { buffer } = layer;
    
    // Check bounds
    if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
      return;
    }

    const index = row * buffer.width + col;
    
    // Clear the cell (set to empty/transparent)
    buffer.chars[index] = 0;
    buffer.fg[index] = 0;
    buffer.bg[index] = 0;
    buffer.flags[index] = 0;

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },

  eraseCells: (layerId: string, col: number, row: number, size: EraserSize) => {
    const { document } = get();
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    const halfSize = Math.floor(size / 2);
    
    // Erase all cells in the area
    for (let dy = -halfSize; dy <= halfSize; dy++) {
      for (let dx = -halfSize; dx <= halfSize; dx++) {
        const targetCol = col + dx;
        const targetRow = row + dy;
        
        // Check bounds
        if (
          targetCol >= 0 && targetCol < layer.buffer.width &&
          targetRow >= 0 && targetRow < layer.buffer.height
        ) {
          const index = targetRow * layer.buffer.width + targetCol;
          layer.buffer.chars[index] = 0;
          layer.buffer.fg[index] = 0;
          layer.buffer.bg[index] = 0;
          layer.buffer.flags[index] = 0;
        }
      }
    }

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },

  writeChar: (layerId: string, col: number, row: number, char: string, fg = 0xFFFFFF, bg = 0x000000) => {
    const { document } = get();
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    const { buffer } = layer;
    
    // Check bounds
    if (col < 0 || col >= buffer.width || row < 0 || row >= buffer.height) {
      return;
    }

    const index = row * buffer.width + col;
    
    // Write the character
    buffer.chars[index] = char.charCodeAt(0) || 0;
    buffer.fg[index] = fg;
    buffer.bg[index] = bg;
    // flags can remain as is or be set to 0 for now

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },

  drawLine: (layerId: string, startCol: number, startRow: number, endCol: number, endRow: number) => {
    const { document } = get();
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    // Calculate the delta
    const dx = endCol - startCol;
    const dy = endRow - startRow;

    // Snap to H/V/45° angles
    let snappedEndCol = endCol;
    let snappedEndRow = endRow;

    if (dx === 0) {
      // Vertical line - already snapped
    } else if (dy === 0) {
      // Horizontal line - already snapped
    } else {
      // Diagonal - snap to 45° by finding which direction is closer
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (absDx > absDy * 1.5) {
        // More horizontal - snap to horizontal
        snappedEndRow = startRow;
      } else if (absDy > absDx * 1.5) {
        // More vertical - snap to vertical
        snappedEndCol = startCol;
      } else {
        // Diagonal - snap to 45°
        const diagonal = Math.min(absDx, absDy);
        snappedEndCol = startCol + Math.sign(dx) * diagonal;
        snappedEndRow = startRow + Math.sign(dy) * diagonal;
      }
    }

    // Recalculate after snapping
    const finalDx = snappedEndCol - startCol;
    const finalDy = snappedEndRow - startRow;
    const steps = Math.max(Math.abs(finalDx), Math.abs(finalDy));

    if (steps === 0) {
      // Single point
      const index = startRow * layer.buffer.width + startCol;
      if (index >= 0 && index < layer.buffer.chars.length) {
        layer.buffer.chars[index] = '·'.charCodeAt(0);
      }
      set({
        document: {
          ...document,
          updatedAt: Date.now(),
        },
      });
      return;
    }

    // Determine line character based on direction
    let lineChar = '─'; // horizontal
    if (finalDx === 0) {
      lineChar = '│'; // vertical
    } else if (finalDy === 0) {
      lineChar = '─'; // horizontal
    } else if (Math.sign(finalDx) === Math.sign(finalDy)) {
      lineChar = '╲'; // diagonal \
    } else {
      lineChar = '╱'; // diagonal /
    }

    // Draw the line using Bresenham-like algorithm
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const col = Math.round(startCol + finalDx * t);
      const row = Math.round(startRow + finalDy * t);
      
      if (col >= 0 && col < layer.buffer.width && row >= 0 && row < layer.buffer.height) {
        const index = row * layer.buffer.width + col;
        layer.buffer.chars[index] = lineChar.charCodeAt(0);
        layer.buffer.fg[index] = 0xFFFFFF;
        layer.buffer.bg[index] = 0x000000;
      }
    }

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },

  drawBox: (layerId: string, startCol: number, startRow: number, endCol: number, endRow: number) => {
    const { document } = get();
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.locked) return;

    // Normalize coordinates to get min/max
    let minCol = Math.min(startCol, endCol);
    let maxCol = Math.max(startCol, endCol);
    let minRow = Math.min(startRow, endRow);
    let maxRow = Math.max(startRow, endRow);

    const boxWidth = maxCol - minCol + 1;
    const boxHeight = maxRow - minRow + 1;

    // Enforce minimum 2×2 size as per F006 requirements
    if (boxWidth < 2 || boxHeight < 2) {
      return;
    }

    // Clamp to canvas bounds
    minCol = Math.max(0, minCol);
    maxCol = Math.min(layer.buffer.width - 1, maxCol);
    minRow = Math.max(0, minRow);
    maxRow = Math.min(layer.buffer.height - 1, maxRow);

    // Light box-drawing characters (default charset)
    const TL = '┌'; // top-left
    const TR = '┐'; // top-right
    const BL = '└'; // bottom-left
    const BR = '┘'; // bottom-right
    const H = '─';  // horizontal
    const V = '│';  // vertical

    // Draw the box borders
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        let char = ' ';

        // Corners
        if (row === minRow && col === minCol) {
          char = TL;
        } else if (row === minRow && col === maxCol) {
          char = TR;
        } else if (row === maxRow && col === minCol) {
          char = BL;
        } else if (row === maxRow && col === maxCol) {
          char = BR;
        }
        // Top and bottom edges
        else if (row === minRow || row === maxRow) {
          char = H;
        }
        // Left and right edges
        else if (col === minCol || col === maxCol) {
          char = V;
        }
        // Interior - skip (don't fill inside)
        else {
          continue;
        }

        // Write the character
        const index = row * layer.buffer.width + col;
        layer.buffer.chars[index] = char.charCodeAt(0);
        layer.buffer.fg[index] = 0xFFFFFF;
        layer.buffer.bg[index] = 0x000000;
      }
    }

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },

  setSelection: (startCol: number, startRow: number, endCol: number, endRow: number) => {
    set({
      selection: { startCol, startRow, endCol, endRow },
    });
  },

  clearSelection: () => {
    set({ selection: null });
  },

  placeComponent: (component: Component, col: number, row: number, layerId?: string) => {
    const { document, activeLayerId } = get();
    if (!document) return;

    const targetLayerId = layerId || activeLayerId;
    if (!targetLayerId) return;

    const layer = document.layers.find((l) => l.id === targetLayerId);
    if (!layer || layer.locked) return;

    const { template } = component;

    // Place the component template on the canvas at the specified position
    for (let templateRow = 0; templateRow < template.height; templateRow++) {
      for (let templateCol = 0; templateCol < template.width; templateCol++) {
        const canvasCol = col + templateCol;
        const canvasRow = row + templateRow;

        // Check bounds
        if (
          canvasCol >= 0 &&
          canvasCol < layer.buffer.width &&
          canvasRow >= 0 &&
          canvasRow < layer.buffer.height
        ) {
          const templateIndex = templateRow * template.width + templateCol;
          const canvasIndex = canvasRow * layer.buffer.width + canvasCol;

          // Only copy non-empty cells
          if (template.chars[templateIndex] !== 0) {
            layer.buffer.chars[canvasIndex] = template.chars[templateIndex];
            layer.buffer.fg[canvasIndex] = template.fg[templateIndex];
            layer.buffer.bg[canvasIndex] = template.bg[templateIndex];
            layer.buffer.flags[canvasIndex] = template.flags[templateIndex];
          }
        }
      }
    }

    set({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  },
}));
