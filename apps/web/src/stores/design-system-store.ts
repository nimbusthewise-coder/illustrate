import { create } from 'zustand';
import { DesignSystem, Component, ComponentRole, Slot, createDesignSystem, generateComponentId } from '@/types/design-system';
import { Buffer, createBuffer } from '@/types/canvas';

interface DesignSystemState {
  // Current active design system
  activeDesignSystem: DesignSystem | null;
  
  // Available design systems
  designSystems: DesignSystem[];
  
  // Design system management
  createNewDesignSystem: (name: string, description?: string) => void;
  setActiveDesignSystem: (designSystemId: string) => void;
  deleteDesignSystem: (designSystemId: string) => void;
  updateDesignSystem: (designSystemId: string, updates: Partial<Omit<DesignSystem, 'id' | 'components' | 'createdAt'>>) => void;
  
  // Component management
  addComponent: (component: Omit<Component, 'id'>) => void;
  removeComponent: (componentId: string) => void;
  updateComponent: (componentId: string, updates: Partial<Omit<Component, 'id'>>) => void;
  
  // Create component from buffer region
  createComponentFromRegion: (
    name: string,
    description: string,
    role: ComponentRole,
    buffer: Buffer,
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    slots?: Slot[],
    tags?: string[]
  ) => Component | null;
}

export const useDesignSystemStore = create<DesignSystemState>((set, get) => ({
  activeDesignSystem: null,
  designSystems: [],

  createNewDesignSystem: (name: string, description = '') => {
    const newDesignSystem = createDesignSystem(name, description);
    set((state) => ({
      designSystems: [...state.designSystems, newDesignSystem],
      activeDesignSystem: newDesignSystem,
    }));
  },

  setActiveDesignSystem: (designSystemId: string) => {
    const { designSystems } = get();
    const designSystem = designSystems.find((ds) => ds.id === designSystemId);
    if (designSystem) {
      set({ activeDesignSystem: designSystem });
    }
  },

  deleteDesignSystem: (designSystemId: string) => {
    const { designSystems, activeDesignSystem } = get();
    const updatedSystems = designSystems.filter((ds) => ds.id !== designSystemId);
    
    // If deleting active design system, switch to first available or null
    const newActive = activeDesignSystem?.id === designSystemId
      ? updatedSystems[0] || null
      : activeDesignSystem;
    
    set({
      designSystems: updatedSystems,
      activeDesignSystem: newActive,
    });
  },

  updateDesignSystem: (designSystemId: string, updates: Partial<Omit<DesignSystem, 'id' | 'components' | 'createdAt'>>) => {
    set((state) => {
      const updatedSystems = state.designSystems.map((ds) =>
        ds.id === designSystemId
          ? { ...ds, ...updates, updatedAt: Date.now() }
          : ds
      );
      
      const activeUpdated = state.activeDesignSystem?.id === designSystemId
        ? { ...state.activeDesignSystem, ...updates, updatedAt: Date.now() }
        : state.activeDesignSystem;
      
      return {
        designSystems: updatedSystems,
        activeDesignSystem: activeUpdated,
      };
    });
  },

  addComponent: (componentData: Omit<Component, 'id'>) => {
    const { activeDesignSystem } = get();
    if (!activeDesignSystem) return;

    const newComponent: Component = {
      ...componentData,
      id: generateComponentId(),
    };

    set((state) => {
      const updatedDesignSystem = {
        ...activeDesignSystem,
        components: [...activeDesignSystem.components, newComponent],
        updatedAt: Date.now(),
      };

      return {
        activeDesignSystem: updatedDesignSystem,
        designSystems: state.designSystems.map((ds) =>
          ds.id === activeDesignSystem.id ? updatedDesignSystem : ds
        ),
      };
    });
  },

  removeComponent: (componentId: string) => {
    const { activeDesignSystem } = get();
    if (!activeDesignSystem) return;

    set((state) => {
      const updatedDesignSystem = {
        ...activeDesignSystem,
        components: activeDesignSystem.components.filter((c) => c.id !== componentId),
        updatedAt: Date.now(),
      };

      return {
        activeDesignSystem: updatedDesignSystem,
        designSystems: state.designSystems.map((ds) =>
          ds.id === activeDesignSystem.id ? updatedDesignSystem : ds
        ),
      };
    });
  },

  updateComponent: (componentId: string, updates: Partial<Omit<Component, 'id'>>) => {
    const { activeDesignSystem } = get();
    if (!activeDesignSystem) return;

    set((state) => {
      const updatedDesignSystem = {
        ...activeDesignSystem,
        components: activeDesignSystem.components.map((c) =>
          c.id === componentId ? { ...c, ...updates } : c
        ),
        updatedAt: Date.now(),
      };

      return {
        activeDesignSystem: updatedDesignSystem,
        designSystems: state.designSystems.map((ds) =>
          ds.id === activeDesignSystem.id ? updatedDesignSystem : ds
        ),
      };
    });
  },

  createComponentFromRegion: (
    name: string,
    description: string,
    role: ComponentRole,
    sourceBuffer: Buffer,
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    slots: Slot[] = [],
    tags: string[] = []
  ) => {
    // Normalize coordinates
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    const width = maxCol - minCol + 1;
    const height = maxRow - minRow + 1;

    // Validate minimum size
    if (width < 1 || height < 1) {
      return null;
    }

    // Create a new buffer for the component template
    const templateBuffer = createBuffer(width, height);

    // Copy the region from the source buffer to the template
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const sourceRow = minRow + row;
        const sourceCol = minCol + col;

        // Check source bounds
        if (
          sourceRow >= 0 &&
          sourceRow < sourceBuffer.height &&
          sourceCol >= 0 &&
          sourceCol < sourceBuffer.width
        ) {
          const sourceIndex = sourceRow * sourceBuffer.width + sourceCol;
          const destIndex = row * width + col;

          templateBuffer.chars[destIndex] = sourceBuffer.chars[sourceIndex];
          templateBuffer.fg[destIndex] = sourceBuffer.fg[sourceIndex];
          templateBuffer.bg[destIndex] = sourceBuffer.bg[sourceIndex];
          templateBuffer.flags[destIndex] = sourceBuffer.flags[sourceIndex];
        }
      }
    }

    const component: Component = {
      id: generateComponentId(),
      name,
      description,
      role,
      minWidth: width,
      minHeight: height,
      resizable: false, // Can be changed later via updateComponent
      template: templateBuffer,
      slots,
      tags,
    };

    return component;
  },
}));
