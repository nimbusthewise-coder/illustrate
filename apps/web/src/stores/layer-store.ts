/**
 * Layer Store — F014: Create, Rename, Delete Layers
 *
 * Zustand store managing layer CRUD operations.
 * Invariant: at least one layer must always exist.
 */

import { create } from 'zustand';
import type { Layer } from '../lib/types';

let nextId = 1;

export function generateLayerId(): string {
  return `layer-${nextId++}`;
}

export function createLayer(name: string, id?: string): Layer {
  return {
    id: id ?? generateLayerId(),
    name,
    parentId: null,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
  };
}

function makeDefaultLayer(): Layer {
  return createLayer('Layer 1');
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string;

  addLayer: (name?: string) => void;
  renameLayer: (id: string, name: string) => void;
  deleteLayer: (id: string) => boolean;
  setActiveLayer: (id: string) => void;
  getLayer: (id: string) => Layer | undefined;
}

export const useLayerStore = create<LayerState>()((set, get) => {
  const defaultLayer = makeDefaultLayer();

  return {
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,

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
