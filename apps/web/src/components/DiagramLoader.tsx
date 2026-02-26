'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDiagramStore, type DiagramItem } from '@/stores/diagram-store';
import { useLayerStore } from '@/stores/layer-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { loadDiagramFromCloud } from '@/lib/diagram-sync';

/**
 * Handles loading a diagram from URL query param `?load=<id>`
 * Place this component in the editor page to enable deep linking.
 * 
 * Tries localStorage first, then falls back to Supabase cloud.
 */
export function DiagramLoader() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get('load');
  const loadedRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const getDiagram = useDiagramStore((s) => s.getDiagram);
  const selectDiagram = useDiagramStore((s) => s.selectDiagram);
  const markOpened = useDiagramStore((s) => s.markOpened);
  const _loadFromStorage = useDiagramStore((s) => s._loadFromStorage);
  const importDiagram = useDiagramStore((s) => s.importDiagram);
  
  const layers = useLayerStore((s) => s.layers);
  const addLayer = useLayerStore((s) => s.addLayer);
  const deleteLayer = useLayerStore((s) => s.deleteLayer);
  
  const setDimensions = useCanvasStore((s) => s.setDimensions);

  useEffect(() => {
    // Ensure diagrams are loaded from storage
    _loadFromStorage();
  }, [_loadFromStorage]);

  useEffect(() => {
    if (!loadId || loadedRef.current === loadId || isLoading) return;
    
    const loadDiagram = async () => {
      // Try localStorage first
      let diagram = getDiagram(loadId);
      
      // If not in localStorage, try cloud
      if (!diagram) {
        setIsLoading(true);
        try {
          const cloudDiagram = await loadDiagramFromCloud(loadId);
          if (cloudDiagram) {
            // Import the cloud diagram to local storage
            diagram = importDiagram({
              ...cloudDiagram,
              // Keep the original ID from the URL
            });
            // Override the generated ID with the original
            diagram = { ...diagram, id: loadId };
          }
        } catch (error) {
          console.error('Failed to load diagram from cloud:', error);
        } finally {
          setIsLoading(false);
        }
      }
      
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
    };
    
    loadDiagram();
    
  }, [loadId, getDiagram, selectDiagram, markOpened, setDimensions, addLayer, deleteLayer, layers, isLoading, importDiagram]);

  return null;
}
