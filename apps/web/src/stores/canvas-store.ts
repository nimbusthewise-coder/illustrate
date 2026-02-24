import { create } from 'zustand';

/** Grid dimension constraints */
export const GRID_MIN = 1;
export const GRID_MAX = 256;
export const GRID_DEFAULT_WIDTH = 80;
export const GRID_DEFAULT_HEIGHT = 24;

/** Clamp a value to the valid grid range [1, 256] */
export function clampGridDimension(value: number): number {
  const int = Math.round(value);
  if (!Number.isFinite(int)) return GRID_MIN;
  return Math.max(GRID_MIN, Math.min(GRID_MAX, int));
}

export interface CanvasState {
  width: number;
  height: number;
  /** Set grid width (clamped to 1–256) */
  setWidth: (width: number) => void;
  /** Set grid height (clamped to 1–256) */
  setHeight: (height: number) => void;
  /** Set both dimensions at once (clamped to 1–256) */
  setDimensions: (width: number, height: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  width: GRID_DEFAULT_WIDTH,
  height: GRID_DEFAULT_HEIGHT,
  setWidth: (width) => set({ width: clampGridDimension(width) }),
  setHeight: (height) => set({ height: clampGridDimension(height) }),
  setDimensions: (width, height) =>
    set({
      width: clampGridDimension(width),
      height: clampGridDimension(height),
    }),
}));
