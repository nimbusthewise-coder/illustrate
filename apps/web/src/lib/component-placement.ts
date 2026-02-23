/**
 * F020: Component Placement with Prop Overrides
 * 
 * Provides functions to place reusable components on the canvas
 * with prop override support. Works as a layer on top of the
 * base canvas store's placeComponent.
 */

import { PropOverrides, applyPropOverridesToBuffer } from '@/types/component-props';
import { useCanvasStore } from '@/stores/canvas-store';

interface ComponentTemplate {
  template: {
    chars: Uint16Array;
    fg: Uint32Array;
    bg: Uint32Array;
    width: number;
    height: number;
  };
  slots: Array<{
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    default: string;
  }>;
}

/**
 * Place a component on the canvas with optional prop overrides.
 * First places the base template, then applies slot text overrides.
 */
export function placeComponentWithOverrides(
  component: ComponentTemplate & { id: string; name: string; description: string; role: string; minWidth: number; minHeight: number; resizable: boolean; tags: string[] },
  col: number,
  row: number,
  layerId?: string,
  propOverrides?: PropOverrides
): void {
  const store = useCanvasStore.getState();
  
  // Place the base component template
  store.placeComponent(component as any, col, row, layerId);
  
  // Apply prop overrides to slots if provided
  if (propOverrides && component.slots.length > 0) {
    const { document, activeLayerId } = store;
    if (!document) return;
    
    const targetLayerId = layerId || activeLayerId;
    if (!targetLayerId) return;
    
    const layer = document.layers.find((l) => l.id === targetLayerId);
    if (!layer || layer.locked) return;
    
    applyPropOverridesToBuffer(
      layer.buffer,
      component.slots,
      propOverrides,
      col,
      row
    );
    
    // Trigger store update
    useCanvasStore.setState({
      document: {
        ...document,
        updatedAt: Date.now(),
      },
    });
  }
}
