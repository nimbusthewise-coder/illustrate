/**
 * Layer Store — F014: Create, Rename, Delete Layers
 *
 * Zustand store managing layer CRUD operations.
 * Invariant: at least one layer must always exist.
 */

import { create } from 'zustand';
import type { Layer, Buffer, OperationDelta } from '../lib/types';
import { useCanvasStore } from './canvas-store';
import { exportLayersToAscii } from '../lib/export';

let nextId = 1;

export function generateLayerId(): string {
  return `layer-${nextId++}`;
}

/**
 * Create an empty buffer with the given dimensions
 */
export function createBuffer(width: number, height: number): Buffer {
  const size = width * height;
  return {
    width,
    height,
    chars: new Array(size).fill(' '),
    fg: new Array(size).fill('#ffffff'),
    bg: new Array(size).fill('transparent'),
    flags: new Array(size).fill(0),
  };
}

export function createLayer(name: string, id?: string): Layer {
  const { width, height } = useCanvasStore.getState();
  return {
    id: id ?? generateLayerId(),
    name,
    parentId: null,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    buffer: createBuffer(width, height),
  };
}

function makeDefaultLayer(): Layer {
  return createLayer('Layer 1');
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string;

  // F019: Layer hierarchy
  expandedLayers: string[]; // IDs of expanded parent layers

  // Undo/redo stacks (per PRD §5.4)
  undoStack: OperationDelta[];
  redoStack: OperationDelta[];

  addLayer: (name?: string) => void;
  renameLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => boolean;
  setActiveLayer: (id: string) => void;
  getLayer: (id: string) => Layer | undefined;
  getVisibleLayers: () => Layer[];
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  isLayerLocked: (id: string) => boolean;
  moveLayer: (id: string, direction: 'up' | 'down') => boolean;
  reorderLayer: (id: string, newIndex: number) => boolean;

  // Buffer operations
  setCell: (layerId: string, row: number, col: number, char: string) => void;
  getCell: (layerId: string, row: number, col: number) => string | null;
  setCells: (
    layerId: string,
    cells: Array<{ row: number; col: number; char: string }>
  ) => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;
  pushOperation: (delta: OperationDelta) => void;

  // Export
  exportToAscii: () => string;
}

