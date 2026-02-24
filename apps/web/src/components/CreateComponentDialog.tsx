/**
 * CreateComponentDialog - Dialog for creating a new component from canvas selection
 */

'use client';

import { useState } from 'react';
import { useComponents } from '@/hooks/useComponents';
import { CanvasElement } from '@/types/component';

interface CreateComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElements?: CanvasElement[];
}

export function CreateComponentDialog({
  isOpen,
  onClose,
  selectedElements = [],
}: CreateComponentDialogProps) {
  const { addComponent } = useComponents();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Please enter a component name');
      return;
    }

    if (selectedElements.length === 0) {
      setError('No elements selected. Select elements on the canvas first.');
      return;
    }

    const result = addComponent({
      name: name.trim(),
      description: description.trim(),
      elements: selectedElements,
      category: category.trim() || undefined,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    });

    if (result.success) {
      // Reset form and close
      setName('');
      setDescription('');
      setCategory('');
      setTags('');
      setError('');
      onClose();
    } else {
      setError(result.error || 'Failed to create component');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setCategory('');
    setTags('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Create Component
          </h2>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Selection info */}
          <div className="p-3 rounded-md bg-info/15 text-info text-sm">
            {selectedElements.length} element
            {selectedElements.length !== 1 ? 's' : ''} selected
          </div>

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
              placeholder="Button, Dialog, Icon..."
              autoFocus
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
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="What is this component for?"
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
              placeholder="UI, Diagrams, Icons..."
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
              placeholder="button, form, navigation..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-md bg-error/15 text-error text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create Component
          </button>
        </div>
      </div>
    </div>
  );
}
