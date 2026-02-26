/**
 * Diagram Library Store — F048: Diagram Library
 *
 * Zustand store for managing saved diagrams with localStorage persistence.
 * Supports CRUD operations, search, filtering, tagging, and favorites.
 */

import { create } from 'zustand';
import {
  generateDiagramId,
  generateThumbnail,
  countNonEmptyCells,
  fuzzyMatch,
  extractUniqueTags,
} from '@/utils/diagramUtils';
import type { Layer } from '@/lib/types';
import {
  fetchUserDiagrams,
  saveDiagramToCloud,
  deleteDiagramFromCloud,
  syncDiagrams,
} from '@/lib/diagram-sync';

// ─── Types ───────────────────────────────────────────────────────────

export interface DiagramItem {
  id: string;
  name: string;
  description: string;
  tags: string[];
  width: number;
  height: number;
  layers: Layer[];
  thumbnail: string;
  isFavorite: boolean;
  isTemplate: boolean;
  templateCategory: string | null;
  version: number;
  parentId: string | null;
  cellCount: number;
  layerCount: number;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number | null;
  isPublic: boolean;
}

export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'lastOpenedAt';
export type SortOrder = 'asc' | 'desc';

export interface DiagramFilters {
  query: string;
  tags: string[];
  isFavorite: boolean | null;
  isTemplate: boolean | null;
  templateCategory: string | null;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface DiagramState {
  diagrams: DiagramItem[];
  filters: DiagramFilters;
  selectedDiagramId: string | null;
  isModalOpen: boolean;
  modalMode: 'view' | 'edit' | 'create';

  // CRUD operations
  saveDiagram: (params: {
    name: string;
    description?: string;
    tags?: string[];
    width: number;
    height: number;
    layers: Layer[];
  }) => DiagramItem;
  updateDiagram: (id: string, updates: Partial<Pick<DiagramItem, 'name' | 'description' | 'tags' | 'width' | 'height' | 'layers' | 'isFavorite'>>) => void;
  deleteDiagram: (id: string) => void;
  duplicateDiagram: (id: string) => DiagramItem | null;
  importDiagram: (item: Omit<DiagramItem, 'id' | 'createdAt' | 'updatedAt' | 'lastOpenedAt' | 'version'>) => DiagramItem;

  // Read operations
  getDiagram: (id: string) => DiagramItem | undefined;
  getFilteredDiagrams: () => DiagramItem[];
  getAllTags: () => string[];
  getStatistics: () => {
    totalDiagrams: number;
    totalTemplates: number;
    totalFavorites: number;
    uniqueTags: string[];
  };

  // Favorites
  toggleFavorite: (id: string) => void;

  // Public visibility
  setIsPublic: (id: string, isPublic: boolean) => void;

  // Filters
  setFilter: (updates: Partial<DiagramFilters>) => void;
  resetFilters: () => void;

  // Selection & Modal
  selectDiagram: (id: string | null) => void;
  openModal: (mode: 'view' | 'edit' | 'create', diagramId?: string) => void;
  closeModal: () => void;

  // Track open
  markOpened: (id: string) => void;

  // Persistence
  _loadFromStorage: () => void;
  _saveToStorage: () => void;

  // Cloud sync
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncWithCloud: () => Promise<void>;
  loadFromCloud: () => Promise<void>;
}

// ─── Defaults ────────────────────────────────────────────────────────

const DEFAULT_FILTERS: DiagramFilters = {
  query: '',
  tags: [],
  isFavorite: null,
  isTemplate: null,
  templateCategory: null,
  sortBy: 'updatedAt',
  sortOrder: 'desc',
};

const STORAGE_KEY = 'illustrate-diagram-library';

// ─── Helpers ─────────────────────────────────────────────────────────

function loadDiagramsFromStorage(): DiagramItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrate: ensure isPublic exists (defaults to false for old diagrams)
    return parsed.map((d: DiagramItem) => ({
      ...d,
      isPublic: d.isPublic ?? false,
    }));
  } catch {
    return [];
  }
}

function saveDiagramsToStorage(diagrams: DiagramItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
  } catch {
    // Storage full or unavailable
  }
}

