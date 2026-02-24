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

  describe('toggleLayerLock — F016', () => {
    it('toggles layer lock state', () => {
      const { layers } = useLayerStore.getState();
      const layerId = layers[0].id;
      
      // Default is unlocked
      expect(layers[0].locked).toBe(false);
      
      // Toggle to locked
      useLayerStore.getState().toggleLayerLock(layerId);
      expect(useLayerStore.getState().layers[0].locked).toBe(true);
      
      // Toggle back to unlocked
      useLayerStore.getState().toggleLayerLock(layerId);
      expect(useLayerStore.getState().layers[0].locked).toBe(false);
    });

    it('isLayerLocked returns correct status', () => {
      const { layers } = useLayerStore.getState();
      const layerId = layers[0].id;
      
      expect(useLayerStore.getState().isLayerLocked(layerId)).toBe(false);
      
      useLayerStore.getState().toggleLayerLock(layerId);
      expect(useLayerStore.getState().isLayerLocked(layerId)).toBe(true);
    });

    it('isLayerLocked returns false for non-existent layer', () => {
      expect(useLayerStore.getState().isLayerLocked('invalid')).toBe(false);
    });
  });

  describe('buffer operations with locked layers — F016', () => {
    it('prevents setCell on locked layer', () => {
      const { layers } = useLayerStore.getState();
      const layerId = layers[0].id;
      
      // Set a cell on unlocked layer
      useLayerStore.getState().setCell(layerId, 0, 0, 'X');
      expect(useLayerStore.getState().getCell(layerId, 0, 0)).toBe('X');
      
      // Lock the layer
      useLayerStore.getState().toggleLayerLock(layerId);
      
      // Try to set a cell on locked layer
      useLayerStore.getState().setCell(layerId, 0, 0, 'Y');
      
      // Cell should still be 'X'
      expect(useLayerStore.getState().getCell(layerId, 0, 0)).toBe('X');
    });

    it('prevents setCells on locked layer', () => {
      const { layers } = useLayerStore.getState();
      const layerId = layers[0].id;
      
      // Set cells on unlocked layer
      useLayerStore.getState().setCells(layerId, [
        { row: 0, col: 0, char: 'A' },
        { row: 0, col: 1, char: 'B' },
      ]);
      expect(useLayerStore.getState().getCell(layerId, 0, 0)).toBe('A');
      expect(useLayerStore.getState().getCell(layerId, 0, 1)).toBe('B');
      
      // Lock the layer
      useLayerStore.getState().toggleLayerLock(layerId);
      
      // Try to set cells on locked layer
      useLayerStore.getState().setCells(layerId, [
        { row: 0, col: 0, char: 'X' },
        { row: 0, col: 1, char: 'Y' },
      ]);
      
      // Cells should still be 'A' and 'B'
      expect(useLayerStore.getState().getCell(layerId, 0, 0)).toBe('A');
      expect(useLayerStore.getState().getCell(layerId, 0, 1)).toBe('B');
    });
  });
});
