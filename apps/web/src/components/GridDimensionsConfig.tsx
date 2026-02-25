'use client';

import { useState, useCallback } from 'react';
import {
  useCanvasStore,
  GRID_MIN,
  GRID_MAX,
  clampGridDimension,
} from '@/stores/canvas-store';
import { useLayerStore } from '@/stores/layer-store';

/**
 * GridDimensionsConfig — lets the user set canvas width/height in characters.
 *
 * Inputs are validated on blur / Enter key. Values are clamped to [1, 256].
 */
export function GridDimensionsConfig() {
  const width = useCanvasStore((s) => s.width);
  const height = useCanvasStore((s) => s.height);
  const setDimensions = useCanvasStore((s) => s.setDimensions);

  const [draftWidth, setDraftWidth] = useState(String(width));
  const [draftHeight, setDraftHeight] = useState(String(height));

  const resizeAllLayers = useLayerStore((s) => s.resizeAllLayers);

  const commit = useCallback(() => {
    const w = parseInt(draftWidth, 10);
    const h = parseInt(draftHeight, 10);
    const newW = clampGridDimension(Number.isNaN(w) ? width : w);
    const newH = clampGridDimension(Number.isNaN(h) ? height : h);
    
    // Resize layer buffers first, then update canvas dimensions
    resizeAllLayers(newW, newH);
    setDimensions(newW, newH);
    
    // Reflect the clamped values back into the draft fields
    setDraftWidth(String(newW));
    setDraftHeight(String(newH));
  }, [draftWidth, draftHeight, width, height, setDimensions, resizeAllLayers]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit();
  };

  return (
    <div
      data-testid="grid-dimensions-config"
      className="flex items-center gap-2 text-sm"
    >
      <label className="text-muted-foreground" htmlFor="grid-width">
        W
      </label>
      <input
        id="grid-width"
        data-testid="grid-width-input"
        type="number"
        min={GRID_MIN}
        max={GRID_MAX}
        value={draftWidth}
        onChange={(e) => setDraftWidth(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-16 bg-muted border border-input rounded px-2 py-1 text-foreground text-center"
      />
      <span className="text-muted-foreground">×</span>
      <label className="text-muted-foreground" htmlFor="grid-height">
        H
      </label>
      <input
        id="grid-height"
        data-testid="grid-height-input"
        type="number"
        min={GRID_MIN}
        max={GRID_MAX}
        value={draftHeight}
        onChange={(e) => setDraftHeight(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-16 bg-muted border border-input rounded px-2 py-1 text-foreground text-center"
      />
      <span className="text-muted-foreground text-xs">
        ({width}×{height})
      </span>
    </div>
  );
}
