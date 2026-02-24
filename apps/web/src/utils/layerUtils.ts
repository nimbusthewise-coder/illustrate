/**
 * Layer Hierarchy Utilities — F019: Parent / Child Layer Relationships
 *
 * Functions for managing hierarchical layer relationships
 */

import type { Layer } from '../lib/types';

/**
 * Get all children of a layer (non-recursive)
 */
export function getChildren(layers: Layer[], parentId: string): Layer[] {
  return layers.filter((layer) => layer.parentId === parentId);
}

/**
 * Get all descendants of a layer (recursive)
 */
export function getDescendants(layers: Layer[], parentId: string): Layer[] {
  const children = getChildren(layers, parentId);
  const descendants: Layer[] = [...children];

  for (const child of children) {
    descendants.push(...getDescendants(layers, child.id));
  }

  return descendants;
}

/**
 * Get all ancestors of a layer
 */
export function getAncestors(layers: Layer[], layerId: string): Layer[] {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer || !layer.parentId) return [];

  const parent = layers.find((l) => l.id === layer.parentId);
  if (!parent) return [];

  return [parent, ...getAncestors(layers, parent.id)];
}

/**
 * Get nesting depth of a layer
 */
export function getDepth(layers: Layer[], layerId: string): number {
  return getAncestors(layers, layerId).length;
}

/**
 * Check if layerId is an ancestor of childId
 */
export function isAncestor(
  layers: Layer[],
  ancestorId: string,
  childId: string
): boolean {
  const ancestors = getAncestors(layers, childId);
  return ancestors.some((a) => a.id === ancestorId);
}

/**
 * Check if a layer has children
 */
export function hasChildren(layers: Layer[], layerId: string): boolean {
  return layers.some((layer) => layer.parentId === layerId);
}

/**
 * Get top-level layers (no parent)
 */
export function getRootLayers(layers: Layer[]): Layer[] {
  return layers.filter((layer) => layer.parentId === null);
}

/**
 * Build a hierarchical tree structure
 */
export interface LayerTreeNode {
  layer: Layer;
  children: LayerTreeNode[];
  depth: number;
}

export function buildLayerTree(layers: Layer[]): LayerTreeNode[] {
  const rootLayers = getRootLayers(layers);

  function buildNode(layer: Layer, depth: number): LayerTreeNode {
    const children = getChildren(layers, layer.id);
    return {
      layer,
      children: children.map((child) => buildNode(child, depth + 1)),
      depth,
    };
  }

  return rootLayers.map((layer) => buildNode(layer, 0));
}

/**
 * Flatten a layer tree back to a list (depth-first)
 */
export function flattenLayerTree(tree: LayerTreeNode[]): Layer[] {
  const result: Layer[] = [];

  function traverse(node: LayerTreeNode) {
    result.push(node.layer);
    node.children.forEach(traverse);
  }

  tree.forEach(traverse);
  return result;
}

/**
 * Check if a layer is effectively visible (considering parent visibility)
 */
export function isEffectivelyVisible(layers: Layer[], layerId: string): boolean {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer || !layer.visible) return false;

  if (!layer.parentId) return true;

  return isEffectivelyVisible(layers, layer.parentId);
}

/**
 * Check if a layer is effectively locked (considering parent lock state)
 */
export function isEffectivelyLocked(layers: Layer[], layerId: string): boolean {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer) return false;
  if (layer.locked) return true;

  if (!layer.parentId) return false;

  return isEffectivelyLocked(layers, layer.parentId);
}

/**
 * Get all layers that should be selected when selecting a parent
 */
export function getSelectionGroup(layers: Layer[], layerId: string): Layer[] {
  const layer = layers.find((l) => l.id === layerId);
  if (!layer) return [];

  // If layer has children, include all descendants
  if (hasChildren(layers, layerId)) {
    return [layer, ...getDescendants(layers, layerId)];
  }

  return [layer];
}

/**
 * Validate that nesting layerId under parentId is valid
 * (prevents circular references and self-parenting)
 */
export function canNestLayer(
  layers: Layer[],
  layerId: string,
  parentId: string | null
): boolean {
  if (layerId === parentId) return false; // Can't parent to self
  if (parentId === null) return true; // Can always unnest

  // Check if parentId is a descendant of layerId (would create cycle)
  if (isAncestor(layers, layerId, parentId)) return false;

  return true;
}
