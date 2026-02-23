/**
 * F019: Parent/child layer relationships store
 * Extends canvas-store with nesting, cascading visibility/lock, collapse/expand
 */
import { create } from 'zustand';
import { Layer } from '@/types/canvas';
import { getDescendantIds, wouldCreateCycle } from '@/types/layer-hierarchy';
import { useCanvasStore } from './canvas-store';

interface LayerHierarchyState {
  // Collapsed state tracked separately to avoid conflicts with canvas-store
  collapsedIds: Set<string>;

  nestLayer: (layerId: string, parentId: string) => void;
  unnestLayer: (layerId: string) => void;
  toggleLayerCollapsed: (layerId: string) => void;
  isCollapsed: (layerId: string) => boolean;
  toggleLayerVisibilityCascade: (layerId: string) => void;
  toggleLayerLockCascade: (layerId: string) => void;
  moveLayerPositionCascade: (layerId: string, dx: number, dy: number) => void;
  deleteLayerCascade: (layerId: string) => void;
}

export const useLayerHierarchyStore = create<LayerHierarchyState>((set, get) => ({
  collapsedIds: new Set<string>(),

  nestLayer: (layerId: string, parentId: string) => {
    const canvasState = useCanvasStore.getState();
    const { document } = canvasState;
    if (!document) return;

    // Can't nest into self or create cycles
    if (wouldCreateCycle(document.layers, layerId, parentId)) return;

    // Verify both layers exist
    const layer = document.layers.find((l) => l.id === layerId);
    const parent = document.layers.find((l) => l.id === parentId);
    if (!layer || !parent) return;

    useCanvasStore.setState({
      document: {
        ...document,
        layers: document.layers.map((l) =>
          l.id === layerId ? { ...l, parentId } : l
        ),
        updatedAt: Date.now(),
      },
    });
  },

  unnestLayer: (layerId: string) => {
    const canvasState = useCanvasStore.getState();
    const { document } = canvasState;
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer || layer.parentId === null) return;

    useCanvasStore.setState({
      document: {
        ...document,
        layers: document.layers.map((l) =>
          l.id === layerId ? { ...l, parentId: null } : l
        ),
        updatedAt: Date.now(),
      },
    });
  },

  toggleLayerCollapsed: (layerId: string) => {
    set((state) => {
      const newSet = new Set(state.collapsedIds);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return { collapsedIds: newSet };
    });
  },

  isCollapsed: (layerId: string) => {
    return get().collapsedIds.has(layerId);
  },

  toggleLayerVisibilityCascade: (layerId: string) => {
    const canvasState = useCanvasStore.getState();
    const { document } = canvasState;
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newVisible = !layer.visible;
    const descendantIds = getDescendantIds(document.layers, layerId);
    const affectedIds = new Set([layerId, ...descendantIds]);

    useCanvasStore.setState({
      document: {
        ...document,
        layers: document.layers.map((l) =>
          affectedIds.has(l.id) ? { ...l, visible: newVisible } : l
        ),
        updatedAt: Date.now(),
      },
    });
  },

  toggleLayerLockCascade: (layerId: string) => {
    const canvasState = useCanvasStore.getState();
    const { document } = canvasState;
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newLocked = !layer.locked;
    const descendantIds = getDescendantIds(document.layers, layerId);
    const affectedIds = new Set([layerId, ...descendantIds]);

    useCanvasStore.setState({
      document: {
        ...document,
        layers: document.layers.map((l) =>
          affectedIds.has(l.id) ? { ...l, locked: newLocked } : l
        ),
        updatedAt: Date.now(),
      },
    });
  },

  moveLayerPositionCascade: (layerId: string, dx: number, dy: number) => {
    const canvasState = useCanvasStore.getState();
    const { document } = canvasState;
    if (!document) return;

    const layer = document.layers.find((l) => l.id === layerId);
    if (!layer) return;

    const descendantIds = getDescendantIds(document.layers, layerId);
    const affectedIds = new Set([layerId, ...descendantIds]);

    useCanvasStore.setState({
      document: {
        ...document,
        layers: document.layers.map((l) =>
          affectedIds.has(l.id) ? { ...l, x: l.x + dx, y: l.y + dy } : l
        ),
        updatedAt: Date.now(),
      },
    });
  },

  deleteLayerCascade: (layerId: string) => {
    const canvasState = useCanvasStore.getState();
    const { document, activeLayerId } = canvasState;
    if (!document) return;

    // Collect all IDs to delete (layer + all descendants)
    const descendantIds = getDescendantIds(document.layers, layerId);
    const idsToDelete = new Set([layerId, ...descendantIds]);

    // Ensure at least one layer remains
    const remainingLayers = document.layers.filter((layer) => !idsToDelete.has(layer.id));
    if (remainingLayers.length === 0) return;

    // If deleting the active layer (or it's a descendant), switch to first remaining
    const newActiveLayerId = idsToDelete.has(activeLayerId || '')
      ? remainingLayers[0]?.id || null
      : activeLayerId;

    useCanvasStore.setState({
      document: {
        ...document,
        layers: remainingLayers,
        updatedAt: Date.now(),
      },
      activeLayerId: newActiveLayerId,
    });
  },
}));
