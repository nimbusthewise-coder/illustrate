/**
 * ComponentLibrary - Display and manage component library
 * Shows all defined components with search, filter, and CRUD operations
 * F021: Supports drag-and-drop to place components on canvas
 */

'use client';

import { useState, useMemo } from 'react';
import { useComponents } from '@/hooks/useComponents';
import { ComponentThumbnail } from './ComponentPreview';
import { searchComponents, filterByCategory, getAllTags } from '@/utils/componentUtils';

export function ComponentLibrary() {
  const {
    library,
    selectedComponentId,
    selectComponent,
    deleteComponent,
  } = useComponents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all components as array
  const allComponents = useMemo(
    () => Object.values(library.components),
    [library.components],
  );

  // Filter components based on search and filters
  const filteredComponents = useMemo(() => {
    let result = allComponents;

    // Apply search
    if (searchQuery.trim()) {
      result = searchComponents(library, searchQuery);
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Apply tag filter
    if (selectedTag) {
      result = result.filter((c) => c.tags?.includes(selectedTag));
    }

    // Sort by name
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [allComponents, searchQuery, selectedCategory, selectedTag, library]);

  const allTags = useMemo(() => getAllTags(library), [library]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      deleteComponent(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Component Library
        </h2>

        {/* Search */}
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {/* Filters */}
        <div className="mt-3 flex gap-2">
          {/* Category filter */}
          {library.categories.length > 0 && (
            <select
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(e.target.value || null)
              }
              className="flex-1 px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {library.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="flex-1 px-2 py-1 rounded border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Component Grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredComponents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {allComponents.length === 0
              ? 'No components yet. Create one from the canvas.'
              : 'No components match your filters.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredComponents.map((component) => (
              <div
                key={component.id}
                className="relative group cursor-move"
                draggable
                onDragStart={(e) => {
                  // Store component ID in drag data
                  e.dataTransfer.setData('componentId', component.id);
                  e.dataTransfer.effectAllowed = 'copy';
                  
                  // Create a drag image preview
                  const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
                  dragImage.style.opacity = '0.8';
                  document.body.appendChild(dragImage);
                  e.dataTransfer.setDragImage(dragImage, 0, 0);
                  setTimeout(() => document.body.removeChild(dragImage), 0);
                }}
              >
                <ComponentThumbnail
                  component={component}
                  onClick={() => selectComponent(component.id)}
                  selected={selectedComponentId === component.id}
                />
                
                {/* Drag indicator */}
                <div className="absolute top-1 left-1 w-6 h-6 rounded bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs text-primary">⋮⋮</span>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(component.id);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded bg-error/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-error"
                  title="Delete component"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="px-4 py-2 border-t border-border bg-muted/50">
        <div className="text-xs text-muted-foreground">
          {filteredComponents.length} of {allComponents.length} component
          {allComponents.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
