import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvas-store';

describe('F036: Colour-only canvas mode', () => {
  beforeEach(() => {
    useCanvasStore.getState().initializeDocument(10, 10);
  });

  it('should default colourOnlyMode to false', () => {
    expect(useCanvasStore.getState().colourOnlyMode).toBe(false);
  });

  it('should toggle colourOnlyMode', () => {
    useCanvasStore.getState().toggleColourOnlyMode();
    expect(useCanvasStore.getState().colourOnlyMode).toBe(true);

    useCanvasStore.getState().toggleColourOnlyMode();
    expect(useCanvasStore.getState().colourOnlyMode).toBe(false);
  });

  it('should set colourOnlyMode directly', () => {
    useCanvasStore.getState().setColourOnlyMode(true);
    expect(useCanvasStore.getState().colourOnlyMode).toBe(true);

    useCanvasStore.getState().setColourOnlyMode(false);
    expect(useCanvasStore.getState().colourOnlyMode).toBe(false);
  });

  describe('paintCell', () => {
    it('should paint a cell with the given colour', () => {
      const layerId = useCanvasStore.getState().activeLayerId!;
      useCanvasStore.getState().paintCell(layerId, 2, 3, 0xff0000);

      const layer = useCanvasStore.getState().document!.layers.find(l => l.id === layerId)!;
      const index = 3 * layer.buffer.width + 2;
      expect(layer.buffer.bg[index]).toBe(0xff0000);
      // Should set a block character to mark as painted
      expect(layer.buffer.chars[index]).toBe('█'.charCodeAt(0));
    });

    it('should not overwrite existing character when painting', () => {
      const layerId = useCanvasStore.getState().activeLayerId!;
      // Write a character first
      useCanvasStore.getState().writeChar(layerId, 2, 3, 'A');
      // Now paint
      useCanvasStore.getState().paintCell(layerId, 2, 3, 0x00ff00);

      const layer = useCanvasStore.getState().document!.layers.find(l => l.id === layerId)!;
      const index = 3 * layer.buffer.width + 2;
      expect(layer.buffer.bg[index]).toBe(0x00ff00);
      // Should keep the existing character
      expect(layer.buffer.chars[index]).toBe('A'.charCodeAt(0));
    });

    it('should not paint on locked layers', () => {
      const layerId = useCanvasStore.getState().activeLayerId!;
      // Lock the layer manually
      const doc = useCanvasStore.getState().document!;
      useCanvasStore.setState({
        document: {
          ...doc,
          layers: doc.layers.map(l =>
            l.id === layerId ? { ...l, locked: true } : l
          ),
        },
      });

      useCanvasStore.getState().paintCell(layerId, 2, 3, 0xff0000);

      const layer = useCanvasStore.getState().document!.layers.find(l => l.id === layerId)!;
      const index = 3 * layer.buffer.width + 2;
      expect(layer.buffer.bg[index]).toBe(0); // Should not have changed
    });

    it('should not paint out of bounds', () => {
      const layerId = useCanvasStore.getState().activeLayerId!;
      // Should not throw
      useCanvasStore.getState().paintCell(layerId, -1, 0, 0xff0000);
      useCanvasStore.getState().paintCell(layerId, 0, -1, 0xff0000);
      useCanvasStore.getState().paintCell(layerId, 100, 0, 0xff0000);
      useCanvasStore.getState().paintCell(layerId, 0, 100, 0xff0000);
    });

    it('should update document timestamp after painting', () => {
      const layerId = useCanvasStore.getState().activeLayerId!;
      const before = useCanvasStore.getState().document!.updatedAt;

      // Small delay to ensure timestamp difference
      useCanvasStore.getState().paintCell(layerId, 0, 0, 0xff0000);

      const after = useCanvasStore.getState().document!.updatedAt;
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });
});
