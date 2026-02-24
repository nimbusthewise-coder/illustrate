/**
 * Arrow Store — F013: Arrow / Connector Tool
 *
 * Global state management for arrows and connectors.
 */

import { create } from 'zustand';
import type { Arrow, ArrowStyle, Point } from '@/types/arrow';
import { calculateManhattanPath } from '@/utils/arrowRouting';

export interface ArrowState {
  /** All arrows in the current diagram */
  arrows: Arrow[];
  
  /** Currently selected arrow ID */
  selectedArrowId: string | null;
  
  /** Arrow being created (temporary state during drag) */
  activeArrow: {
    start: Point;
    current: Point;
    layerId: string;
  } | null;
  
  /** Default arrow style for new arrows */
  defaultStyle: ArrowStyle;
  
  // Actions
  
  /** Start creating a new arrow */
  startArrow: (start: Point, layerId: string) => void;
  
  /** Update the end point of the arrow being created */
  updateArrowEnd: (end: Point) => void;
  
  /** Finish creating the arrow and add it to the store */
  finishArrow: (gridWidth: number, gridHeight: number) => Arrow | null;
  
  /** Cancel arrow creation */
  cancelArrow: () => void;
  
  /** Add a completed arrow */
  addArrow: (arrow: Arrow) => void;
  
  /** Remove an arrow */
  removeArrow: (id: string) => void;
  
  /** Update an arrow */
  updateArrow: (id: string, updates: Partial<Arrow>) => void;
  
  /** Select an arrow */
  selectArrow: (id: string | null) => void;
  
  /** Get arrow by ID */
  getArrow: (id: string) => Arrow | undefined;
  
  /** Get arrows on a specific layer */
  getArrowsOnLayer: (layerId: string) => Arrow[];
  
  /** Update arrow style */
  updateArrowStyle: (id: string, style: Partial<ArrowStyle>) => void;
  
  /** Set default arrow style */
  setDefaultStyle: (style: Partial<ArrowStyle>) => void;
  
  /** Clear all arrows */
  clearArrows: () => void;
  
  /** Recalculate arrow path (used when endpoints move) */
  recalculateArrowPath: (
    id: string,
    gridWidth: number,
    gridHeight: number,
    newStart?: Point,
    newEnd?: Point
  ) => void;
}

let arrowIdCounter = 0;

function generateArrowId(): string {
  return `arrow_${Date.now()}_${arrowIdCounter++}`;
}

export const useArrowStore = create<ArrowState>((set, get) => ({
  arrows: [],
  selectedArrowId: null,
  activeArrow: null,
  defaultStyle: {
    arrowhead: true,
    bidirectional: false,
    lineStyle: 'light',
  },

  startArrow: (start, layerId) => {
    set({
      activeArrow: {
        start,
        current: start,
        layerId,
      },
    });
  },

  updateArrowEnd: (end) => {
    const { activeArrow } = get();
    if (!activeArrow) return;

    set({
      activeArrow: {
        ...activeArrow,
        current: end,
      },
    });
  },

  finishArrow: (gridWidth, gridHeight) => {
    const { activeArrow, defaultStyle } = get();
    if (!activeArrow) return null;

    const path = calculateManhattanPath(
      activeArrow.start,
      activeArrow.current,
      gridWidth,
      gridHeight
    );

    if (!path) {
      // Routing failed
      set({ activeArrow: null });
      return null;
    }

    const arrow: Arrow = {
      id: generateArrowId(),
      layerId: activeArrow.layerId,
      start: activeArrow.start,
      end: activeArrow.current,
      path,
      style: { ...defaultStyle },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      arrows: [...state.arrows, arrow],
      activeArrow: null,
      selectedArrowId: arrow.id,
    }));

    return arrow;
  },

  cancelArrow: () => {
    set({ activeArrow: null });
  },

  addArrow: (arrow) => {
    set((state) => ({
      arrows: [...state.arrows, arrow],
    }));
  },

  removeArrow: (id) => {
    set((state) => ({
      arrows: state.arrows.filter((a) => a.id !== id),
      selectedArrowId: state.selectedArrowId === id ? null : state.selectedArrowId,
    }));
  },

  updateArrow: (id, updates) => {
    set((state) => ({
      arrows: state.arrows.map((arrow) =>
        arrow.id === id
          ? { ...arrow, ...updates, updatedAt: Date.now() }
          : arrow
      ),
    }));
  },

  selectArrow: (id) => {
    set({ selectedArrowId: id });
  },

  getArrow: (id) => {
    return get().arrows.find((a) => a.id === id);
  },

  getArrowsOnLayer: (layerId) => {
    return get().arrows.filter((a) => a.layerId === layerId);
  },

  updateArrowStyle: (id, styleUpdates) => {
    set((state) => ({
      arrows: state.arrows.map((arrow) =>
        arrow.id === id
          ? {
              ...arrow,
              style: { ...arrow.style, ...styleUpdates },
              updatedAt: Date.now(),
            }
          : arrow
      ),
    }));
  },

  setDefaultStyle: (styleUpdates) => {
    set((state) => ({
      defaultStyle: { ...state.defaultStyle, ...styleUpdates },
    }));
  },

  clearArrows: () => {
    set({ arrows: [], selectedArrowId: null, activeArrow: null });
  },

  recalculateArrowPath: (id, gridWidth, gridHeight, newStart?, newEnd?) => {
    const arrow = get().getArrow(id);
    if (!arrow) return;

    const start = newStart || arrow.start;
    const end = newEnd || arrow.end;

    const newPath = calculateManhattanPath(start, end, gridWidth, gridHeight);
    if (newPath) {
      get().updateArrow(id, {
        start,
        end,
        path: newPath,
      });
    }
  },
}));
