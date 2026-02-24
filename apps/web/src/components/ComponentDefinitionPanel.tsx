/**
 * ComponentDefinitionPanel - UI for creating and editing component definitions
 * Allows users to define component metadata and properties
 */

'use client';

import { useState, useEffect } from 'react';
import { useComponents } from '@/hooks/useComponents';

export function ComponentDefinitionPanel() {
  const { selectedComponentId, getComponent, updateComponent } = useComponents();
  
  const selectedComponent = selectedComponentId
    ? getComponent(selectedComponentId)
    : null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  // Load component data when selection changes
  useEffect(() => {
    if (selectedComponent) {
      setName(selectedComponent.name);
      setDescription(selectedComponent.description);
      setCategory(selectedComponent.category || '');
      setTags(selectedComponent.tags?.join(', ') || '');
      setError('');
    } else {
      setName('');
      setDescription('');
      setCategory('');
      setTags('');
      setError('');
    }
  }, [selectedComponent]);

  const handleSave = () => {
    if (!selectedComponent) return;

    const result = updateComponent(selectedComponent.id, {
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    });

    if (result.success) {
      setError('');
    } else {
      setError(result.error || 'Failed to update component');
    }
  };

  const handleReset = () => {
    if (selectedComponent) {
      setName(selectedComponent.name);
      setDescription(selectedComponent.description);
      setCategory(selectedComponent.category || '');
      setTags(selectedComponent.tags?.join(', ') || '');
      setError('');
    }
  };

  if (!selectedComponent) {
    return (
      <div className="flex flex-col h-full bg-card border border-border rounded-lg p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Component Properties
        </h2>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a component to edit its properties
        </div>
      </div>
    );
  }

  const hasChanges =
    name !== selectedComponent.name ||
    description !== selectedComponent.description ||
    category !== (selectedComponent.category || '') ||
    tags !== (selectedComponent.tags?.join(', ') || '');

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Component Properties
        </h2>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Name <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Component name"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Describe what this component is for..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g., UI, Diagrams, Icons"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="button, form, navigation (comma-separated)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separate tags with commas
          </p>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Metadata</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">ID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded">
                {selectedComponent.id}
              </code>
            </div>
            <div>
              <span className="font-medium">Size:</span>{' '}
              {selectedComponent.boundingBox.width} ×{' '}
              {selectedComponent.boundingBox.height}
            </div>
            <div>
              <span className="font-medium">Elements:</span>{' '}
              {selectedComponent.elements.length}
            </div>
            <div>
              <span className="font-medium">Slots:</span>{' '}
              {selectedComponent.slots.length}
            </div>
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(selectedComponent.created).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Modified:</span>{' '}
              {new Date(selectedComponent.modified).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-md bg-error/15 text-error text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges || !name.trim()}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
