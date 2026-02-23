'use client';

import { useState } from 'react';
import { useDesignSystemStore } from '@/stores/design-system-store';

export function DesignSystemSelector() {
  const { designSystems, activeDesignSystem, setActiveDesignSystem, createNewDesignSystem, deleteDesignSystem } = useDesignSystemStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [newSystemDescription, setNewSystemDescription] = useState('');

  const handleCreate = () => {
    if (!newSystemName.trim()) return;
    
    createNewDesignSystem(newSystemName.trim(), newSystemDescription.trim());
    setShowCreateDialog(false);
    setNewSystemName('');
    setNewSystemDescription('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this design system? This cannot be undone.')) {
      deleteDesignSystem(id);
    }
  };

  return (
    <div className="p-4 border-b border-border bg-muted/30">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-foreground">Design System</label>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="text-xs text-primary hover:underline"
        >
          + New
        </button>
      </div>

      <select
        value={activeDesignSystem?.id || ''}
        onChange={(e) => setActiveDesignSystem(e.target.value)}
        className="w-full px-2 py-1.5 bg-background border border-input rounded text-sm text-foreground"
      >
        <option value="">No design system</option>
        {designSystems.map((ds) => (
          <option key={ds.id} value={ds.id}>
            {ds.name}
          </option>
        ))}
      </select>

      {activeDesignSystem && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {activeDesignSystem.components.length} component{activeDesignSystem.components.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={() => handleDelete(activeDesignSystem.id)}
            className="text-xs text-error hover:underline"
          >
            Delete
          </button>
        </div>
      )}

      {/* Create dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">New Design System</h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newSystemName}
                  onChange={(e) => setNewSystemName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground"
                  placeholder="e.g. mobile-app, dashboard, cli-ui"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={newSystemDescription}
                  onChange={(e) => setNewSystemDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-input rounded text-sm text-foreground resize-none"
                  rows={2}
                  placeholder="Describe your design system..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewSystemName('');
                  setNewSystemDescription('');
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newSystemName.trim()}
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
