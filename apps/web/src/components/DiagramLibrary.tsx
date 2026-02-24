'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDiagramStore } from '@/stores/diagram-store';
import { DiagramCard } from '@/components/DiagramCard';
import { DiagramModal } from '@/components/DiagramModal';
import { DIAGRAM_TEMPLATES, type DiagramTemplate } from '@/utils/diagramUtils';
import { createBuffer } from '@/stores/layer-store';
import type { Layer } from '@/lib/types';

/**
 * Convert an ASCII template string to a Layer array for storage
 */
function templateToLayers(template: DiagramTemplate): Layer[] {
  const buffer = createBuffer(template.width, template.height);
  const lines = template.ascii.split('\n');

  for (let y = 0; y < lines.length && y < template.height; y++) {
    for (let x = 0; x < lines[y].length && x < template.width; x++) {
      const idx = y * template.width + x;
      buffer.chars[idx] = lines[y][x];
    }
  }

  return [
    {
      id: `layer-tmpl-${template.id}`,
      name: 'Layer 1',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer,
    },
  ];
}

type ViewMode = 'library' | 'templates';

export function DiagramLibrary() {
  const {
    filters,
    setFilter,
    resetFilters,
    getFilteredDiagrams,
    getAllTags,
    getStatistics,
    deleteDiagram,
    duplicateDiagram,
    toggleFavorite,
    saveDiagram,
    openModal,
    closeModal,
    markOpened,
    _loadFromStorage,
  } = useDiagramStore();

  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load persisted diagrams on mount
  useEffect(() => {
    _loadFromStorage();
  }, [_loadFromStorage]);

  const filteredDiagrams = getFilteredDiagrams();
  const allTags = getAllTags();
  const stats = getStatistics();

  const handleView = useCallback(
    (id: string) => {
      markOpened(id);
      openModal('view', id);
    },
    [markOpened, openModal]
  );

  const handleEdit = useCallback(
    (id: string) => {
      openModal('edit', id);
    },
    [openModal]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (confirmDeleteId === id) {
        deleteDiagram(id);
        setConfirmDeleteId(null);
      } else {
        setConfirmDeleteId(id);
        // Auto-reset confirmation after 3 seconds
        setTimeout(() => setConfirmDeleteId(null), 3000);
      }
    },
    [confirmDeleteId, deleteDiagram]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateDiagram(id);
    },
    [duplicateDiagram]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleUseTemplate = useCallback(
    (template: DiagramTemplate) => {
      const layers = templateToLayers(template);
      saveDiagram({
        name: template.name,
        description: template.description,
        tags: template.tags,
        width: template.width,
        height: template.height,
        layers,
      });
      setViewMode('library');
    },
    [saveDiagram]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      const currentTags = filters.tags;
      if (currentTags.includes(tag)) {
        setFilter({ tags: currentTags.filter((t) => t !== tag) });
      } else {
        setFilter({ tags: [...currentTags, tag] });
      }
    },
    [filters.tags, setFilter]
  );

  const handleExportAll = useCallback(() => {
    const diagrams = getFilteredDiagrams();
    const data = JSON.stringify(diagrams, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'illustrate-library.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [getFilteredDiagrams]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item.name && item.layers) {
            saveDiagram({
              name: item.name,
              description: item.description || '',
              tags: item.tags || [],
              width: item.width || 80,
              height: item.height || 24,
              layers: item.layers,
            });
          }
        }
      } catch {
        // Invalid file
      }
    };
    input.click();
  }, [saveDiagram]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Diagram Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.totalDiagrams} diagram{stats.totalDiagrams !== 1 ? 's' : ''}
            {stats.totalFavorites > 0 && ` · ${stats.totalFavorites} favorite${stats.totalFavorites !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleImport}
            className="px-3 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Import
          </button>
          <button
            onClick={handleExportAll}
            className="px-3 py-2 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Export All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'library'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setViewMode('library')}
        >
          My Diagrams
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            viewMode === 'templates'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setViewMode('templates')}
        >
          Templates
        </button>
      </div>

      {viewMode === 'library' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <input
              type="text"
              value={filters.query}
              onChange={(e) => setFilter({ query: e.target.value })}
              placeholder="Search diagrams..."
              className="flex-1 px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
              aria-label="Search diagrams"
            />

            {/* Sort */}
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-') as [
                  'name' | 'createdAt' | 'updatedAt' | 'lastOpenedAt',
                  'asc' | 'desc'
                ];
                setFilter({ sortBy, sortOrder });
              }}
              className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm"
              aria-label="Sort diagrams"
            >
              <option value="updatedAt-desc">Recently Modified</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="lastOpenedAt-desc">Recently Opened</option>
            </select>

            {/* Favorites filter */}
            <button
              onClick={() =>
                setFilter({ isFavorite: filters.isFavorite === true ? null : true })
              }
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                filters.isFavorite === true
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input text-muted-foreground hover:text-foreground'
              }`}
              aria-label="Toggle favorites filter"
              aria-pressed={filters.isFavorite === true}
            >
              ★ Favorites
            </button>

            {/* Reset */}
            {(filters.query || filters.tags.length > 0 || filters.isFavorite !== null) && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Tag bar */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Diagram grid */}
          {filteredDiagrams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDiagrams.map((diagram) => (
                <DiagramCard
                  key={diagram.id}
                  diagram={diagram}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-4">📐</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filters.query || filters.tags.length > 0
                  ? 'No diagrams match your filters'
                  : 'No diagrams yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filters.query || filters.tags.length > 0
                  ? 'Try adjusting your search or filters.'
                  : 'Save a diagram from the canvas or use a template to get started.'}
              </p>
              {!filters.query && filters.tags.length === 0 && (
                <button
                  onClick={() => setViewMode('templates')}
                  className="mt-4 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
                >
                  Browse Templates
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* Templates view */
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a template to create a new diagram.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIAGRAM_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
              >
                <div className="bg-terminal p-3 h-32 overflow-hidden">
                  <pre className="text-terminal-text text-[10px] leading-tight font-mono whitespace-pre overflow-hidden">
                    {template.ascii}
                  </pre>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <DiagramModal />
    </div>
  );
}
