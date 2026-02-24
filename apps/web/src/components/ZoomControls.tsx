'use client';

import { Plus, Minus, RotateCcw } from 'lucide-react';

export interface ZoomControlsProps {
  /** Current zoom percentage (e.g., "150%") */
  zoomPercent: string;
  /** Handler for zoom in button */
  onZoomIn: () => void;
  /** Handler for zoom out button */
  onZoomOut: () => void;
  /** Handler for reset zoom button */
  onResetZoom: () => void;
  /** Additional className for container */
  className?: string;
}

/**
 * ZoomControls — UI controls for zoom functionality
 * F003: Zoom In/Out
 * 
 * Displays zoom level and provides buttons for zoom in, zoom out, and reset.
 * Styled with Tinker Design System tokens.
 */
export function ZoomControls({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  className = '',
}: ZoomControlsProps) {
  return (
    <div
      className={`inline-flex items-center gap-1 bg-card border border-border rounded-lg p-1 ${className}`}
      data-testid="zoom-controls"
    >
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        className="p-1.5 hover:bg-muted rounded transition-colors"
        aria-label="Zoom out"
        title="Zoom out (Ctrl/Cmd + -)"
        data-testid="zoom-out-button"
      >
        <Minus className="w-4 h-4 text-foreground" />
      </button>

      {/* Zoom Level Display */}
      <button
        onClick={onResetZoom}
        className="px-3 py-1.5 min-w-[60px] text-sm font-mono text-foreground hover:bg-muted rounded transition-colors"
        aria-label="Reset zoom to 100%"
        title="Reset zoom (Ctrl/Cmd + 0)"
        data-testid="zoom-reset-button"
      >
        {zoomPercent}
      </button>

      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        className="p-1.5 hover:bg-muted rounded transition-colors"
        aria-label="Zoom in"
        title="Zoom in (Ctrl/Cmd + +)"
        data-testid="zoom-in-button"
      >
        <Plus className="w-4 h-4 text-foreground" />
      </button>

      {/* Reset Icon (alternative visual cue) */}
      <button
        onClick={onResetZoom}
        className="p-1.5 hover:bg-muted rounded transition-colors border-l border-border ml-1"
        aria-label="Reset zoom"
        title="Reset zoom (Ctrl/Cmd + 0)"
        data-testid="zoom-reset-icon-button"
      >
        <RotateCcw className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
