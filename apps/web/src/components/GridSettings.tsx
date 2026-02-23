'use client';

import { useState } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useDocumentStore } from '@/stores/document-store';
import { useSession } from 'next-auth/react';

const GRID_CONSTRAINTS = {
  MIN: 1,
  MAX: 256,
} as const;

export function GridSettings() {
  const { data: session } = useSession();
  const { document, initializeDocument } = useCanvasStore();
  const { createNewDocument, isLoading } = useDocumentStore();
  const width = document?.width ?? 80;
  const height = document?.height ?? 24;
  
  const [widthInput, setWidthInput] = useState(width.toString());
  const [heightInput, setHeightInput] = useState(height.toString());
  const [title, setTitle] = useState('Untitled');

  const handleApply = () => {
    const newWidth = parseInt(widthInput, 10);
    const newHeight = parseInt(heightInput, 10);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      const clampedWidth = Math.max(GRID_CONSTRAINTS.MIN, Math.min(GRID_CONSTRAINTS.MAX, newWidth));
      const clampedHeight = Math.max(GRID_CONSTRAINTS.MIN, Math.min(GRID_CONSTRAINTS.MAX, newHeight));
      
      initializeDocument(clampedWidth, clampedHeight, document?.title);
      
      // Update inputs to reflect clamped values
      setWidthInput(clampedWidth.toString());
      setHeightInput(clampedHeight.toString());
    }
  };

  const handlePreset = (w: number, h: number) => {
    initializeDocument(w, h, document?.title);
    setWidthInput(w.toString());
    setHeightInput(h.toString());
  };

  const isValid = (value: string) => {
    const num = parseInt(value, 10);
    return (
      !isNaN(num) &&
      num >= GRID_CONSTRAINTS.MIN &&
      num <= GRID_CONSTRAINTS.MAX
    );
  };

  const widthValid = isValid(widthInput);
  const heightValid = isValid(heightInput);

  const handleCreateDocument = async () => {
    const newWidth = parseInt(widthInput, 10);
    const newHeight = parseInt(heightInput, 10);

    if (session?.user?.id) {
      // Create cloud-backed document
      await createNewDocument(session.user.id, title, newWidth, newHeight);
    } else {
      // Create local document (not persisted)
      initializeDocument(newWidth, newHeight, title);
    }
  };

  // If no document, show initialize button
  if (!document) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-4">New Canvas</h3>
        
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Width
              </label>
              <input
                type="number"
                min={GRID_CONSTRAINTS.MIN}
                max={GRID_CONSTRAINTS.MAX}
                value={widthInput}
                onChange={(e) => setWidthInput(e.target.value)}
                className={`w-full px-3 py-2 bg-background border rounded ${
                  isValid(widthInput) ? 'border-border' : 'border-error'
                } text-foreground`}
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Height
              </label>
              <input
                type="number"
                min={GRID_CONSTRAINTS.MIN}
                max={GRID_CONSTRAINTS.MAX}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className={`w-full px-3 py-2 bg-background border rounded ${
                  isValid(heightInput) ? 'border-border' : 'border-error'
                } text-foreground`}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateDocument}
          disabled={isLoading || !isValid(widthInput) || !isValid(heightInput)}
          className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : session?.user ? 'Create & Save' : 'Create Local Canvas'}
        </button>
        
        {!session?.user && (
          <p className="text-xs text-muted-foreground mt-2">
            Sign in to save your work to the cloud
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold mb-4">Grid Dimensions</h3>

      <div className="space-y-4">
        {/* Custom Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Width
            </label>
            <input
              type="number"
              min={GRID_CONSTRAINTS.MIN}
              max={GRID_CONSTRAINTS.MAX}
              value={widthInput}
              onChange={(e) => setWidthInput(e.target.value)}
              className={`w-full px-3 py-2 bg-background border rounded ${
                widthValid ? 'border-border' : 'border-error'
              } text-foreground`}
            />
            {!widthValid && (
              <p className="text-xs text-error mt-1">
                Must be {GRID_CONSTRAINTS.MIN}–{GRID_CONSTRAINTS.MAX}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Height
            </label>
            <input
              type="number"
              min={GRID_CONSTRAINTS.MIN}
              max={GRID_CONSTRAINTS.MAX}
              value={heightInput}
              onChange={(e) => setHeightInput(e.target.value)}
              className={`w-full px-3 py-2 bg-background border rounded ${
                heightValid ? 'border-border' : 'border-error'
              } text-foreground`}
            />
            {!heightValid && (
              <p className="text-xs text-error mt-1">
                Must be {GRID_CONSTRAINTS.MIN}–{GRID_CONSTRAINTS.MAX}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={!widthValid || !heightValid}
          className="w-full bg-accent text-accent-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>

        {/* Presets */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Presets:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handlePreset(80, 24)}
              className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:opacity-80"
            >
              80×24
            </button>
            <button
              onClick={() => handlePreset(120, 40)}
              className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:opacity-80"
            >
              120×40
            </button>
            <button
              onClick={() => handlePreset(160, 50)}
              className="px-3 py-1 text-sm bg-muted text-foreground rounded hover:opacity-80"
            >
              160×50
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground">
          <p>
            Current: {width} × {height} ({width * height} cells)
          </p>
          <p>
            Range: {GRID_CONSTRAINTS.MIN}×{GRID_CONSTRAINTS.MIN} to{' '}
            {GRID_CONSTRAINTS.MAX}×{GRID_CONSTRAINTS.MAX}
          </p>
        </div>
      </div>
    </div>
  );
}
