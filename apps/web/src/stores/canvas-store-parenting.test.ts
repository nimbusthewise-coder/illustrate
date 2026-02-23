import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './canvas-store';
import { getDescendantIds, getLayerTree, wouldCreateCycle, isEffectivelyVisible, isEffectivelyLocked } from '@/types/canvas';

describe('F019: Parent/Child Layer Relationships', () => {
  beforeEach(() => {
    useCanvasStore.setState({ document: null, activeLayerId: null });
    useCanvasStore.getState().initializeDocument(10, 10, 'Test');
    // Add extra layers for testing
    useCanvasStore.getState().addLayer();
    useCanvasStore.getState().addLayer();
  });

  function getLayers() {
    return useCanvasStore.getState().document!.layers;
  }

  describe('nestLayer', () => {
    it('should set parentId on the child layer', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === childId)!.parentId).toBe(parentId);
    });

    it('should not allow nesting a layer into itself', () => {
      const layers = getLayers();
      const layerId = layers[0].id;

      useCanvasStore.getState().nestLayer(layerId, layerId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === layerId)!.parentId).toBeNull();
    });

    it('should not create cycles (child nested into grandchild)', () => {
      const layers = getLayers();
      const grandparent = layers[0].id;
      const parent = layers[1].id;
      const child = layers[2].id;

      // grandparent > parent > child
      useCanvasStore.getState().nestLayer(parent, grandparent);
      useCanvasStore.getState().nestLayer(child, parent);

      // Try to nest grandparent into child (would create cycle)
      useCanvasStore.getState().nestLayer(grandparent, child);

      const updated = getLayers();
      expect(updated.find((l) => l.id === grandparent)!.parentId).toBeNull();
    });

    it('should do nothing if document is null', () => {
      useCanvasStore.setState({ document: null });
      expect(() => useCanvasStore.getState().nestLayer('a', 'b')).not.toThrow();
    });
  });

  describe('unnestLayer', () => {
    it('should set parentId to null', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      expect(getLayers().find((l) => l.id === childId)!.parentId).toBe(parentId);

      useCanvasStore.getState().unnestLayer(childId);
      expect(getLayers().find((l) => l.id === childId)!.parentId).toBeNull();
    });

    it('should do nothing for root layers', () => {
      const layers = getLayers();
      const layerId = layers[0].id;

      useCanvasStore.getState().unnestLayer(layerId);
      expect(getLayers().find((l) => l.id === layerId)!.parentId).toBeNull();
    });
  });

  describe('visibility cascade', () => {
    it('should hide all children when parent is hidden', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().toggleLayerVisibility(parentId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === parentId)!.visible).toBe(false);
      expect(updated.find((l) => l.id === childId)!.visible).toBe(false);
    });

    it('should show all children when parent is shown', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().toggleLayerVisibility(parentId); // hide
      useCanvasStore.getState().toggleLayerVisibility(parentId); // show

      const updated = getLayers();
      expect(updated.find((l) => l.id === parentId)!.visible).toBe(true);
      expect(updated.find((l) => l.id === childId)!.visible).toBe(true);
    });

    it('should cascade through multiple levels', () => {
      const layers = getLayers();
      const grandparent = layers[0].id;
      const parent = layers[1].id;
      const child = layers[2].id;

      useCanvasStore.getState().nestLayer(parent, grandparent);
      useCanvasStore.getState().nestLayer(child, parent);

      useCanvasStore.getState().toggleLayerVisibility(grandparent);

      const updated = getLayers();
      expect(updated.find((l) => l.id === grandparent)!.visible).toBe(false);
      expect(updated.find((l) => l.id === parent)!.visible).toBe(false);
      expect(updated.find((l) => l.id === child)!.visible).toBe(false);
    });

    it('should not affect unrelated layers', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;
      const unrelatedId = layers[2].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().toggleLayerVisibility(parentId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === unrelatedId)!.visible).toBe(true);
    });
  });

  describe('lock cascade', () => {
    it('should lock all children when parent is locked', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().toggleLayerLock(parentId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === parentId)!.locked).toBe(true);
      expect(updated.find((l) => l.id === childId)!.locked).toBe(true);
    });

    it('should unlock all children when parent is unlocked', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().toggleLayerLock(parentId);
      useCanvasStore.getState().toggleLayerLock(parentId);

      const updated = getLayers();
      expect(updated.find((l) => l.id === parentId)!.locked).toBe(false);
      expect(updated.find((l) => l.id === childId)!.locked).toBe(false);
    });
  });

  describe('collapse/expand groups', () => {
    it('should create layers with collapsed=false by default', () => {
      const layers = getLayers();
      layers.forEach((layer) => {
        expect(layer.collapsed).toBe(false);
      });
    });

    it('should toggle collapsed state', () => {
      const layers = getLayers();
      const layerId = layers[0].id;

      useCanvasStore.getState().toggleLayerCollapsed(layerId);
      expect(getLayers().find((l) => l.id === layerId)!.collapsed).toBe(true);

      useCanvasStore.getState().toggleLayerCollapsed(layerId);
      expect(getLayers().find((l) => l.id === layerId)!.collapsed).toBe(false);
    });
  });

  describe('moveLayerPosition (children move with parent)', () => {
    it('should move parent and all children together', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      const parentBefore = getLayers().find((l) => l.id === parentId)!;
      const childBefore = getLayers().find((l) => l.id === childId)!;

      useCanvasStore.getState().moveLayerPosition(parentId, 5, 3);

      const parentAfter = getLayers().find((l) => l.id === parentId)!;
      const childAfter = getLayers().find((l) => l.id === childId)!;

      expect(parentAfter.x).toBe(parentBefore.x + 5);
      expect(parentAfter.y).toBe(parentBefore.y + 3);
      expect(childAfter.x).toBe(childBefore.x + 5);
      expect(childAfter.y).toBe(childBefore.y + 3);
    });

    it('should not move unrelated layers', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;
      const unrelatedId = layers[2].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      const unrelatedBefore = getLayers().find((l) => l.id === unrelatedId)!;
      useCanvasStore.getState().moveLayerPosition(parentId, 5, 3);
      const unrelatedAfter = getLayers().find((l) => l.id === unrelatedId)!;

      expect(unrelatedAfter.x).toBe(unrelatedBefore.x);
      expect(unrelatedAfter.y).toBe(unrelatedBefore.y);
    });
  });

  describe('deleteLayer with children', () => {
    it('should delete parent and all descendants', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;
      const unrelatedId = layers[2].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      useCanvasStore.getState().deleteLayer(parentId);

      const remaining = getLayers();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(unrelatedId);
    });

    it('should not delete all layers (keeps at least one)', () => {
      // Remove all but two layers
      const layers = getLayers();
      useCanvasStore.getState().deleteLayer(layers[2].id);

      const parentId = getLayers()[0].id;
      const childId = getLayers()[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      // This would delete both layers - should be prevented
      useCanvasStore.getState().deleteLayer(parentId);

      // At least one layer should remain
      expect(getLayers().length).toBeGreaterThanOrEqual(1);
    });

    it('should switch active layer if active layer is deleted descendant', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;
      const unrelatedId = layers[2].id;

      useCanvasStore.getState().nestLayer(childId, parentId);
      useCanvasStore.getState().setActiveLayer(childId);

      useCanvasStore.getState().deleteLayer(parentId);

      expect(useCanvasStore.getState().activeLayerId).toBe(unrelatedId);
    });
  });

  describe('helper functions', () => {
    it('getDescendantIds should return all descendants', () => {
      const layers = getLayers();
      const gp = layers[0].id;
      const p = layers[1].id;
      const c = layers[2].id;

      useCanvasStore.getState().nestLayer(p, gp);
      useCanvasStore.getState().nestLayer(c, p);

      const descendants = getDescendantIds(getLayers(), gp);
      expect(descendants).toContain(p);
      expect(descendants).toContain(c);
      expect(descendants).not.toContain(gp);
    });

    it('getLayerTree should return tree-ordered list', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      const tree = getLayerTree(getLayers());
      const parentEntry = tree.find((t) => t.layer.id === parentId)!;
      const childEntry = tree.find((t) => t.layer.id === childId)!;

      expect(parentEntry.depth).toBe(0);
      expect(childEntry.depth).toBe(1);

      // Parent should come before child in tree order
      const parentIdx = tree.indexOf(parentEntry);
      const childIdx = tree.indexOf(childEntry);
      expect(parentIdx).toBeLessThan(childIdx);
    });

    it('wouldCreateCycle should detect cycles', () => {
      const layers = getLayers();
      const a = layers[0].id;
      const b = layers[1].id;
      const c = layers[2].id;

      useCanvasStore.getState().nestLayer(b, a);
      useCanvasStore.getState().nestLayer(c, b);

      expect(wouldCreateCycle(getLayers(), a, c)).toBe(true);
      expect(wouldCreateCycle(getLayers(), a, a)).toBe(true);
      expect(wouldCreateCycle(getLayers(), c, a)).toBe(false);
    });

    it('isEffectivelyVisible should check ancestors', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      expect(isEffectivelyVisible(getLayers(), childId)).toBe(true);

      // Hide only the parent directly (not using cascade toggle for this test)
      const doc = useCanvasStore.getState().document!;
      useCanvasStore.setState({
        document: {
          ...doc,
          layers: doc.layers.map((l) =>
            l.id === parentId ? { ...l, visible: false } : l
          ),
        },
      });

      expect(isEffectivelyVisible(getLayers(), childId)).toBe(false);
    });

    it('isEffectivelyLocked should check ancestors', () => {
      const layers = getLayers();
      const parentId = layers[0].id;
      const childId = layers[1].id;

      useCanvasStore.getState().nestLayer(childId, parentId);

      expect(isEffectivelyLocked(getLayers(), childId)).toBe(false);

      // Lock only the parent directly
      const doc = useCanvasStore.getState().document!;
      useCanvasStore.setState({
        document: {
          ...doc,
          layers: doc.layers.map((l) =>
            l.id === parentId ? { ...l, locked: true } : l
          ),
        },
      });

      expect(isEffectivelyLocked(getLayers(), childId)).toBe(true);
    });
  });
});
