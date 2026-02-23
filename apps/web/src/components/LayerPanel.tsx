'use client';

import { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Layer } from '@/types/canvas';

export function LayerPanel() {
  const { 
    document, 
    activeLayerId, 
    addLayer, 
    renameLayer, 
    deleteLayer, 
    setActiveLayer, 
    toggleLayerVisibility,
    reorderLayer,
    moveLayerUp,
    moveLayerDown
  } = useCanvasStore();
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts for moving layers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when layer panel is focused and not editing
      if (editingLayerId || !activeLayerId || !document) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key === 'ArrowUp') {
        e.preventDefault();
        moveLayerUp(activeLayerId);
      } else if (isMod && e.key === 'ArrowDown') {
        e.preventDefault();
        moveLayerDown(activeLayerId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingLayerId, activeLayerId, document, moveLayerUp, moveLayerDown]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
    // Set a transparent drag image
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIndex(targetIndex);
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedLayerId && document) {
      reorderLayer(draggedLayerId, targetIndex);
    }
    
    setDraggedLayerId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDropTargetIndex(null);
  };

  if (!document) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-2">Layers</h3>
        <p className="text-sm text-muted-foreground">
          No canvas loaded. Initialize a canvas first.
        </p>
      </div>
    );
  }

  const handleStartRename = (layer: Layer) => {
    setEditingLayerId(layer.id);
    setEditingName(layer.name);
  };

  const handleSaveRename = () => {
    if (editingLayerId && editingName.trim()) {
      renameLayer(editingLayerId, editingName.trim());
    }
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingLayerId(null);
    setEditingName('');
  };

  const handleDeleteClick = (layerId: string) => {
    // Can't delete if it's the last layer
    if (document.layers.length <= 1) {
      return;
    }
    setDeleteConfirmId(layerId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      deleteLayer(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div ref={panelRef} className="bg-card border border-border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">Layers</h3>
        <button
          onClick={addLayer}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
          title="Add new layer"
        >
          + New Layer
        </button>
      </div>

      <div className="text-xs text-muted-foreground mb-2 px-1">
        Drag to reorder • Cmd/Ctrl + ↑/↓ to move
      </div>

      <div className="space-y-2">
        {/* Render layers in reverse order (top layers first in UI) */}
        {[...document.layers].reverse().map((layer, reversedIndex) => {
          const index = document.layers.length - 1 - reversedIndex;
          const isActive = layer.id === activeLayerId;
          const isDragging = draggedLayerId === layer.id;
          const isDropTarget = dropTargetIndex === index;
          
          return (
            <div
              key={layer.id}
              draggable={!editingLayerId}
              onDragStart={(e) => handleDragStart(e, layer.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`border rounded p-2 transition-all cursor-move ${
                isDragging
                  ? 'opacity-50 scale-95'
                  : isDropTarget
                  ? 'ring-2 ring-primary'
                  : ''
              } ${
                isActive
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted border-border hover:bg-accent'
              } ${
                !layer.visible ? 'opacity-50' : ''
              }`}
              onClick={() => !editingLayerId && setActiveLayer(layer.id)}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Drag handle */}
                <div className="w-6 h-6 flex items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing">
                  ⋮⋮
                </div>
                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.id);
                  }}
                  className={`w-6 h-6 flex items-center justify-center hover:bg-accent rounded transition-colors ${
                    layer.visible ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                  data-testid={`visibility-toggle-${layer.id}`}
                >
                  {layer.visible ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  )}
                </button>

                {editingLayerId === layer.id ? (
                  <div className="flex-1 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveRename();
                        } else if (e.key === 'Escape') {
                          handleCancelRename();
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                      onBlur={handleSaveRename}
                    />
                  </div>
                ) : (
                  <div
                    className="flex-1 cursor-pointer"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(layer);
                    }}
                    title="Click to select, double-click to rename"
                  >
                    <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {layer.name}
                      {layer.locked && ' 🔒'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {layer.buffer.width} × {layer.buffer.height}
                    </div>
                  </div>
                )}

                {editingLayerId !== layer.id && (
                  <div className="flex gap-1">
                    {/* Move layer up/down buttons */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerUp(layer.id);
                      }}
                      disabled={index === document.layers.length - 1}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        index === document.layers.length - 1
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-muted text-foreground hover:bg-accent'
                      }`}
                      title="Move layer up (Cmd/Ctrl + ↑)"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveLayerDown(layer.id);
                      }}
                      disabled={index === 0}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        index === 0
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-muted text-foreground hover:bg-accent'
                      }`}
                      title="Move layer down (Cmd/Ctrl + ↓)"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(layer.id);
                      }}
                      disabled={document.layers.length <= 1}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        document.layers.length <= 1
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                          : 'bg-destructive/15 text-destructive hover:bg-destructive/25'
                      }`}
                      title={
                        document.layers.length <= 1
                          ? 'Cannot delete the last layer'
                          : 'Delete layer'
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Layer visibility count */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        {document.layers.filter(l => l.visible).length} of {document.layers.length} layers visible
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-sm mx-4">
            <h4 className="font-semibold text-foreground mb-2">Delete Layer?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to delete this layer? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm bg-muted text-foreground rounded hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-destructive text-primary-foreground rounded hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