function sortDiagrams(items: DiagramItem[], sortBy: SortField, sortOrder: SortOrder): DiagramItem[] {
  return [...items].sort((a, b) => {
    let aVal: string | number | null;
    let bVal: string | number | null;

    switch (sortBy) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'createdAt':
        aVal = a.createdAt;
        bVal = b.createdAt;
        break;
      case 'updatedAt':
        aVal = a.updatedAt;
        bVal = b.updatedAt;
        break;
      case 'lastOpenedAt':
        aVal = a.lastOpenedAt ?? 0;
        bVal = b.lastOpenedAt ?? 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

// ─── Store ───────────────────────────────────────────────────────────

export const useDiagramStore = create<DiagramState>()((set, get) => ({
  diagrams: [],
  filters: { ...DEFAULT_FILTERS },
  selectedDiagramId: null,
  isModalOpen: false,
  modalMode: 'view',
  isSyncing: false,
  lastSyncedAt: null,

  saveDiagram: ({ name, description = '', tags = [], width, height, layers }) => {
    const now = Date.now();
    const item: DiagramItem = {
      id: generateDiagramId(),
      name: name.trim() || 'Untitled Diagram',
      description: description.trim(),
      tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
      width,
      height,
      layers,
      thumbnail: generateThumbnail(layers),
      isFavorite: false,
      isTemplate: false,
      templateCategory: null,
      version: 1,
      parentId: null,
      cellCount: layers.reduce((sum, l) => sum + countNonEmptyCells(l.buffer.chars), 0),
      layerCount: layers.length,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
      isPublic: false,
    };

    set((state) => {
      const newDiagrams = [...state.diagrams, item];
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });

    // Sync to cloud (fire and forget)
    saveDiagramToCloud(item).catch(console.error);

    return item;
  },

  updateDiagram: (id, updates) => {
    let updatedDiagram: DiagramItem | null = null;
    
    set((state) => {
      const newDiagrams = state.diagrams.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...updates, updatedAt: Date.now() };
        if (updates.layers) {
          updated.thumbnail = generateThumbnail(updates.layers);
          updated.cellCount = updates.layers.reduce(
            (sum, l) => sum + countNonEmptyCells(l.buffer.chars),
            0
          );
          updated.layerCount = updates.layers.length;
          updated.version = d.version + 1;
        }
        if (updates.tags) {
          updated.tags = updates.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
        }
        if (updates.name !== undefined) {
          updated.name = updates.name.trim() || d.name;
        }
        updatedDiagram = updated;
        return updated;
      });
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });

    // Sync to cloud (fire and forget)
    if (updatedDiagram) {
      saveDiagramToCloud(updatedDiagram).catch(console.error);
    }
  },

  deleteDiagram: (id) => {
    set((state) => {
      const newDiagrams = state.diagrams.filter((d) => d.id !== id);
      saveDiagramsToStorage(newDiagrams);
      return {
        diagrams: newDiagrams,
        selectedDiagramId: state.selectedDiagramId === id ? null : state.selectedDiagramId,
      };
    });

    // Sync deletion to cloud (fire and forget)
    deleteDiagramFromCloud(id).catch(console.error);
  },

  duplicateDiagram: (id) => {
    const state = get();
    const original = state.diagrams.find((d) => d.id === id);
    if (!original) return null;

    const now = Date.now();
    const copy: DiagramItem = {
      ...original,
      id: generateDiagramId(),
      name: `${original.name} (Copy)`,
      parentId: original.id,
      isFavorite: false,
      isPublic: false, // Copies start private
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
      // Deep copy layers
      layers: JSON.parse(JSON.stringify(original.layers)),
    };

    set((state2) => {
      const newDiagrams = [...state2.diagrams, copy];
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });

    return copy;
  },

  importDiagram: (item) => {
    const now = Date.now();
    const newItem: DiagramItem = {
      ...item,
      id: generateDiagramId(),
      version: 1,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
    };

    set((state) => {
      const newDiagrams = [...state.diagrams, newItem];
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });

    return newItem;
  },

  getDiagram: (id) => {
    return get().diagrams.find((d) => d.id === id);
  },

  getFilteredDiagrams: () => {
    const state = get();
    const { query, tags, isFavorite, isTemplate, templateCategory, sortBy, sortOrder } = state.filters;

    let result = state.diagrams;

    // Text search
    if (query.trim()) {
      result = result.filter(
        (d) =>
          fuzzyMatch(d.name, query) ||
          fuzzyMatch(d.description, query) ||
          d.tags.some((t) => fuzzyMatch(t, query))
      );
    }

    // Tag filter
    if (tags.length > 0) {
      result = result.filter((d) =>
        tags.every((filterTag) => d.tags.includes(filterTag))
      );
    }

    // Favorite filter
    if (isFavorite !== null) {
      result = result.filter((d) => d.isFavorite === isFavorite);
    }

    // Template filter
    if (isTemplate !== null) {
      result = result.filter((d) => d.isTemplate === isTemplate);
    }

    // Template category
    if (templateCategory) {
      result = result.filter((d) => d.templateCategory === templateCategory);
    }

    return sortDiagrams(result, sortBy, sortOrder);
  },

  getAllTags: () => {
    return extractUniqueTags(get().diagrams);
  },

  getStatistics: () => {
    const diagrams = get().diagrams;
    return {
      totalDiagrams: diagrams.filter((d) => !d.isTemplate).length,
      totalTemplates: diagrams.filter((d) => d.isTemplate).length,
      totalFavorites: diagrams.filter((d) => d.isFavorite).length,
      uniqueTags: extractUniqueTags(diagrams),
    };
  },

  toggleFavorite: (id) => {
    set((state) => {
      const newDiagrams = state.diagrams.map((d) =>
        d.id === id ? { ...d, isFavorite: !d.isFavorite, updatedAt: Date.now() } : d
      );
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });
  },

  setIsPublic: (id, isPublic) => {
    set((state) => {
      const newDiagrams = state.diagrams.map((d) =>
        d.id === id ? { ...d, isPublic, updatedAt: Date.now() } : d
      );
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });
  },

  setFilter: (updates) => {
    set((state) => ({
      filters: { ...state.filters, ...updates },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } });
  },

  selectDiagram: (id) => {
    set({ selectedDiagramId: id });
  },

  openModal: (mode, diagramId) => {
    set({
      isModalOpen: true,
      modalMode: mode,
      selectedDiagramId: diagramId ?? null,
    });
  },

  closeModal: () => {
    set({ isModalOpen: false });
  },

  markOpened: (id) => {
    set((state) => {
      const newDiagrams = state.diagrams.map((d) =>
        d.id === id ? { ...d, lastOpenedAt: Date.now() } : d
      );
      saveDiagramsToStorage(newDiagrams);
      return { diagrams: newDiagrams };
    });
  },

  _loadFromStorage: () => {
    const diagrams = loadDiagramsFromStorage();
    set({ diagrams });
  },

  _saveToStorage: () => {
    saveDiagramsToStorage(get().diagrams);
  },

  // Cloud sync
  syncWithCloud: async () => {
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    try {
      const localDiagrams = get().diagrams;
      const merged = await syncDiagrams(localDiagrams);
      
      set({ 
        diagrams: merged, 
        lastSyncedAt: Date.now(),
        isSyncing: false,
      });
      
      // Also update localStorage
      saveDiagramsToStorage(merged);
    } catch (error) {
      console.error('Sync failed:', error);
      set({ isSyncing: false });
    }
  },

  loadFromCloud: async () => {
    if (get().isSyncing) return;
    
    set({ isSyncing: true });
    try {
      const cloudDiagrams = await fetchUserDiagrams();
      
      if (cloudDiagrams.length > 0) {
        set({ 
          diagrams: cloudDiagrams,
          lastSyncedAt: Date.now(),
          isSyncing: false,
        });
        saveDiagramsToStorage(cloudDiagrams);
      } else {
        set({ isSyncing: false });
      }
    } catch (error) {
      console.error('Load from cloud failed:', error);
      set({ isSyncing: false });
    }
  },
}));
