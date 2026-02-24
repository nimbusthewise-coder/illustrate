/**
 * Integration tests for ASCII Export with Layer Store
 * 
 * Tests the full export flow from layer store to ASCII output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useLayerStore, resetLayerStore } from '@/stores/layer-store';
import { useCanvasStore } from '@/stores/canvas-store';

describe('Export Integration', () => {
  beforeEach(() => {
    // Set canvas dimensions FIRST, then reset layer store
    // so layers are created with the correct buffer size
    useCanvasStore.setState({ width: 10, height: 5 });
    resetLayerStore();
  });

  it('should export empty canvas', () => {
    const ascii = useLayerStore.getState().exportToAscii();
    const lines = ascii.split('\n');
    
    expect(lines).toHaveLength(5); // height = 5
    expect(lines.every((line) => line === '')).toBe(true);
  });

  it('should export single layer with content', () => {
    const store = useLayerStore.getState();
    const layer = store.layers[0];
    
    // Draw "Hello" in the first row
    store.setCell(layer.id, 0, 0, 'H');
    store.setCell(layer.id, 0, 1, 'e');
    store.setCell(layer.id, 0, 2, 'l');
    store.setCell(layer.id, 0, 3, 'l');
    store.setCell(layer.id, 0, 4, 'o');
    
    const ascii = store.exportToAscii();
    const lines = ascii.split('\n');
    
    expect(lines[0]).toBe('Hello');
    expect(lines[1]).toBe('');
  });

  it('should export multiple layers composited', () => {
    const layer1Id = useLayerStore.getState().layers[0].id;
    
    // Layer 1: "AAA" in row 0
    useLayerStore.getState().setCell(layer1Id, 0, 0, 'A');
    useLayerStore.getState().setCell(layer1Id, 0, 1, 'A');
    useLayerStore.getState().setCell(layer1Id, 0, 2, 'A');
    
    // Add second layer
    useLayerStore.getState().addLayer('Layer 2');
    
    // Get layer2 id
    const layer2Id = useLayerStore.getState().layers[1].id;
    
    // Layer 2: "BB" in row 1
    useLayerStore.getState().setCell(layer2Id, 1, 0, 'B');
    useLayerStore.getState().setCell(layer2Id, 1, 1, 'B');
    
    const ascii = useLayerStore.getState().exportToAscii();
    const lines = ascii.split('\n');
    
    expect(lines[0]).toBe('AAA');
    expect(lines[1]).toBe('BB');
  });

  it('should respect layer visibility', () => {
    let store = useLayerStore.getState();
    const layer1 = store.layers[0];
    
    // Add second layer
    store.addLayer('Layer 2');
    
    // Get fresh state to access layer2
    store = useLayerStore.getState();
    const layer2 = store.layers[1];
    
    // Layer 1: "AAA"
    store.setCell(layer1.id, 0, 0, 'A');
    store.setCell(layer1.id, 0, 1, 'A');
    store.setCell(layer1.id, 0, 2, 'A');
    
    // Layer 2: "BBB" (overlapping)
    store.setCell(layer2.id, 0, 0, 'B');
    store.setCell(layer2.id, 0, 1, 'B');
    store.setCell(layer2.id, 0, 2, 'B');
    
    // With both visible, layer 2 should be on top
    let ascii = store.exportToAscii();
    expect(ascii.split('\n')[0]).toBe('BBB');
    
    // Hide layer 2
    store.toggleLayerVisibility(layer2.id);
    ascii = store.exportToAscii();
    expect(ascii.split('\n')[0]).toBe('AAA');
  });

  it('should trim trailing whitespace per row', () => {
    const store = useLayerStore.getState();
    const layer = store.layers[0];
    
    // Put "X" at column 2, leaving trailing spaces
    store.setCell(layer.id, 0, 2, 'X');
    
    const ascii = store.exportToAscii();
    const lines = ascii.split('\n');
    
    // Should be "  X" (2 spaces + X), not "  X       " (with trailing spaces)
    expect(lines[0]).toBe('  X');
    expect(lines[0]).toHaveLength(3);
  });

  it('should draw box using multiple cells', () => {
    const store = useLayerStore.getState();
    const layer = store.layers[0];
    
    // Draw 3×3 box
    //   ┌─┐
    //   │ │
    //   └─┘
    const cells = [
      { row: 0, col: 0, char: '┌' },
      { row: 0, col: 1, char: '─' },
      { row: 0, col: 2, char: '┐' },
      { row: 1, col: 0, char: '│' },
      { row: 1, col: 1, char: ' ' },
      { row: 1, col: 2, char: '│' },
      { row: 2, col: 0, char: '└' },
      { row: 2, col: 1, char: '─' },
      { row: 2, col: 2, char: '┘' },
    ];
    
    store.setCells(layer.id, cells);
    
    const ascii = store.exportToAscii();
    const lines = ascii.split('\n');
    
    expect(lines[0]).toBe('┌─┐');
    expect(lines[1]).toBe('│ │');
    expect(lines[2]).toBe('└─┘');
  });

  it('should handle canvas resize', () => {
    // Start with 10×5 canvas
    const store = useLayerStore.getState();
    const layer = store.layers[0];
    
    store.setCell(layer.id, 0, 0, 'A');
    
    // Resize canvas to 5×3
    useCanvasStore.setState({ width: 5, height: 3 });
    
    const ascii = store.exportToAscii();
    const lines = ascii.split('\n');
    
    // Should export using new canvas dimensions
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('A');
  });
});
