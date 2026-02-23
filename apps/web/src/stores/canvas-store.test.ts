import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvas-store';

describe('F001: Configurable Grid Dimensions', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCanvasStore.setState({ document: null });
  });

  it('should initialize canvas with specified dimensions', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80, 24);
    
    const state = useCanvasStore.getState();
    expect(state.document).toBeTruthy();
    expect(state.document?.width).toBe(80);
    expect(state.document?.height).toBe(24);
  });

  it('should clamp width to minimum 1', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(0, 24);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(1);
  });

  it('should clamp height to minimum 1', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80, 0);
    
    const state = useCanvasStore.getState();
    expect(state.document?.height).toBe(1);
  });

  it('should clamp width to maximum 256', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(300, 24);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(256);
  });

  it('should clamp height to maximum 256', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80, 300);
    
    const state = useCanvasStore.getState();
    expect(state.document?.height).toBe(256);
  });

  it('should accept preset 80×24', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80, 24);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(80);
    expect(state.document?.height).toBe(24);
  });

  it('should accept preset 120×40', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(120, 40);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(120);
    expect(state.document?.height).toBe(40);
  });

  it('should accept custom dimensions within range', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(100, 50);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(100);
    expect(state.document?.height).toBe(50);
  });

  it('should floor fractional dimensions', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80.7, 24.3);
    
    const state = useCanvasStore.getState();
    expect(state.document?.width).toBe(80);
    expect(state.document?.height).toBe(24);
  });

  it('should create a document with layers matching dimensions', () => {
    const store = useCanvasStore.getState();
    
    store.initializeDocument(80, 24);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    expect(layer).toBeTruthy();
    expect(layer?.buffer.width).toBe(80);
    expect(layer?.buffer.height).toBe(24);
  });
});

describe('F014: Create, Rename, Delete Layers', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCanvasStore.setState({ document: null });
    // Initialize a canvas with 80x24
    useCanvasStore.getState().initializeDocument(80, 24);
  });

  it('should create a new layer with addLayer', () => {
    const store = useCanvasStore.getState();
    const initialLayerCount = store.document?.layers.length || 0;
    
    store.addLayer();
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers.length).toBe(initialLayerCount + 1);
    expect(state.document?.layers[1]?.name).toBe('Layer 2');
  });

  it('should create multiple layers with sequential names', () => {
    const store = useCanvasStore.getState();
    
    store.addLayer();
    store.addLayer();
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers.length).toBe(3);
    expect(state.document?.layers[0]?.name).toBe('Layer 1');
    expect(state.document?.layers[1]?.name).toBe('Layer 2');
    expect(state.document?.layers[2]?.name).toBe('Layer 3');
  });

  it('should rename a layer', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (layerId) {
      store.renameLayer(layerId, 'Background');
    }
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[0]?.name).toBe('Background');
  });

  it('should delete a layer when more than one exists', () => {
    const store = useCanvasStore.getState();
    store.addLayer();
    
    // Get fresh state after adding layer
    const stateAfterAdd = useCanvasStore.getState();
    expect(stateAfterAdd.document?.layers.length).toBe(2); // Verify we have 2 layers
    
    const layerId = stateAfterAdd.document?.layers[1]?.id;
    if (layerId) {
      store.deleteLayer(layerId);
    }
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers.length).toBe(1);
  });

  it('should not delete the last layer', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (layerId) {
      store.deleteLayer(layerId);
    }
    
    const state = useCanvasStore.getState();
    // Should still have 1 layer
    expect(state.document?.layers.length).toBe(1);
  });

  it('should update the document updatedAt timestamp on layer operations', () => {
    const store = useCanvasStore.getState();
    const initialUpdatedAt = store.document?.updatedAt || 0;
    
    // Wait a tiny bit to ensure timestamp changes
    setTimeout(() => {
      store.addLayer();
      
      const state = useCanvasStore.getState();
      expect(state.document?.updatedAt).toBeGreaterThan(initialUpdatedAt);
    }, 10);
  });

  it('should create new layers with correct canvas dimensions', () => {
    const store = useCanvasStore.getState();
    
    store.addLayer();
    
    const state = useCanvasStore.getState();
    const newLayer = state.document?.layers[1];
    expect(newLayer?.buffer.width).toBe(80);
    expect(newLayer?.buffer.height).toBe(24);
  });
});