export const useLayerStore = create<LayerState>()((set, get) => {
  const defaultLayer = makeDefaultLayer();

  return {
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,
    expandedLayers: [],
    undoStack: [],
    redoStack: [],

    addLayer: (name?: string) => {
      const state = get();
      const newName = name ?? `Layer ${state.layers.length + 1}`;
      const layer = createLayer(newName);
      set({
        layers: [...state.layers, layer],
        activeLayerId: layer.id,
      });
    },

    renameLayer: (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, name: trimmed } : l
        ),
      }));
    },

    deleteLayer: (id: string): boolean => {
      const state = get();
      if (state.layers.length <= 1) {
        return false;
      }
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx === -1) return false;

      const newLayers = state.layers.filter((l) => l.id !== id);
      const newActiveId =
        state.activeLayerId === id
          ? newLayers[Math.min(idx, newLayers.length - 1)].id
          : state.activeLayerId;

      set({ layers: newLayers, activeLayerId: newActiveId });
      return true;
    },

    setActiveLayer: (id: string) => {
      const state = get();
      if (state.layers.some((l) => l.id === id)) {
        set({ activeLayerId: id });
      }
    },

    getLayer: (id: string) => {
      return get().layers.find((l) => l.id === id);
    },

    getVisibleLayers: () => {
      return get().layers.filter((l) => l.visible);
    },

    toggleLayerVisibility: (id: string) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l
        ),
      }));
    },

    toggleLayerLock: (id: string) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, locked: !l.locked } : l
        ),
      }));
    },

    isLayerLocked: (id: string): boolean => {
      const layer = get().layers.find((l) => l.id === id);
      return layer?.locked ?? false;
    },

    moveLayer: (id: string, direction: 'up' | 'down'): boolean => {
      const state = get();
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx === -1) return false;

      const newIndex = direction === 'up' ? idx + 1 : idx - 1;
      if (newIndex < 0 || newIndex >= state.layers.length) return false;

      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(idx, 1);
      newLayers.splice(newIndex, 0, removed);

      set({ layers: newLayers });
      return true;
    },

    reorderLayer: (id: string, newIndex: number): boolean => {
      const state = get();
      const idx = state.layers.findIndex((l) => l.id === id);
      if (idx === -1) return false;
      if (newIndex < 0 || newIndex >= state.layers.length) return false;
      if (idx === newIndex) return true;

      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(idx, 1);
      newLayers.splice(newIndex, 0, removed);

      set({ layers: newLayers });
      return true;
    },

    // Buffer operations
    setCell: (layerId: string, row: number, col: number, char: string) => {
      // Prevent editing locked layers
      if (get().isLayerLocked(layerId)) {
        console.warn(`Cannot edit locked layer: ${layerId}`);
        return;
      }

      set((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== layerId) return layer;
          const { buffer } = layer;
          const idx = row * buffer.width + col;
          if (idx < 0 || idx >= buffer.chars.length) return layer;

          const newChars = [...buffer.chars];
          newChars[idx] = char;

          return {
            ...layer,
            buffer: { ...buffer, chars: newChars },
          };
        }),
      }));
    },

    getCell: (layerId: string, row: number, col: number): string | null => {
      const layer = get().layers.find((l) => l.id === layerId);
      if (!layer) return null;
      const { buffer } = layer;
      const idx = row * buffer.width + col;
      if (idx < 0 || idx >= buffer.chars.length) return null;
      return buffer.chars[idx];
    },

    setCells: (
      layerId: string,
      cells: Array<{ row: number; col: number; char: string }>
    ) => {
      // Prevent editing locked layers
      if (get().isLayerLocked(layerId)) {
        console.warn(`Cannot edit locked layer: ${layerId}`);
        return;
      }

      set((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== layerId) return layer;
          const { buffer } = layer;
          const newChars = [...buffer.chars];

          for (const { row, col, char } of cells) {
            const idx = row * buffer.width + col;
            if (idx >= 0 && idx < newChars.length) {
              newChars[idx] = char;
            }
          }

          return {
            ...layer,
            buffer: { ...buffer, chars: newChars },
          };
        }),
      }));
    },

    // Undo/redo
    undo: () => {
      const state = get();
      const delta = state.undoStack[state.undoStack.length - 1];
      if (!delta) return;

      // Apply undo: restore 'before' values
      const cells = delta.cells.map((c) => ({
        row: c.row,
        col: c.col,
        char: c.before,
      }));
      get().setCells(delta.layerId, cells);

      // Move delta to redo stack
      set({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, delta],
      });
    },

    redo: () => {
      const state = get();
      const delta = state.redoStack[state.redoStack.length - 1];
      if (!delta) return;

      // Apply redo: restore 'after' values
      const cells = delta.cells.map((c) => ({
        row: c.row,
        col: c.col,
        char: c.after,
      }));
      get().setCells(delta.layerId, cells);

      // Move delta to undo stack
      set({
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, delta],
      });
    },

    pushOperation: (delta: OperationDelta) => {
      set((state) => ({
        undoStack: [...state.undoStack, delta],
        redoStack: [], // Clear redo stack on new operation
      }));
    },

    // Export — F041: Plain ASCII Text Export
    exportToAscii: () => {
      const state = get();
      const canvasState = useCanvasStore.getState();
      return exportLayersToAscii(
        state.layers,
        canvasState.width,
        canvasState.height
      );
    },
  };
});

/**
 * Reset store and ID counter — for testing only.
 */
export function resetLayerStore() {
  nextId = 1;
  const defaultLayer = makeDefaultLayer();
  useLayerStore.setState({
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,
  });
}
