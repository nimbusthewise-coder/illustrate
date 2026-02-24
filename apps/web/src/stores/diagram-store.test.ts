/**
 * Tests for Diagram Library Store — F048
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDiagramStore } from './diagram-store';
import type { Layer } from '@/lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

function makeTestLayer(width = 10, height = 5): Layer {
  const size = width * height;
  return {
    id: 'test-layer-1',
    name: 'Test Layer',
    parentId: null,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    buffer: {
      width,
      height,
      chars: new Array(size).fill(' '),
      fg: new Array(size).fill('#ffffff'),
      bg: new Array(size).fill('transparent'),
      flags: new Array(size).fill(0),
    },
  };
}

function makeTestLayerWithContent(width = 10, height = 5, content = 'hello'): Layer {
  const layer = makeTestLayer(width, height);
  for (let i = 0; i < content.length && i < layer.buffer.chars.length; i++) {
    layer.buffer.chars[i] = content[i];
  }
  return layer;
}

describe('DiagramStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store state
    useDiagramStore.setState({
      diagrams: [],
      filters: {
        query: '',
        tags: [],
        isFavorite: null,
        isTemplate: null,
        templateCategory: null,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
      selectedDiagramId: null,
      isModalOpen: false,
      modalMode: 'view',
    });
  });

  describe('saveDiagram', () => {
    it('saves a new diagram with correct metadata', () => {
      const layers = [makeTestLayerWithContent()];
      const result = useDiagramStore.getState().saveDiagram({
        name: 'Test Diagram',
        description: 'A test',
        tags: ['test', 'draft'],
        width: 10,
        height: 5,
        layers,
      });

      expect(result.id).toMatch(/^diag-/);
      expect(result.name).toBe('Test Diagram');
      expect(result.description).toBe('A test');
      expect(result.tags).toEqual(['test', 'draft']);
      expect(result.width).toBe(10);
      expect(result.height).toBe(5);
      expect(result.layerCount).toBe(1);
      expect(result.isFavorite).toBe(false);
      expect(result.version).toBe(1);
      expect(result.createdAt).toBeGreaterThan(0);
      expect(result.updatedAt).toBe(result.createdAt);

      const diagrams = useDiagramStore.getState().diagrams;
      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].id).toBe(result.id);
    });

    it('trims and normalizes tags', () => {
      const layers = [makeTestLayer()];
      const result = useDiagramStore.getState().saveDiagram({
        name: 'Test',
        tags: [' Flow Chart ', 'DRAFT', ''],
        width: 10,
        height: 5,
        layers,
      });

      expect(result.tags).toEqual(['flow chart', 'draft']);
    });

    it('defaults name to "Untitled Diagram" when empty', () => {
      const layers = [makeTestLayer()];
      const result = useDiagramStore.getState().saveDiagram({
        name: '',
        width: 10,
        height: 5,
        layers,
      });

      expect(result.name).toBe('Untitled Diagram');
    });

    it('adds diagram to state', () => {
      const layers = [makeTestLayer()];
      useDiagramStore.getState().saveDiagram({
        name: 'Persisted',
        width: 10,
        height: 5,
        layers,
      });

      // Verify it's in the store
      const diagrams = useDiagramStore.getState().diagrams;
      expect(diagrams.some((d) => d.name === 'Persisted')).toBe(true);
    });
  });

  describe('updateDiagram', () => {
    it('updates name and description', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'Original',
        description: 'Original desc',
        width: 10,
        height: 5,
        layers,
      });

      useDiagramStore.getState().updateDiagram(saved.id, {
        name: 'Updated',
        description: 'Updated desc',
      });

      const updated = useDiagramStore.getState().getDiagram(saved.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.description).toBe('Updated desc');
      expect(updated!.updatedAt).toBeGreaterThanOrEqual(saved.updatedAt);
    });

    it('increments version when layers change', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'Versioned',
        width: 10,
        height: 5,
        layers,
      });

      expect(saved.version).toBe(1);

      const newLayers = [makeTestLayerWithContent(10, 5, 'updated')];
      useDiagramStore.getState().updateDiagram(saved.id, { layers: newLayers });

      const updated = useDiagramStore.getState().getDiagram(saved.id);
      expect(updated?.version).toBe(2);
    });
  });

  describe('deleteDiagram', () => {
    it('removes diagram from the store', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'ToDelete',
        width: 10,
        height: 5,
        layers,
      });

      expect(useDiagramStore.getState().diagrams).toHaveLength(1);

      useDiagramStore.getState().deleteDiagram(saved.id);

      expect(useDiagramStore.getState().diagrams).toHaveLength(0);
    });

    it('clears selectedDiagramId if deleted diagram was selected', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'Selected',
        width: 10,
        height: 5,
        layers,
      });

      useDiagramStore.setState({ selectedDiagramId: saved.id });
      useDiagramStore.getState().deleteDiagram(saved.id);

      expect(useDiagramStore.getState().selectedDiagramId).toBeNull();
    });
  });

  describe('duplicateDiagram', () => {
    it('creates a copy with "(Copy)" suffix', () => {
      const layers = [makeTestLayerWithContent()];
      const original = useDiagramStore.getState().saveDiagram({
        name: 'Original',
        description: 'Desc',
        tags: ['tag1'],
        width: 10,
        height: 5,
        layers,
      });

      const copy = useDiagramStore.getState().duplicateDiagram(original.id);
      expect(copy).not.toBeNull();
      expect(copy!.name).toBe('Original (Copy)');
      expect(copy!.description).toBe('Desc');
      expect(copy!.tags).toEqual(['tag1']);
      expect(copy!.parentId).toBe(original.id);
      expect(copy!.id).not.toBe(original.id);
      expect(copy!.isFavorite).toBe(false);

      expect(useDiagramStore.getState().diagrams).toHaveLength(2);
    });

    it('returns null for non-existent id', () => {
      const result = useDiagramStore.getState().duplicateDiagram('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('toggleFavorite', () => {
    it('toggles isFavorite on a diagram', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'Fav',
        width: 10,
        height: 5,
        layers,
      });

      expect(useDiagramStore.getState().getDiagram(saved.id)?.isFavorite).toBe(false);

      useDiagramStore.getState().toggleFavorite(saved.id);
      expect(useDiagramStore.getState().getDiagram(saved.id)?.isFavorite).toBe(true);

      useDiagramStore.getState().toggleFavorite(saved.id);
      expect(useDiagramStore.getState().getDiagram(saved.id)?.isFavorite).toBe(false);
    });
  });

  describe('getFilteredDiagrams', () => {
    beforeEach(() => {
      const layers = [makeTestLayer()];
      useDiagramStore.getState().saveDiagram({
        name: 'Alpha Flowchart',
        tags: ['flowchart', 'v1'],
        width: 10,
        height: 5,
        layers,
      });
      useDiagramStore.getState().saveDiagram({
        name: 'Beta Architecture',
        tags: ['architecture', 'v2'],
        width: 20,
        height: 10,
        layers,
      });
      useDiagramStore.getState().saveDiagram({
        name: 'Gamma Table',
        tags: ['table', 'v1'],
        width: 15,
        height: 8,
        layers,
      });
    });

    it('returns all diagrams with no filters', () => {
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result).toHaveLength(3);
    });

    it('filters by text query', () => {
      useDiagramStore.getState().setFilter({ query: 'flow' });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Flowchart');
    });

    it('filters by tag', () => {
      useDiagramStore.getState().setFilter({ tags: ['v1'] });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result).toHaveLength(2);
    });

    it('filters by multiple tags (AND)', () => {
      useDiagramStore.getState().setFilter({ tags: ['v1', 'flowchart'] });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alpha Flowchart');
    });

    it('filters favorites', () => {
      const diagrams = useDiagramStore.getState().diagrams;
      useDiagramStore.getState().toggleFavorite(diagrams[0].id);

      useDiagramStore.getState().setFilter({ isFavorite: true });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result).toHaveLength(1);
    });

    it('sorts by name ascending', () => {
      useDiagramStore.getState().setFilter({ sortBy: 'name', sortOrder: 'asc' });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result.map((d) => d.name)).toEqual([
        'Alpha Flowchart',
        'Beta Architecture',
        'Gamma Table',
      ]);
    });

    it('sorts by name descending', () => {
      useDiagramStore.getState().setFilter({ sortBy: 'name', sortOrder: 'desc' });
      const result = useDiagramStore.getState().getFilteredDiagrams();
      expect(result.map((d) => d.name)).toEqual([
        'Gamma Table',
        'Beta Architecture',
        'Alpha Flowchart',
      ]);
    });
  });

  describe('getAllTags', () => {
    it('returns unique sorted tags from all diagrams', () => {
      const layers = [makeTestLayer()];
      useDiagramStore.getState().saveDiagram({
        name: 'A',
        tags: ['beta', 'alpha'],
        width: 10,
        height: 5,
        layers,
      });
      useDiagramStore.getState().saveDiagram({
        name: 'B',
        tags: ['gamma', 'alpha'],
        width: 10,
        height: 5,
        layers,
      });

      expect(useDiagramStore.getState().getAllTags()).toEqual(['alpha', 'beta', 'gamma']);
    });
  });

  describe('getStatistics', () => {
    it('returns correct stats', () => {
      const layers = [makeTestLayer()];
      useDiagramStore.getState().saveDiagram({
        name: 'A',
        tags: ['tag1'],
        width: 10,
        height: 5,
        layers,
      });
      const b = useDiagramStore.getState().saveDiagram({
        name: 'B',
        tags: ['tag2'],
        width: 10,
        height: 5,
        layers,
      });
      useDiagramStore.getState().toggleFavorite(b.id);

      const stats = useDiagramStore.getState().getStatistics();
      expect(stats.totalDiagrams).toBe(2);
      expect(stats.totalFavorites).toBe(1);
      expect(stats.uniqueTags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('modal operations', () => {
    it('opens and closes modal', () => {
      useDiagramStore.getState().openModal('view', 'some-id');
      expect(useDiagramStore.getState().isModalOpen).toBe(true);
      expect(useDiagramStore.getState().modalMode).toBe('view');
      expect(useDiagramStore.getState().selectedDiagramId).toBe('some-id');

      useDiagramStore.getState().closeModal();
      expect(useDiagramStore.getState().isModalOpen).toBe(false);
    });

    it('opens in edit mode', () => {
      useDiagramStore.getState().openModal('edit', 'edit-id');
      expect(useDiagramStore.getState().modalMode).toBe('edit');
    });
  });

  describe('markOpened', () => {
    it('sets lastOpenedAt timestamp', () => {
      const layers = [makeTestLayer()];
      const saved = useDiagramStore.getState().saveDiagram({
        name: 'Opened',
        width: 10,
        height: 5,
        layers,
      });

      expect(useDiagramStore.getState().getDiagram(saved.id)?.lastOpenedAt).toBeNull();

      useDiagramStore.getState().markOpened(saved.id);

      const opened = useDiagramStore.getState().getDiagram(saved.id);
      expect(opened?.lastOpenedAt).toBeGreaterThan(0);
    });
  });

  describe('resetFilters', () => {
    it('resets all filters to defaults', () => {
      useDiagramStore.getState().setFilter({
        query: 'test',
        tags: ['tag1'],
        isFavorite: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      useDiagramStore.getState().resetFilters();

      const filters = useDiagramStore.getState().filters;
      expect(filters.query).toBe('');
      expect(filters.tags).toEqual([]);
      expect(filters.isFavorite).toBeNull();
      expect(filters.sortBy).toBe('updatedAt');
      expect(filters.sortOrder).toBe('desc');
    });
  });
});
