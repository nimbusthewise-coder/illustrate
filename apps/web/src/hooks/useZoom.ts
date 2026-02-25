'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DEFAULT_ZOOM,
  incrementZoom as coreIncrementZoom,
  decrementZoom as coreDecrementZoom,
  resetZoom as coreResetZoom,
  applyWheelZoom,
  clampZoom,
  formatZoom,
} from '@illustrate.md/core';

export interface UseZoomOptions {
  /** Initial zoom level. Default: 1.0 */
  initialZoom?: number;
  /** Enable mouse wheel zoom. Default: true */
  enableWheel?: boolean;
  /** Mouse wheel sensitivity. Default: 0.001 */
  wheelSensitivity?: number;
  /** Minimum zoom level. Default: from core */
  minZoom?: number;
  /** Maximum zoom level. Default: from core */
  maxZoom?: number;
}

export interface UseZoomReturn {
  /** Current zoom level */
  zoom: number;
  /** Formatted zoom percentage (e.g., "150%") */
  zoomPercent: string;
  /** Zoom in by one step */
  zoomIn: () => void;
  /** Zoom out by one step */
  zoomOut: () => void;
  /** Reset zoom to 100% */
  resetZoom: () => void;
  /** Set zoom to specific value */
  setZoom: (zoom: number) => void;
  /** Ref to attach to zoomable container for wheel events */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Custom hook for managing zoom state and controls
 * F003: Zoom In/Out functionality
 * 
 * Provides zoom state management with keyboard shortcuts and mouse wheel support.
 * 
 * @example
 * ```tsx
 * const { zoom, zoomIn, zoomOut, resetZoom, containerRef } = useZoom();
 * 
 * return (
 *   <div ref={containerRef}>
 *     <div style={{ transform: `scale(${zoom})` }}>
 *       Content
 *     </div>
 *   </div>
 * );
 * ```
 */
export function useZoom(options: UseZoomOptions = {}): UseZoomReturn {
  const {
    initialZoom = DEFAULT_ZOOM,
    enableWheel = true,
    wheelSensitivity = 0.001,
  } = options;

  const [zoom, setZoomState] = useState(initialZoom);
  const containerRef = useRef<HTMLDivElement>(null);

  const setZoom = useCallback((newZoom: number) => {
    setZoomState(clampZoom(newZoom));
  }, []);

  const zoomIn = useCallback(() => {
    setZoomState((current) => coreIncrementZoom(current));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomState((current) => coreDecrementZoom(current));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomState(coreResetZoom());
  }, []);

  const zoomPercent = formatZoom(zoom);

  // Mouse wheel zoom support
  useEffect(() => {
    if (!enableWheel) return;

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl/Cmd is held (standard browser zoom convention)
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      
      setZoomState((current) => 
        applyWheelZoom(current, e.deltaY, wheelSensitivity)
      );
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [enableWheel, wheelSensitivity]);

  return {
    zoom,
    zoomPercent,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    containerRef,
  };
}
