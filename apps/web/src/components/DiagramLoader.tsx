'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDiagramStore } from '@/stores/diagram-store';
import { useLayerStore } from '@/stores/layer-store';
import { useCanvasStore } from '@/stores/canvas-store';

/**
 * Handles loading a diagram from URL query param `?load=<id>`
 * Place this component in the editor page to enable deep linking.
 */
export function DiagramLoader() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get('load');
  const loadedRef = useRef<string | null>(null);
  
  const getDiagram = useDiagramStore((s) => s.getDiagram);
  const selectDiagram = useDiagramStore((s) => s.selectDiagram);
  const markOpened = useDiagramStore((s) => s.markOpened);
  const _loadFromStorage = useDiagramStore((s) => s._loadFromStorage);
  
  const layers = useLayerStore((s) => s.layers);
  const addLayer = useLayerStore((s) => s.addLayer);
  const deleteLayer = useLayerStore((s) => s.deleteLayer);
  
  const setDimensions = useCanvasStore((s) => s.setDimensions);

  useEffect(() => {
    // Ensure diagrams are loaded from storage
    _loadFromStorage();
  }, [_loadFromStorage]);

  useEffect(() => {
    if (!loadId || loadedRef.current === loadId) return;
    
    const diagram = getDiagram(loadId);
    if (!diagram) {
      console.warn(`Diagram not found: ${loadId}`);
      return;
    }
    
    // Mark as loaded to prevent re-loading
    loadedRef.current = loadId;
    
    // Set canvas dimensions
    setDimensions(diagram.width, diagram.height);
    
    // Capture current layer IDs before adding new ones
    const originalLayerIds = layers?.map(l => l?.id).filter(Boolean) || [];
    
    // Add diagram layers first
    for (const layer of diagram.layers) {
      if (layer) {
        addLayer(layer.name, { ...layer });
      }
    }
    
    // Delete original layers after adding new ones
    for (const id of originalLayerIds) {
      if (id) {
        deleteLayer(id);
      }
    }
    
    // Select the diagram
    selectDiagram(loadId);
    markOpened(loadId);
    
  }, [loadId, getDiagram, selectDiagram, markOpened, setDimensions, addLayer, deleteLayer, layers]);

  return null;
}
