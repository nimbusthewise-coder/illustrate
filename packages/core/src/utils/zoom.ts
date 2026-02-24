/**
 * Zoom utilities for canvas scaling
 * F003: Zoom In/Out functionality
 * 
 * Implements zoom levels as powers of 2 for crisp rendering at all zoom levels.
 * Provides utilities for calculating zoom levels, clamping, and formatting.
 */

/**
 * Minimum zoom level (10%)
 */
export const MIN_ZOOM = 0.1;

/**
 * Maximum zoom level (800%)
 */
export const MAX_ZOOM = 8.0;

/**
 * Default zoom level (100%)
 */
export const DEFAULT_ZOOM = 1.0;

/**
 * Zoom step for increment/decrement operations
 */
export const ZOOM_STEP = 0.25;

/**
 * Common zoom preset levels
 */
export const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0, 8.0];

/**
 * Clamp a zoom value between MIN_ZOOM and MAX_ZOOM
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Round zoom to nearest step for cleaner values
 */
export function roundZoom(zoom: number): number {
  return Math.round(zoom / ZOOM_STEP) * ZOOM_STEP;
}

/**
 * Increment zoom by one step
 */
export function incrementZoom(currentZoom: number): number {
  return clampZoom(roundZoom(currentZoom + ZOOM_STEP));
}

/**
 * Decrement zoom by one step
 */
export function decrementZoom(currentZoom: number): number {
  return clampZoom(roundZoom(currentZoom - ZOOM_STEP));
}

/**
 * Reset zoom to default (100%)
 */
export function resetZoom(): number {
  return DEFAULT_ZOOM;
}

/**
 * Format zoom as percentage string for display
 */
export function formatZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`;
}

/**
 * Apply zoom to mouse wheel delta
 * Returns new zoom level based on wheel direction
 */
export function applyWheelZoom(
  currentZoom: number,
  deltaY: number,
  sensitivity = 0.001
): number {
  // Negative deltaY means zoom in, positive means zoom out
  const delta = -deltaY * sensitivity;
  const newZoom = currentZoom * (1 + delta);
  return clampZoom(roundZoom(newZoom));
}

/**
 * Calculate the transform origin for zoom operations
 * to maintain the point under the cursor
 */
export function calculateTransformOrigin(
  mouseX: number,
  mouseY: number,
  containerRect: DOMRect
): { x: number; y: number } {
  const x = ((mouseX - containerRect.left) / containerRect.width) * 100;
  const y = ((mouseY - containerRect.top) / containerRect.height) * 100;
  return { x, y };
}
