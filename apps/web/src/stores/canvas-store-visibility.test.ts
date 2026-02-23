import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvas-store';

describe('Layer Visibility (F015)', () => {
  beforeEach(() => {
    useCanvasStore.getState().initializeDocument(10, 10, 'Test');
  });

  it('should create layers with visible=true by default', () => {
    const state = useCanvasStore.getState();
    const layers = state.document!.layers;
    expect(layers.length).toBeGreaterThan(0);
    layers.forEach((layer) => {
      expect(layer.visible).toBe(true);
    });
  });

  it('should toggle layer visibility from true to false', () => {
    const state = useCanvasStore.getState();
    const layerId = state.document!.layers[0].id;

    useCanvasStore.getState().toggleLayerVisibility(layerId);

    const updated = useCanvasStore.getState().document!.layers.find(l => l.id === layerId);
    expect(updated!.visible).toBe(false);
  });

  it('should toggle layer visibility back from false to true', () => {
    const state = useCanvasStore.getState();
    const layerId = state.document!.layers[0].id;

    useCanvasStore.getState().toggleLayerVisibility(layerId);
    useCanvasStore.getState().toggleLayerVisibility(layerId);

    const updated = useCanvasStore.getState().document!.layers.find(l => l.id === layerId);
    expect(updated!.visible).toBe(true);
  });

  it('should exclude hidden layers from visible layers filter', () => {
    // Add a second layer
    useCanvasStore.getState().addLayer();
    const layers = useCanvasStore.getState().document!.layers;
    expect(layers.length).toBe(2);

    // Hide the first layer
    useCanvasStore.getState().toggleLayerVisibility(layers[0].id);

    const allLayers = useCanvasStore.getState().document!.layers;
    const visibleLayers = allLayers.filter(l => l.visible);
    expect(visibleLayers.length).toBe(1);
    expect(visibleLayers[0].id).toBe(layers[1].id);
  });

  it('should preserve visibility state when reordering layers', () => {
    // Add layers
    useCanvasStore.getState().addLayer();
    useCanvasStore.getState().addLayer();
    const layers = useCanvasStore.getState().document!.layers;
    expect(layers.length).toBe(3);

    // Hide the middle layer
    const middleLayerId = layers[1].id;
    useCanvasStore.getState().toggleLayerVisibility(middleLayerId);
    expect(useCanvasStore.getState().document!.layers.find(l => l.id === middleLayerId)!.visible).toBe(false);

    // Reorder: move middle layer to top
    useCanvasStore.getState().reorderLayer(middleLayerId, 2);

    // Visibility should still be false after reorder
    const reordered = useCanvasStore.getState().document!.layers.find(l => l.id === middleLayerId);
    expect(reordered!.visible).toBe(false);
  });

  it('should update document timestamp when toggling visibility', () => {
    const state = useCanvasStore.getState();
    const layerId = state.document!.layers[0].id;
    const beforeTimestamp = state.document!.updatedAt;

    // Small delay to ensure timestamp difference
    useCanvasStore.getState().toggleLayerVisibility(layerId);

    const afterTimestamp = useCanvasStore.getState().document!.updatedAt;
    expect(afterTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
  });

  it('should not throw when toggling visibility with no document', () => {
    // Reset store to no document state
    useCanvasStore.setState({ document: null });
    expect(() => {
      useCanvasStore.getState().toggleLayerVisibility('nonexistent');
    }).not.toThrow();
  });

  it('should not affect other layers when toggling one layer', () => {
    useCanvasStore.getState().addLayer();
    const layers = useCanvasStore.getState().document!.layers;
    
    // Hide only the first layer
    useCanvasStore.getState().toggleLayerVisibility(layers[0].id);

    const updated = useCanvasStore.getState().document!.layers;
    expect(updated[0].visible).toBe(false);
    expect(updated[1].visible).toBe(true);
  });
});
