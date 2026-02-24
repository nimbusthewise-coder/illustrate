/**
 * Component management state and operations using Zustand
 * Handles component library storage, CRUD operations, and persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ComponentDefinition,
  ComponentLibrary,
  CreateComponentOptions,
  UpdateComponentOptions,
} from '@/types/component';
import {
  createComponentDefinition,
  createEmptyLibrary,
  validateComponent,
  validateComponentName,
  serializeLibrary,
  deserializeLibrary,
} from '@/utils/componentUtils';

interface ComponentState {
  library: ComponentLibrary;
  selectedComponentId: string | null;
  
  // CRUD operations
  addComponent: (options: CreateComponentOptions) => { success: boolean; error?: string; componentId?: string };
  updateComponent: (id: string, options: UpdateComponentOptions) => { success: boolean; error?: string };
  deleteComponent: (id: string) => { success: boolean };
  getComponent: (id: string) => ComponentDefinition | undefined;
  
  // Selection
  selectComponent: (id: string | null) => void;
  
  // Library operations
  clearLibrary: () => void;
  importLibrary: (json: string) => { success: boolean; error?: string };
  exportLibrary: () => string;
  
  // Categories
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
}

export const useComponents = create<ComponentState>()(
  persist(
    (set, get) => ({
      library: createEmptyLibrary(),
      selectedComponentId: null,

      addComponent: (options) => {
        const state = get();
        
        // Validate name
        const existingNames = Object.values(state.library.components).map(
          (c) => c.name,
        );
        const nameValidation = validateComponentName(options.name, existingNames);
        
        if (!nameValidation.valid) {
          return {
            success: false,
            error: nameValidation.errors.join(', '),
          };
        }

        // Create component
        const component = createComponentDefinition(options);
        
        // Validate complete component
        const validation = validateComponent(component, state.library);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.errors.join(', '),
          };
        }

        // Add to library
        set((state) => ({
          library: {
            ...state.library,
            components: {
              ...state.library.components,
              [component.id]: component,
            },
          },
        }));

        // Add category if it doesn't exist
        if (component.category && !state.library.categories.includes(component.category)) {
          get().addCategory(component.category);
        }

        return {
          success: true,
          componentId: component.id,
        };
      },

      updateComponent: (id, options) => {
        const state = get();
        const component = state.library.components[id];
        
        if (!component) {
          return {
            success: false,
            error: 'Component not found',
          };
        }

        // Validate name if changing
        if (options.name) {
          const existingNames = Object.values(state.library.components)
            .filter((c) => c.id !== id)
            .map((c) => c.name);
          const nameValidation = validateComponentName(
            options.name,
            existingNames,
            component.name,
          );
          
          if (!nameValidation.valid) {
            return {
              success: false,
              error: nameValidation.errors.join(', '),
            };
          }
        }

        // Update component
        const updatedComponent: ComponentDefinition = {
          ...component,
          ...options,
          modified: Date.now(),
        };

        set((state) => ({
          library: {
            ...state.library,
            components: {
              ...state.library.components,
              [id]: updatedComponent,
            },
          },
        }));

        // Add new category if provided and doesn't exist
        if (options.category && !state.library.categories.includes(options.category)) {
          get().addCategory(options.category);
        }

        return { success: true };
      },

      deleteComponent: (id) => {
        const state = get();
        
        if (!state.library.components[id]) {
          return { success: false };
        }

        set((state) => {
          const { [id]: deleted, ...rest } = state.library.components;
          return {
            library: {
              ...state.library,
              components: rest,
            },
            selectedComponentId:
              state.selectedComponentId === id ? null : state.selectedComponentId,
          };
        });

        return { success: true };
      },

      getComponent: (id) => {
        return get().library.components[id];
      },

      selectComponent: (id) => {
        set({ selectedComponentId: id });
      },

      clearLibrary: () => {
        set({
          library: createEmptyLibrary(),
          selectedComponentId: null,
        });
      },

      importLibrary: (json) => {
        try {
          const imported = deserializeLibrary(json);
          set({ library: imported });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Import failed',
          };
        }
      },

      exportLibrary: () => {
        return serializeLibrary(get().library);
      },

      addCategory: (category) => {
        set((state) => ({
          library: {
            ...state.library,
            categories: [...state.library.categories, category].sort(),
          },
        }));
      },

      removeCategory: (category) => {
        set((state) => ({
          library: {
            ...state.library,
            categories: state.library.categories.filter((c) => c !== category),
          },
        }));
      },
    }),
    {
      name: 'component-library-storage',
      version: 1,
    },
  ),
);
