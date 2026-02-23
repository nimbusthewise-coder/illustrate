/**
 * F019: Layer hierarchy helpers for parent/child relationships
 */
import { Layer } from './canvas';

/**
 * Get direct children of a layer
 */
export function getChildLayers(layers: Layer[], parentId: string): Layer[] {
  return layers.filter((l) => l.parentId === parentId);
}

/**
 * Get all descendant layer IDs (recursive)
 */
export function getDescendantIds(layers: Layer[], parentId: string): string[] {
  const ids: string[] = [];
  const children = layers.filter((l) => l.parentId === parentId);
  for (const child of children) {
    ids.push(child.id);
    ids.push(...getDescendantIds(layers, child.id));
  }
  return ids;
}

/**
 * Check if a layer is effectively visible (all ancestors visible)
 */
export function isEffectivelyVisible(layers: Layer[], layerId: string): boolean {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer) return false;
  if (!layer.visible) return false;
  if (layer.parentId) {
    return isEffectivelyVisible(layers, layer.parentId);
  }
  return true;
}

/**
 * Check if a layer is effectively locked (any ancestor locked)
 */
export function isEffectivelyLocked(layers: Layer[], layerId: string): boolean {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer) return false;
  if (layer.locked) return true;
  if (layer.parentId) {
    return isEffectivelyLocked(layers, layer.parentId);
  }
  return false;
}

/**
 * Build a tree-ordered flat list for rendering (parents before children)
 */
export function getLayerTree(layers: Layer[]): { layer: Layer; depth: number }[] {
  const result: { layer: Layer; depth: number }[] = [];

  function addChildren(parentId: string | null, depth: number) {
    const children = layers.filter((l) => l.parentId === parentId);
    for (const child of children) {
      result.push({ layer: child, depth });
      addChildren(child.id, depth + 1);
    }
  }

  addChildren(null, 0);
  return result;
}

/**
 * Check if nesting would create a cycle
 */
export function wouldCreateCycle(layers: Layer[], layerId: string, newParentId: string): boolean {
  if (layerId === newParentId) return true;
  const descendants = getDescendantIds(layers, layerId);
  return descendants.includes(newParentId);
}