describe('F011: Eraser Tool', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCanvasStore.setState({ document: null, activeLayerId: null });
    // Initialize a canvas with 10x10 for easier testing
    useCanvasStore.getState().initializeDocument(10, 10);
  });

  it('should initialize with an active layer', () => {
    const state = useCanvasStore.getState();
    expect(state.activeLayerId).toBeTruthy();
    expect(state.document?.layers[0]?.id).toBe(state.activeLayerId);
  });

  it('should erase a single cell', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Set some data in a cell first
    const layer = store.document?.layers[0];
    if (layer) {
      const index = 5 * 10 + 5; // row 5, col 5
      layer.buffer.chars[index] = 65; // 'A'
      layer.buffer.fg[index] = 0xFFFFFFFF;
      layer.buffer.bg[index] = 0x000000FF;
      layer.buffer.flags[index] = 1;
    }
    
    // Erase the cell
    store.eraseCell(layerId, 5, 5);
    
    const state = useCanvasStore.getState();
    const erasedLayer = state.document?.layers[0];
    if (erasedLayer) {
      const index = 5 * 10 + 5;
      expect(erasedLayer.buffer.chars[index]).toBe(0);
      expect(erasedLayer.buffer.fg[index]).toBe(0);
      expect(erasedLayer.buffer.bg[index]).toBe(0);
      expect(erasedLayer.buffer.flags[index]).toBe(0);
    }
  });

  it('should erase with size 1 (1x1)', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Set data in a 3x3 area
    const layer = store.document?.layers[0];
    if (layer) {
      for (let row = 4; row <= 6; row++) {
        for (let col = 4; col <= 6; col++) {
          const index = row * 10 + col;
          layer.buffer.chars[index] = 65; // 'A'
        }
      }
    }
    
    // Erase center cell with size 1
    store.eraseCells(layerId, 5, 5, 1);
    
    const state = useCanvasStore.getState();
    const erasedLayer = state.document?.layers[0];
    if (erasedLayer) {
      // Center cell should be erased
      expect(erasedLayer.buffer.chars[5 * 10 + 5]).toBe(0);
      // Surrounding cells should still have data
      expect(erasedLayer.buffer.chars[4 * 10 + 4]).toBe(65);
      expect(erasedLayer.buffer.chars[4 * 10 + 5]).toBe(65);
      expect(erasedLayer.buffer.chars[5 * 10 + 4]).toBe(65);
    }
  });

  it('should erase with size 3 (3x3)', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Set data in a 5x5 area
    const layer = store.document?.layers[0];
    if (layer) {
      for (let row = 3; row <= 7; row++) {
        for (let col = 3; col <= 7; col++) {
          const index = row * 10 + col;
          layer.buffer.chars[index] = 65; // 'A'
        }
      }
    }
    
    // Erase center 3x3 area
    store.eraseCells(layerId, 5, 5, 3);
    
    const state = useCanvasStore.getState();
    const erasedLayer = state.document?.layers[0];
    if (erasedLayer) {
      // 3x3 area should be erased
      for (let row = 4; row <= 6; row++) {
        for (let col = 4; col <= 6; col++) {
          expect(erasedLayer.buffer.chars[row * 10 + col]).toBe(0);
        }
      }
      // Corners should still have data
      expect(erasedLayer.buffer.chars[3 * 10 + 3]).toBe(65);
      expect(erasedLayer.buffer.chars[3 * 10 + 7]).toBe(65);
      expect(erasedLayer.buffer.chars[7 * 10 + 3]).toBe(65);
      expect(erasedLayer.buffer.chars[7 * 10 + 7]).toBe(65);
    }
  });

  it('should respect locked layers', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Set data and lock the layer
    const layer = store.document?.layers[0];
    if (layer) {
      layer.locked = true;
      const index = 5 * 10 + 5;
      layer.buffer.chars[index] = 65; // 'A'
    }
    
    // Try to erase
    store.eraseCell(layerId, 5, 5);
    
    const state = useCanvasStore.getState();
    const lockedLayer = state.document?.layers[0];
    if (lockedLayer) {
      // Cell should still have data (not erased)
      expect(lockedLayer.buffer.chars[5 * 10 + 5]).toBe(65);
    }
  });

  it('should handle out of bounds gracefully', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Try to erase outside bounds
    expect(() => {
      store.eraseCell(layerId, -1, -1);
      store.eraseCell(layerId, 100, 100);
      store.eraseCells(layerId, -1, -1, 3);
      store.eraseCells(layerId, 100, 100, 3);
    }).not.toThrow();
  });

  it('should handle erasing near boundaries', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) {
      throw new Error('No layer found');
    }
    
    // Fill entire canvas
    const layer = store.document?.layers[0];
    if (layer) {
      for (let i = 0; i < layer.buffer.chars.length; i++) {
        layer.buffer.chars[i] = 65; // 'A'
      }
    }
    
    // Erase at corner with 3x3
    expect(() => {
      store.eraseCells(layerId, 0, 0, 3);
    }).not.toThrow();
    
    const state = useCanvasStore.getState();
    const erasedLayer = state.document?.layers[0];
    if (erasedLayer) {
      // Top-left 2x2 should be erased (as much as fits)
      expect(erasedLayer.buffer.chars[0 * 10 + 0]).toBe(0);
      expect(erasedLayer.buffer.chars[0 * 10 + 1]).toBe(0);
      expect(erasedLayer.buffer.chars[1 * 10 + 0]).toBe(0);
      expect(erasedLayer.buffer.chars[1 * 10 + 1]).toBe(0);
      // Other cells should still have data
      expect(erasedLayer.buffer.chars[2 * 10 + 2]).toBe(65);
    }
  });

  it('should switch active layer when current is deleted', () => {
    const store = useCanvasStore.getState();
    
    // Add a second layer
    store.addLayer();
    
    const state1 = useCanvasStore.getState();
    const firstLayerId = state1.document?.layers[0]?.id;
    const secondLayerId = state1.document?.layers[1]?.id;
    
    // Active layer should be the second one (just added)
    expect(state1.activeLayerId).toBe(secondLayerId);
    
    // Delete the active layer
    if (secondLayerId) {
      store.deleteLayer(secondLayerId);
    }
    
    const state2 = useCanvasStore.getState();
    // Active layer should switch to the first one
    expect(state2.activeLayerId).toBe(firstLayerId);
  });
});

