import { describe, it, expect, beforeEach } from 'vitest';
import {
  useCanvasStore,
  clampGridDimension,
  GRID_MIN,
  GRID_MAX,
  GRID_DEFAULT_WIDTH,
  GRID_DEFAULT_HEIGHT,
} from './canvas-store';

describe('clampGridDimension', () => {
  it('returns the value when within range', () => {
    expect(clampGridDimension(80)).toBe(80);
    expect(clampGridDimension(1)).toBe(1);
    expect(clampGridDimension(256)).toBe(256);
  });

  it('clamps below minimum to 1', () => {
    expect(clampGridDimension(0)).toBe(GRID_MIN);
    expect(clampGridDimension(-5)).toBe(GRID_MIN);
  });

  it('clamps above maximum to 256', () => {
    expect(clampGridDimension(300)).toBe(GRID_MAX);
    expect(clampGridDimension(999)).toBe(GRID_MAX);
  });

  it('rounds fractional values', () => {
    expect(clampGridDimension(10.4)).toBe(10);
    expect(clampGridDimension(10.6)).toBe(11);
  });

  it('handles NaN and Infinity', () => {
    expect(clampGridDimension(NaN)).toBe(GRID_MIN);
    expect(clampGridDimension(Infinity)).toBe(GRID_MIN);
    expect(clampGridDimension(-Infinity)).toBe(GRID_MIN);
  });
});

describe('useCanvasStore', () => {
  beforeEach(() => {
    // Reset to defaults
    useCanvasStore.setState({
      width: GRID_DEFAULT_WIDTH,
      height: GRID_DEFAULT_HEIGHT,
    });
  });

  it('has correct default dimensions', () => {
    const state = useCanvasStore.getState();
    expect(state.width).toBe(80);
    expect(state.height).toBe(24);
  });

  it('setWidth updates width within range', () => {
    useCanvasStore.getState().setWidth(120);
    expect(useCanvasStore.getState().width).toBe(120);
  });

  it('setWidth clamps out-of-range values', () => {
    useCanvasStore.getState().setWidth(0);
    expect(useCanvasStore.getState().width).toBe(1);

    useCanvasStore.getState().setWidth(300);
    expect(useCanvasStore.getState().width).toBe(256);
  });

  it('setHeight updates height within range', () => {
    useCanvasStore.getState().setHeight(40);
    expect(useCanvasStore.getState().height).toBe(40);
  });

  it('setHeight clamps out-of-range values', () => {
    useCanvasStore.getState().setHeight(-1);
    expect(useCanvasStore.getState().height).toBe(1);

    useCanvasStore.getState().setHeight(512);
    expect(useCanvasStore.getState().height).toBe(256);
  });

  it('setDimensions updates both values', () => {
    useCanvasStore.getState().setDimensions(100, 50);
    const state = useCanvasStore.getState();
    expect(state.width).toBe(100);
    expect(state.height).toBe(50);
  });

  it('setDimensions clamps both values', () => {
    useCanvasStore.getState().setDimensions(0, 999);
    const state = useCanvasStore.getState();
    expect(state.width).toBe(1);
    expect(state.height).toBe(256);
  });

  it('supports minimum 1×1 canvas', () => {
    useCanvasStore.getState().setDimensions(1, 1);
    const state = useCanvasStore.getState();
    expect(state.width).toBe(1);
    expect(state.height).toBe(1);
  });

  it('supports maximum 256×256 canvas', () => {
    useCanvasStore.getState().setDimensions(256, 256);
    const state = useCanvasStore.getState();
    expect(state.width).toBe(256);
    expect(state.height).toBe(256);
  });
});
