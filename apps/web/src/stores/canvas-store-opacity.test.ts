import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvas-store';

describe('Canvas Store - Layer Opacity and Composite Modes', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useCanvasStore.setState({
      document: null,
      activeLayerId: null,
      selection: null,
    });
  });

  describe('setLayerOpacity', () => {
    it('should set layer opacity within valid range', () => {
      const { initializeDocument, setLayerOpacity } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      // Set opacity to 50%
      setLayerOpacity(layerId, 50);

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(50);
    });

    it('should clamp opacity to 0-100 range', () => {
      const { initializeDocument, setLayerOpacity } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      // Test upper bound
      setLayerOpacity(layerId, 150);
      let updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(100);

      // Test lower bound
      setLayerOpacity(layerId, -50);
      updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(0);
    });

    it('should update document timestamp when opacity changes', () => {
      const { initializeDocument, setLayerOpacity } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;
      const originalTimestamp = document!.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        setLayerOpacity(layerId, 75);
        const updatedDoc = useCanvasStore.getState().document;
        expect(updatedDoc!.updatedAt).toBeGreaterThan(originalTimestamp);
      }, 10);
    });

    it('should not affect other layers when changing one layer opacity', () => {
      const { initializeDocument, addLayer, setLayerOpacity } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      addLayer(); // Add second layer
      
      const { document } = useCanvasStore.getState();
      const layer1Id = document!.layers[0].id;
      const layer2Id = document!.layers[1].id;

      // Set opacity only for first layer
      setLayerOpacity(layer1Id, 25);

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(25);
      expect(updatedDoc!.layers[1].opacity).toBe(100); // Should remain default
    });
  });

  describe('setLayerCompositeMode', () => {
    it('should set layer composite mode to normal', () => {
      const { initializeDocument, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      setLayerCompositeMode(layerId, 'normal');

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].compositeMode).toBe('normal');
    });

    it('should set layer composite mode to multiply', () => {
      const { initializeDocument, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      setLayerCompositeMode(layerId, 'multiply');

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].compositeMode).toBe('multiply');
    });

    it('should update document timestamp when composite mode changes', () => {
      const { initializeDocument, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;
      const originalTimestamp = document!.updatedAt;

      // Wait a tiny bit to ensure timestamp changes
      setTimeout(() => {
        setLayerCompositeMode(layerId, 'multiply');
        const updatedDoc = useCanvasStore.getState().document;
        expect(updatedDoc!.updatedAt).toBeGreaterThan(originalTimestamp);
      }, 10);
    });
  });

  describe('Layer creation defaults', () => {
    it('should create layers with default opacity of 100', () => {
      const { initializeDocument, addLayer } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const initialDoc = useCanvasStore.getState().document;
      expect(initialDoc!.layers[0].opacity).toBe(100);

      addLayer();
      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[1].opacity).toBe(100);
    });

    it('should create layers with default composite mode of normal', () => {
      const { initializeDocument, addLayer } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const initialDoc = useCanvasStore.getState().document;
      expect(initialDoc!.layers[0].compositeMode).toBe('normal');

      addLayer();
      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[1].compositeMode).toBe('normal');
    });
  });

  describe('Combined opacity and composite mode', () => {
    it('should allow setting both opacity and composite mode independently', () => {
      const { initializeDocument, setLayerOpacity, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      setLayerOpacity(layerId, 60);
      setLayerCompositeMode(layerId, 'multiply');

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(60);
      expect(updatedDoc!.layers[0].compositeMode).toBe('multiply');
    });

    it('should preserve opacity when changing composite mode', () => {
      const { initializeDocument, setLayerOpacity, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      setLayerOpacity(layerId, 45);
      setLayerCompositeMode(layerId, 'multiply');

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].opacity).toBe(45);
    });

    it('should preserve composite mode when changing opacity', () => {
      const { initializeDocument, setLayerOpacity, setLayerCompositeMode } = useCanvasStore.getState();
      
      initializeDocument(10, 10);
      const { document } = useCanvasStore.getState();
      const layerId = document!.layers[0].id;

      setLayerCompositeMode(layerId, 'multiply');
      setLayerOpacity(layerId, 30);

      const updatedDoc = useCanvasStore.getState().document;
      expect(updatedDoc!.layers[0].compositeMode).toBe('multiply');
    });
  });
});
