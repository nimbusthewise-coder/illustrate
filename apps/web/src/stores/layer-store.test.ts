import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore, resetLayerStore } from './layer-store';

describe('Layer Store — F014', () => {
  beforeEach(() => {
    resetLayerStore();
  });

  it('starts with one default layer', () => {
    const { layers, activeLayerId } = useLayerStore.getState();
    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe('Layer 1');
    expect(activeLayerId).toBe(layers[0].id);
  });

  describe('addLayer', () => {
    it('adds a layer with auto-generated name', () => {
      useLayerStore.getState().addLayer();
      const { layers } = useLayerStore.getState();
      expect(layers).toHaveLength(2);
      expect(layers[1].name).toBe('Layer 2');
    });

    it('adds a layer with a custom name', () => {
      useLayerStore.getState().addLayer('Background');
      const { layers } = useLayerStore.getState();
      expect(layers).toHaveLength(2);
      expect(layers[1].name).toBe('Background');
    });

    it('sets the new layer as active', () => {
      useLayerStore.getState().addLayer();
      const { layers, activeLayerId } = useLayerStore.getState();
      expect(activeLayerId).toBe(layers[1].id);
    });
  });

  describe('renameLayer', () => {
    it('renames a layer', () => {
      const { layers } = useLayerStore.getState();
      useLayerStore.getState().renameLayer(layers[0].id, 'Background');
      expect(useLayerStore.getState().layers[0].name).toBe('Background');
    });

    it('trims whitespace from name', () => {
      const { layers } = useLayerStore.getState();
      useLayerStore.getState().renameLayer(layers[0].id, '  Trimmed  ');
      expect(useLayerStore.getState().layers[0].name).toBe('Trimmed');
    });

    it('ignores empty rename', () => {
      const { layers } = useLayerStore.getState();
      useLayerStore.getState().renameLayer(layers[0].id, '   ');
      expect(useLayerStore.getState().layers[0].name).toBe('Layer 1');
    });
  });

  describe('deleteLayer', () => {
    it('deletes a layer when more than one exists', () => {
      useLayerStore.getState().addLayer();
      const { layers } = useLayerStore.getState();
      expect(layers).toHaveLength(2);

      const result = useLayerStore.getState().deleteLayer(layers[0].id);
      expect(result).toBe(true);
      expect(useLayerStore.getState().layers).toHaveLength(1);
    });

    it('prevents deleting the last layer', () => {
      const { layers } = useLayerStore.getState();
      const result = useLayerStore.getState().deleteLayer(layers[0].id);
      expect(result).toBe(false);
      expect(useLayerStore.getState().layers).toHaveLength(1);
    });

    it('selects adjacent layer when active layer is deleted', () => {
      useLayerStore.getState().addLayer('Second');
      useLayerStore.getState().addLayer('Third');
      const { layers } = useLayerStore.getState();
      // Active is Third (last added). Delete it.
      useLayerStore.getState().deleteLayer(layers[2].id);
      const state = useLayerStore.getState();
      expect(state.activeLayerId).toBe(layers[1].id);
    });

    it('returns false for non-existent layer', () => {
      const result = useLayerStore.getState().deleteLayer('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('setActiveLayer', () => {
    it('sets the active layer', () => {
      useLayerStore.getState().addLayer();
      const { layers } = useLayerStore.getState();
      useLayerStore.getState().setActiveLayer(layers[0].id);
      expect(useLayerStore.getState().activeLayerId).toBe(layers[0].id);
    });

    it('ignores invalid layer id', () => {
      const before = useLayerStore.getState().activeLayerId;
      useLayerStore.getState().setActiveLayer('invalid');
      expect(useLayerStore.getState().activeLayerId).toBe(before);
    });
  });

  describe('getLayer', () => {
    it('returns a layer by id', () => {
      const { layers } = useLayerStore.getState();
      const layer = useLayerStore.getState().getLayer(layers[0].id);
      expect(layer).toBeDefined();
      expect(layer?.name).toBe('Layer 1');
    });

    it('returns undefined for non-existent id', () => {
      expect(useLayerStore.getState().getLayer('nope')).toBeUndefined();
    });
  });
});