describe('F007: Line Tool', () => {
  beforeEach(() => {
    useCanvasStore.setState({ document: null, activeLayerId: null });
    useCanvasStore.getState().initializeDocument(20, 20);
  });

  it('should draw a horizontal line using ─', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    store.drawLine(layerId, 2, 5, 7, 5);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    const expectedChar = '─'.charCodeAt(0);
    for (let col = 2; col <= 7; col++) {
      const index = 5 * 20 + col;
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should draw a vertical line using │', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    store.drawLine(layerId, 5, 2, 5, 7);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    const expectedChar = '│'.charCodeAt(0);
    for (let row = 2; row <= 7; row++) {
      const index = row * 20 + 5;
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should draw a diagonal line (down-right) using ╲', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    store.drawLine(layerId, 2, 2, 7, 7);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    const expectedChar = '╲'.charCodeAt(0);
    for (let i = 0; i <= 5; i++) {
      const index = (2 + i) * 20 + (2 + i);
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should draw a diagonal line (down-left) using ╱', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    store.drawLine(layerId, 7, 2, 2, 7);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    const expectedChar = '╱'.charCodeAt(0);
    for (let i = 0; i <= 5; i++) {
      const index = (2 + i) * 20 + (7 - i);
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should snap near-horizontal drags to horizontal', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    // dx=10, dy=2 → ratio > 1.5, should snap to horizontal
    store.drawLine(layerId, 0, 5, 10, 7);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    // Should have drawn horizontal at row 5
    const expectedChar = '─'.charCodeAt(0);
    for (let col = 0; col <= 10; col++) {
      const index = 5 * 20 + col;
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should snap near-vertical drags to vertical', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    // dx=2, dy=10 → ratio > 1.5, should snap to vertical
    store.drawLine(layerId, 5, 0, 7, 10);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    // Should have drawn vertical at col 5
    const expectedChar = '│'.charCodeAt(0);
    for (let row = 0; row <= 10; row++) {
      const index = row * 20 + 5;
      expect(layer.buffer.chars[index]).toBe(expectedChar);
    }
  });

  it('should draw a single point for zero-length line', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    store.drawLine(layerId, 5, 5, 5, 5);

    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    if (!layer) throw new Error('No layer');

    const index = 5 * 20 + 5;
    expect(layer.buffer.chars[index]).toBe('·'.charCodeAt(0));
  });

  it('should not draw on locked layers', () => {
    const store = useCanvasStore.getState();
    const layer = store.document?.layers[0];
    if (!layer) throw new Error('No layer found');

    layer.locked = true;
    store.drawLine(layer.id, 0, 0, 10, 0);

    const state = useCanvasStore.getState();
    const updatedLayer = state.document?.layers[0];
    if (!updatedLayer) throw new Error('No layer');

    // Should not have drawn anything
    for (let col = 0; col <= 10; col++) {
      expect(updatedLayer.buffer.chars[col]).toBe(0);
    }
  });

  it('should handle out of bounds gracefully', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    if (!layerId) throw new Error('No layer found');

    // Should not throw
    expect(() => {
      store.drawLine(layerId, -5, -5, 25, 25);
    }).not.toThrow();
  });
});

describe('F017: Reorder Layers', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCanvasStore.setState({ document: null });
    // Initialize a canvas with 80x24
    useCanvasStore.getState().initializeDocument(80, 24);
    // Add two more layers for testing
    useCanvasStore.getState().addLayer();
    useCanvasStore.getState().addLayer();
  });

  it('should have three layers after setup', () => {
    const state = useCanvasStore.getState();
    expect(state.document?.layers.length).toBe(3);
    expect(state.document?.layers[0]?.name).toBe('Layer 1');
    expect(state.document?.layers[1]?.name).toBe('Layer 2');
    expect(state.document?.layers[2]?.name).toBe('Layer 3');
  });

  it('should reorder layer to a new index', () => {
    const store = useCanvasStore.getState();
    const firstLayerId = store.document?.layers[0]?.id;
    
    if (!firstLayerId) {
      throw new Error('No layer found');
    }
    
    // Move first layer to index 2 (top)
    store.reorderLayer(firstLayerId, 2);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[2]?.id).toBe(firstLayerId);
    expect(state.document?.layers[2]?.name).toBe('Layer 1');
  });

  it('should move layer up in stack', () => {
    const store = useCanvasStore.getState();
    const firstLayerId = store.document?.layers[0]?.id;
    
    if (!firstLayerId) {
      throw new Error('No layer found');
    }
    
    // Move first layer up (from index 0 to index 1)
    store.moveLayerUp(firstLayerId);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[1]?.id).toBe(firstLayerId);
    expect(state.document?.layers[0]?.name).toBe('Layer 2');
    expect(state.document?.layers[1]?.name).toBe('Layer 1');
  });

  it('should move layer down in stack', () => {
    const store = useCanvasStore.getState();
    const thirdLayerId = store.document?.layers[2]?.id;
    
    if (!thirdLayerId) {
      throw new Error('No layer found');
    }
    
    // Move third layer down (from index 2 to index 1)
    store.moveLayerDown(thirdLayerId);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[1]?.id).toBe(thirdLayerId);
    expect(state.document?.layers[1]?.name).toBe('Layer 3');
    expect(state.document?.layers[2]?.name).toBe('Layer 2');
  });

  it('should not move top layer up further', () => {
    const store = useCanvasStore.getState();
    const topLayerId = store.document?.layers[2]?.id;
    
    if (!topLayerId) {
      throw new Error('No layer found');
    }
    
    // Try to move top layer up (should stay at index 2)
    store.moveLayerUp(topLayerId);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[2]?.id).toBe(topLayerId);
  });

  it('should not move bottom layer down further', () => {
    const store = useCanvasStore.getState();
    const bottomLayerId = store.document?.layers[0]?.id;
    
    if (!bottomLayerId) {
      throw new Error('No layer found');
    }
    
    // Try to move bottom layer down (should stay at index 0)
    store.moveLayerDown(bottomLayerId);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[0]?.id).toBe(bottomLayerId);
  });

  it('should clamp reorder index to valid range', () => {
    const store = useCanvasStore.getState();
    const middleLayerId = store.document?.layers[1]?.id;
    
    if (!middleLayerId) {
      throw new Error('No layer found');
    }
    
    // Try to move to invalid index (should clamp to max)
    store.reorderLayer(middleLayerId, 999);
    
    const state = useCanvasStore.getState();
    expect(state.document?.layers[2]?.id).toBe(middleLayerId);
  });

  it('should handle reordering to same index', () => {
    const store = useCanvasStore.getState();
    const initialLayers = store.document?.layers.map(l => l.id);
    const middleLayerId = store.document?.layers[1]?.id;
    
    if (!middleLayerId) {
      throw new Error('No layer found');
    }
    
    // Move to same index
    store.reorderLayer(middleLayerId, 1);
    
    const state = useCanvasStore.getState();
    const finalLayers = state.document?.layers.map(l => l.id);
    expect(finalLayers).toEqual(initialLayers);
  });

  it('should update document timestamp on reorder', () => {
    const store = useCanvasStore.getState();
    const initialUpdatedAt = store.document?.updatedAt || 0;
    const firstLayerId = store.document?.layers[0]?.id;
    
    if (!firstLayerId) {
      throw new Error('No layer found');
    }
    
    // Wait a bit to ensure timestamp changes
    setTimeout(() => {
      store.moveLayerUp(firstLayerId);
      
      const state = useCanvasStore.getState();
      expect(state.document?.updatedAt).toBeGreaterThan(initialUpdatedAt);
    }, 10);
  });

  it('should maintain layer data when reordering', () => {
    const store = useCanvasStore.getState();
    const firstLayer = store.document?.layers[0];
    
    if (!firstLayer) {
      throw new Error('No layer found');
    }
    
    // Set some data in the first layer
    firstLayer.buffer.chars[0] = 65; // 'A'
    firstLayer.buffer.fg[0] = 0xFF0000FF; // Red
    
    const firstLayerId = firstLayer.id;
    
    // Move layer to top
    store.reorderLayer(firstLayerId, 2);
    
    const state = useCanvasStore.getState();
    const movedLayer = state.document?.layers.find(l => l.id === firstLayerId);
    
    expect(movedLayer?.buffer.chars[0]).toBe(65);
    expect(movedLayer?.buffer.fg[0]).toBe(0xFF0000FF);
  });
});

