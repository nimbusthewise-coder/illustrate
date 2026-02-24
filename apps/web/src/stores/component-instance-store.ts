/**
 * Component Instance Store — F021: Place Components on Canvas
 *
 * Manages placed component instances on the canvas.
 * Each instance references a component definition and has its own position and slot overrides.
 */

import { create } from 'zustand';
import type { ComponentDefinition, CanvasElement } from '@/types/component';
import { denormalizeElementPositions } from '@/utils/componentUtils';

export interface PlacedComponentInstance {
  id: string;
  componentId: string; // Reference to component definition
  layerId: string; // Layer this instance is on
  x: number; // Grid column position
  y: number; // Grid row position
  slotValues: Record<string, string>; // Slot overrides
  selected: boolean;
}

interface ComponentInstanceState {
  instances: PlacedComponentInstance[];
  selectedInstanceId: string | null;

  // Instance operations
  placeComponent: (
    componentId: string,
    layerId: string,
    x: number,
    y: number,
  ) => string;
  removeInstance: (id: string) => void;
  moveInstance: (id: string, x: number, y: number) => void;
  updateSlotValue: (instanceId: string, slotId: string, value: string) => void;

  // Selection
  selectInstance: (id: string | null) => void;
  getInstance: (id: string) => PlacedComponentInstance | undefined;

  // Queries
  getInstancesOnLayer: (layerId: string) => PlacedComponentInstance[];
  getInstanceElements: (
    instance: PlacedComponentInstance,
    component: ComponentDefinition,
  ) => CanvasElement[];
}

let nextInstanceId = 1;

function generateInstanceId(): string {
  return `inst_${nextInstanceId++}`;
}

export const useComponentInstanceStore = create<ComponentInstanceState>()(
  (set, get) => ({
    instances: [],
    selectedInstanceId: null,

    placeComponent: (componentId, layerId, x, y) => {
      const id = generateInstanceId();
      const instance: PlacedComponentInstance = {
        id,
        componentId,
        layerId,
        x,
        y,
        slotValues: {},
        selected: false,
      };

      set((state) => ({
        instances: [...state.instances, instance],
        selectedInstanceId: id,
      }));

      return id;
    },

    removeInstance: (id) => {
      set((state) => ({
        instances: state.instances.filter((inst) => inst.id !== id),
        selectedInstanceId:
          state.selectedInstanceId === id ? null : state.selectedInstanceId,
      }));
    },

    moveInstance: (id, x, y) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === id ? { ...inst, x, y } : inst
        ),
      }));
    },

    updateSlotValue: (instanceId, slotId, value) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === instanceId
            ? {
                ...inst,
                slotValues: {
                  ...inst.slotValues,
                  [slotId]: value,
                },
              }
            : inst
        ),
      }));
    },

    selectInstance: (id) => {
      set({ selectedInstanceId: id });
    },

    getInstance: (id) => {
      return get().instances.find((inst) => inst.id === id);
    },

    getInstancesOnLayer: (layerId) => {
      return get().instances.filter((inst) => inst.layerId === layerId);
    },

    getInstanceElements: (instance, component) => {
      // Convert relative component elements to absolute positions
      return denormalizeElementPositions(
        component.elements,
        instance.x,
        instance.y,
      );
    },
  }),
);

/**
 * Reset store for testing
 */
export function resetComponentInstanceStore() {
  nextInstanceId = 1;
  useComponentInstanceStore.setState({
    instances: [],
    selectedInstanceId: null,
  });
}
