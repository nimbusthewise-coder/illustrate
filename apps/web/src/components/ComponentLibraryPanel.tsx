'use client';

import { useState } from 'react';
import { useDesignSystemStore } from '@/stores/design-system-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { Component, ComponentRole } from '@/types/design-system';

const roleLabels: Record<ComponentRole, string> = {
  container: 'Container',
  navigation: 'Navigation',
  input: 'Input',
  display: 'Display',
  layout: 'Layout',
  feedback: 'Feedback',
};

export function ComponentLibraryPanel() {
  const { activeDesignSystem, addComponent, removeComponent } = useDesignSystemStore();
  const { selection, document, activeLayerId, clearSelection } = useCanvasStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [componentName, setComponentName] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentRole, setComponentRole] = useState<ComponentRole>('container');
  const [componentTags, setComponentTags] = useState('');

  const handleCreateFromSelection = () => {
    if (!selection || !document || !activeLayerId) {
      return;
    }

    const layer = document.layers.find((l) => l.id === activeLayerId);
    if (!layer) {
      return;
    }

    const { createComponentFromRegion } = useDesignSystemStore.getState();
    
    const component = createComponentFromRegion(
      componentName || 'New Component',
      componentDescription,
      componentRole,
      layer.buffer,
      selection.startCol,
      selection.startRow,
      selection.endCol,
      selection.endRow,
      [], // slots - can be added later
      componentTags.split(',').map((t) => t.trim()).filter(Boolean)
    );

    if (component) {
      addComponent(component);
      setShowCreateDialog(false);
      clearSelection();
      // Reset form
      setComponentName('');
      setComponentDescription('');
      setComponentRole('container');
      setComponentTags('');
    }
  };

  const handleDeleteComponent = (componentId: string) => {
    if (confirm('Are you sure you want to delete this component?')) {
      removeComponent(componentId);
    }
  };

  const renderComponentPreview = (component: Component) => {
    const { template } = component;
    const preview: string[] = [];
    
    // Render up to 5 lines for preview
    const maxLines = Math.min(5, template.height);
    for (let row = 0; row < maxLines; row++) {
      let line = '';
      for (let col = 0; col < template.width; col++) {
        const index = row * template.width + col;
        const charCode = template.chars[index];
        line += charCode ? String.fromCharCode(charCode) : ' ';
      }
      preview.push(line);
    }
    
    return preview.join('\n');
  };

  if (!activeDesignSystem) {
    return (
      <div className="h-full bg-muted/50 p-4 border-l border-border">
        <div className="text-center text-muted-foreground text-sm">
          <p>No active design system</p>
          <p className="mt-2 text-xs">Create a design system to start building components</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm text-foreground">Component Library</h2>
        <p className="text-xs text-muted-foreground mt-1">{activeDesignSystem.name}</p>
      </div>

      {/* Create from selection button */}
      {selection && (
        <div className="p-3 bg-accent/10 border-b border-border">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Component from Selection
          </button>
        </div>
      )}

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeDesignSystem.components.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            <p>No components yet</p>
            <p className="mt-2">Select a region on the canvas to create a component</p>
          </div>
        ) : (
          activeDesignSystem.components.map((component) => (
            <div
              key={component.id}
              className="p-3 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">
                    {component.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {roleLabels[component.role]}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteComponent(component.id)}
                  className="ml-2 text-muted-foreground hover:text-error text-xs p-1"
                  title="Delete component"
                >
                  ✕
                </button>
              </div>

              {component.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {component.description}
                </p>
              )}

              {/* Preview */}
              <div className="bg-muted/50 p-2 rounded font-mono text-[10px] leading-tight overflow-hidden whitespace-pre">
                {renderComponentPreview(component)}
              </div>

              {/* Metadata */}
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                  {component.minWidth}×{component.minHeight}
                </span>
                {component.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create component dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Create Component</h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                  placeholder="e.g. Button, Modal, Card"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={componentDescription}
                  onChange={(e) => setComponentDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground resize-none"
                  rows={2}
                  placeholder="Describe this component..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Role
                </label>
                <select
                  value={componentRole}
                  onChange={(e) => setComponentRole(e.target.value as ComponentRole)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={componentTags}
                  onChange={(e) => setComponentTags(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                  placeholder="button, primary, cta"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromSelection}
                disabled={!componentName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