describe('F006: Box Tool', () => {
  beforeEach(() => {
    useCanvasStore.setState({ document: null });
    const store = useCanvasStore.getState();
    store.initializeDocument(20, 20);
  });

  it('should draw a 2×2 box with box-drawing characters', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Draw a 2×2 box from (5,5) to (6,6)
    store.drawBox(layerId, 5, 5, 6, 6);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Check corners
    expect(String.fromCharCode(layer!.buffer.chars[5 * 20 + 5])).toBe('┌'); // top-left
    expect(String.fromCharCode(layer!.buffer.chars[5 * 20 + 6])).toBe('┐'); // top-right
    expect(String.fromCharCode(layer!.buffer.chars[6 * 20 + 5])).toBe('└'); // bottom-left
    expect(String.fromCharCode(layer!.buffer.chars[6 * 20 + 6])).toBe('┘'); // bottom-right
  });

  it('should draw a 5×3 box with borders', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Draw a box from (2,2) to (6,4)
    store.drawBox(layerId, 2, 2, 6, 4);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Check corners
    expect(String.fromCharCode(layer!.buffer.chars[2 * 20 + 2])).toBe('┌'); // top-left
    expect(String.fromCharCode(layer!.buffer.chars[2 * 20 + 6])).toBe('┐'); // top-right
    expect(String.fromCharCode(layer!.buffer.chars[4 * 20 + 2])).toBe('└'); // bottom-left
    expect(String.fromCharCode(layer!.buffer.chars[4 * 20 + 6])).toBe('┘'); // bottom-right
    
    // Check horizontal borders
    expect(String.fromCharCode(layer!.buffer.chars[2 * 20 + 3])).toBe('─');
    expect(String.fromCharCode(layer!.buffer.chars[2 * 20 + 4])).toBe('─');
    expect(String.fromCharCode(layer!.buffer.chars[2 * 20 + 5])).toBe('─');
    
    // Check vertical borders
    expect(String.fromCharCode(layer!.buffer.chars[3 * 20 + 2])).toBe('│');
    expect(String.fromCharCode(layer!.buffer.chars[3 * 20 + 6])).toBe('│');
  });

  it('should not draw box if less than 2×2', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Try to draw a 1×1 box
    store.drawBox(layerId, 5, 5, 5, 5);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Should be empty
    expect(layer!.buffer.chars[5 * 20 + 5]).toBe(0);
  });

  it('should not draw box if width is 1', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Try to draw a 1×5 box
    store.drawBox(layerId, 5, 5, 5, 9);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Should be empty
    expect(layer!.buffer.chars[5 * 20 + 5]).toBe(0);
    expect(layer!.buffer.chars[9 * 20 + 5]).toBe(0);
  });

  it('should handle reversed coordinates', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Draw box with reversed coordinates (from bottom-right to top-left)
    store.drawBox(layerId, 6, 6, 5, 5);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Should still draw correctly
    expect(String.fromCharCode(layer!.buffer.chars[5 * 20 + 5])).toBe('┌'); // top-left
    expect(String.fromCharCode(layer!.buffer.chars[5 * 20 + 6])).toBe('┐'); // top-right
    expect(String.fromCharCode(layer!.buffer.chars[6 * 20 + 5])).toBe('└'); // bottom-left
    expect(String.fromCharCode(layer!.buffer.chars[6 * 20 + 6])).toBe('┘'); // bottom-right
  });

  it('should respect layer bounds', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Try to draw a box that extends beyond bounds
    store.drawBox(layerId, 18, 18, 25, 25);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Should draw within bounds
    expect(String.fromCharCode(layer!.buffer.chars[18 * 20 + 18])).toBe('┌'); // top-left
    expect(String.fromCharCode(layer!.buffer.chars[18 * 20 + 19])).toBe('┐'); // top-right at edge
    expect(String.fromCharCode(layer!.buffer.chars[19 * 20 + 18])).toBe('└'); // bottom-left at edge
    expect(String.fromCharCode(layer!.buffer.chars[19 * 20 + 19])).toBe('┘'); // bottom-right at edge
  });

  it('should not draw on locked layer', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId || !store.document) throw new Error('No layer found');
    
    // Lock the layer
    store.document.layers[0].locked = true;
    
    // Try to draw a box
    store.drawBox(layerId, 5, 5, 8, 8);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Should be empty
    expect(layer!.buffer.chars[5 * 20 + 5]).toBe(0);
  });

  it('should update document timestamp', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    const initialTimestamp = store.document?.updatedAt || 0;
    
    if (!layerId) throw new Error('No layer found');
    
    // Wait a bit to ensure timestamp changes
    setTimeout(() => {
      store.drawBox(layerId, 5, 5, 8, 8);
      
      const state = useCanvasStore.getState();
      expect(state.document?.updatedAt).toBeGreaterThan(initialTimestamp);
    }, 10);
  });

  it('should not fill interior of box', () => {
    const store = useCanvasStore.getState();
    const layerId = store.document?.layers[0]?.id;
    
    if (!layerId) throw new Error('No layer found');
    
    // Draw a 5×5 box
    store.drawBox(layerId, 5, 5, 9, 9);
    
    const state = useCanvasStore.getState();
    const layer = state.document?.layers[0];
    
    // Check interior cells are empty
    expect(layer!.buffer.chars[6 * 20 + 6]).toBe(0);
    expect(layer!.buffer.chars[6 * 20 + 7]).toBe(0);
    expect(layer!.buffer.chars[7 * 20 + 6]).toBe(0);
  });
});
