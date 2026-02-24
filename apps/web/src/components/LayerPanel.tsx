'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useLayerStore } from '@/stores/layer-store';

/**
 * LayerPanel — F014: Create, Rename, Delete Layers
 *
 * Displays a list of layers with:
 * - New layer button
 * - Double-click to rename
 * - Delete with confirmation (at least one layer must exist)
 * - Click to select active layer
 */
export function LayerPanel() {
  const { layers, activeLayerId, addLayer, renameLayer, deleteLayer, setActiveLayer } =
    useLayerStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleDoubleClick = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
    setDeleteConfirmId(null);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId) {
      renameLayer(editingId, editValue);
      setEditingId(null);
      setEditValue('');
    }
  }, [editingId, editValue, renameLayer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        commitRename();
      } else if (e.key === 'Escape') {
        setEditingId(null);
        setEditValue('');
      }
    },
    [commitRename]
  );

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (layers.length <= 1) return;
      if (deleteConfirmId === id) {
        deleteLayer(id);
        setDeleteConfirmId(null);
      } else {
        setDeleteConfirmId(id);
      }
    },
    [deleteConfirmId, deleteLayer, layers.length]
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden" data-testid="layer-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
        <h3 className="text-sm font-semibold text-foreground">Layers</h3>
        <button
          onClick={() => addLayer()}
          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          title="New layer"
          data-testid="add-layer-btn"
        >
          + New
        </button>
      </div>

      {/* Layer list — rendered bottom-to-top (top layer first in list) */}
      <ul className="divide-y divide-border" data-testid="layer-list">
        {[...layers].reverse().map((layer) => {
          const isActive = layer.id === activeLayerId;
          const isEditing = editingId === layer.id;
          const isConfirmingDelete = deleteConfirmId === layer.id;

          return (
            <li
              key={layer.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-muted border-l-2 border-l-transparent'
              }`}
              onClick={() => setActiveLayer(layer.id)}
              data-testid={`layer-item-${layer.id}`}
            >
              {/* Layer name / rename input */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKeyDown}
                    className="w-full text-sm bg-background border border-border rounded px-1 py-0.5 text-foreground outline-none focus:ring-1 focus:ring-ring"
                    data-testid={`layer-rename-input-${layer.id}`}
                  />
                ) : (
                  <span
                    className="text-sm text-foreground truncate block"
                    onDoubleClick={() => handleDoubleClick(layer.id, layer.name)}
                    data-testid={`layer-name-${layer.id}`}
                  >
                    {layer.name}
                  </span>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(layer.id);
                }}
                disabled={layers.length <= 1}
                className={`text-xs px-1.5 py-0.5 rounded transition-colors shrink-0 ${
                  layers.length <= 1
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : isConfirmingDelete
                    ? 'bg-error text-white hover:bg-error/90'
                    : 'text-muted-foreground hover:text-error hover:bg-error/10'
                }`}
                title={
                  layers.length <= 1
                    ? 'Cannot delete the last layer'
                    : isConfirmingDelete
                    ? 'Click again to confirm delete'
                    : 'Delete layer'
                }
                data-testid={`layer-delete-btn-${layer.id}`}
              >
                {isConfirmingDelete ? 'Confirm?' : '✕'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
