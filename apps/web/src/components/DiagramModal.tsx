'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDiagramStore, type DiagramItem } from '@/stores/diagram-store';
import { exportAsAscii, exportAsSvg } from '@/utils/diagramUtils';

export function DiagramModal() {
  const {
    isModalOpen,
    modalMode,
    selectedDiagramId,
    getDiagram,
    updateDiagram,
    closeModal,
  } = useDiagramStore();

  const diagram = selectedDiagramId ? getDiagram(selectedDiagramId) : undefined;

  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [exportFormat, setExportFormat] = useState<'ascii' | 'svg'>('ascii');

  // Sync form state when diagram changes
  useEffect(() => {
    if (diagram) {
      setEditName(diagram.name);
      setEditDescription(diagram.description);
      setEditTags(diagram.tags.join(', '));
    }
  }, [diagram]);

  const handleSave = useCallback(() => {
    if (!diagram) return;
    updateDiagram(diagram.id, {
      name: editName,
      description: editDescription,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    closeModal();
  }, [diagram, editName, editDescription, editTags, updateDiagram, closeModal]);

  const handleExport = useCallback(() => {
    if (!diagram) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'svg') {
      content = exportAsSvg(exportAsAscii(diagram.layers));
      filename = `${diagram.name}.svg`;
      mimeType = 'image/svg+xml';
    } else {
      content = exportAsAscii(diagram.layers);
      filename = `${diagram.name}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagram, exportFormat]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    },
    [closeModal]
  );

  if (!isModalOpen || !diagram) return null;

  const isEditing = modalMode === 'edit';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30"
      onClick={closeModal}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? `Edit ${diagram.name}` : `View ${diagram.name}`}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Diagram' : diagram.name}
          </h2>
          <button
            onClick={closeModal}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Thumbnail */}
          <div className="bg-terminal rounded-lg p-4 overflow-auto max-h-64">
            <pre className="text-terminal-text text-xs leading-tight font-mono whitespace-pre">
              {diagram.thumbnail || '(empty diagram)'}
            </pre>
          </div>

          {isEditing ? (
            <>
              {/* Edit form */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
                  placeholder="Diagram name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm resize-y min-h-[60px] focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
                  placeholder="Description (optional)"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:border-ring focus:ring-ring/50 focus:ring-[3px]"
                  placeholder="e.g. flowchart, architecture, draft"
                />
              </div>
            </>
          ) : (
            <>
              {/* View mode details */}
              {diagram.description && (
                <p className="text-sm text-muted-foreground">{diagram.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Size: </span>
                  <span className="text-foreground">
                    {diagram.width} × {diagram.height}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Layers: </span>
                  <span className="text-foreground">{diagram.layerCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cells used: </span>
                  <span className="text-foreground">{diagram.cellCount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Version: </span>
                  <span className="text-foreground">{diagram.version}</span>
                </div>
              </div>

              {diagram.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {diagram.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Export section */}
              <div className="border-t border-border pt-3">
                <h3 className="text-sm font-medium text-foreground mb-2">Export</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'ascii' | 'svg')}
                    className="px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-sm"
                    aria-label="Export format"
                  >
                    <option value="ascii">Plain Text (.txt)</option>
                    <option value="svg">SVG Image (.svg)</option>
                  </select>
                  <button
                    onClick={handleExport}
                    className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
                  >
                    Download
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          {isEditing ? (
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm hover:bg-muted/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm hover:bg-muted/80"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
