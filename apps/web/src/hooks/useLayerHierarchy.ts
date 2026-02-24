/**
 * useLayerHierarchy — F019: Parent / Child Layer Relationships
 *
 * Hook for managing hierarchical layer operations
 */

import { useCallback } from 'react';
import { useLayerStore } from '../stores/layer-store';
import {
  canNestLayer,
  getDescendants,
  hasChildren,
  isEffectivelyVisible,
  isEffectivelyLocked,
} from '../utils/layerUtils';

export function useLayerHierarchy() {
  const layers = useLayerStore((state) => state.layers);

  /**
   * Set a layer's parent
   */
  const setLayerParent = useCallback(
    (layerId: string, parentId: string | null) => {
      if (!canNestLayer(layers, layerId, parentId)) {
        console.warn('Cannot nest layer: would create circular reference');
        return false;
      }

      useLayerStore.setState((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, parentId } : layer
        ),
      }));

      return true;
    },
    [layers]
  );

  /**
   * Nest a layer under a parent
   */
  const nestLayer = useCallback(
    (layerId: string, parentId: string) => {
      return setLayerParent(layerId, parentId);
    },
    [setLayerParent]
  );

  /**
   * Remove a layer from its parent (make it root-level)
   */
  const unnestLayer = useCallback(
    (layerId: string) => {
      return setLayerParent(layerId, null);
    },
    [setLayerParent]
  );

  /**
   * Toggle expand/collapse state for a layer with children
   */
  const toggleLayerExpanded = useCallback((layerId: string) => {
    useLayerStore.setState((state) => ({
      expandedLayers: state.expandedLayers.includes(layerId)
        ? state.expandedLayers.filter((id) => id !== layerId)
        : [...state.expandedLayers, layerId],
    }));
  }, []);

  /**
   * Check if a layer is expanded
   */
  const isLayerExpanded = useCallback(
    (layerId: string): boolean => {
      const state = useLayerStore.getState();
      return state.expandedLayers.includes(layerId);
    },
    []
  );

  /**
   * Get effective visibility (considering parent visibility)
   */
  const getEffectiveVisibility = useCallback(
    (layerId: string): boolean => {
      return isEffectivelyVisible(layers, layerId);
    },
    [layers]
  );

  /**
   * Get effective lock state (considering parent lock)
   */
  const getEffectiveLock = useCallback(
    (layerId: string): boolean => {
      return isEffectivelyLocked(layers, layerId);
    },
    [layers]
  );

  /**
   * When hiding a parent, also hide all descendants
   */
  const toggleLayerVisibilityWithDescendants = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      const newVisible = !layer.visible;
      const descendants = getDescendants(layers, layerId);
      const affectedIds = [layerId, ...descendants.map((d) => d.id)];

      useLayerStore.setState((state) => ({
        layers: state.layers.map((l) =>
          affectedIds.includes(l.id) ? { ...l, visible: newVisible } : l
        ),
      }));
    },
    [layers]
  );

  /**
   * When locking a parent, also lock all descendants
   */
  const toggleLayerLockWithDescendants = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      const newLocked = !layer.locked;
      const descendants = getDescendants(layers, layerId);
      const affectedIds = [layerId, ...descendants.map((d) => d.id)];

      useLayerStore.setState((state) => ({
        layers: state.layers.map((l) =>
          affectedIds.includes(l.id) ? { ...l, locked: newLocked } : l
        ),
      }));
    },
    [layers]
  );

  /**
   * Check if a layer has children
   */
  const layerHasChildren = useCallback(
    (layerId: string): boolean => {
      return hasChildren(layers, layerId);
    },
    [layers]
  );

  return {
    nestLayer,
    unnestLayer,
    toggleLayerExpanded,
    isLayerExpanded,
    getEffectiveVisibility,
    getEffectiveLock,
    toggleLayerVisibilityWithDescendants,
    toggleLayerLockWithDescendants,
    layerHasChildren,
  };
}
