/**
 * F020: Component Library Store
 */
import { create } from 'zustand';
import { PropDefinition } from '@/types/component-props';

export interface SlotMapping {
  propName: string;
  slotName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  default: string;
}

export interface ReusableComponent {
  id: string;
  name: string;
  description: string;
  role: string;
  props: PropDefinition[];
  slotMappings: SlotMapping[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

function generateId(): string {
  return `rc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface ComponentLibraryState {
  components: ReusableComponent[];
  defineComponent: (name: string, description: string, role: string, props: PropDefinition[], slotMappings: SlotMapping[], tags?: string[]) => ReusableComponent;
  updateComponentDef: (id: string, updates: Partial<Omit<ReusableComponent, 'id' | 'createdAt'>>) => void;
  removeComponentDef: (id: string) => void;
  getComponentByName: (name: string) => ReusableComponent | undefined;
  getComponentsByRole: (role: string) => ReusableComponent[];
  getComponentsByTag: (tag: string) => ReusableComponent[];
}

export const useComponentLibraryStore = create<ComponentLibraryState>((set, get) => ({
  components: [],
  defineComponent: (name, description, role, props, slotMappings, tags = []) => {
    const component: ReusableComponent = { id: generateId(), name, description, role, props, slotMappings, tags, createdAt: Date.now(), updatedAt: Date.now() };
    set((state) => ({ components: [...state.components, component] }));
    return component;
  },
  updateComponentDef: (id, updates) => {
    set((state) => ({ components: state.components.map((c) => c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c) }));
  },
  removeComponentDef: (id) => {
    set((state) => ({ components: state.components.filter((c) => c.id !== id) }));
  },
  getComponentByName: (name) => get().components.find((c) => c.name === name),
  getComponentsByRole: (role) => get().components.filter((c) => c.role === role),
  getComponentsByTag: (tag) => get().components.filter((c) => c.tags.includes(tag)),
}));
