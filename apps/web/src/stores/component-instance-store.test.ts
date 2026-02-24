/**
 * Component Instance Store Tests
 * F021: Place Components on Canvas
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useComponentInstanceStore,
  resetComponentInstanceStore,
} from './component-instance-store';

describe('Component Instance Store', () => {
  beforeEach(() => {
    resetComponentInstanceStore();
  });

  describe('placeComponent', () => {
    it('should place a component instance', () => {
      const { placeComponent } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      expect(instanceId).toBeTruthy();
      
      const { instances } = useComponentInstanceStore.getState();
      expect(instances).toHaveLength(1);

      const instance = instances[0];
      expect(instance.componentId).toBe('cmp-1');
      expect(instance.layerId).toBe('layer-1');
      expect(instance.x).toBe(10);
      expect(instance.y).toBe(5);
      expect(instance.slotValues).toEqual({});
    });

    it('should auto-select newly placed instance', () => {
      const { placeComponent } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      const { selectedInstanceId } = useComponentInstanceStore.getState();
      expect(selectedInstanceId).toBe(instanceId);
    });

    it('should generate unique IDs for multiple instances', () => {
      const { placeComponent } = useComponentInstanceStore.getState();
      const id1 = placeComponent('cmp-1', 'layer-1', 0, 0);
      const id2 = placeComponent('cmp-1', 'layer-1', 10, 10);

      expect(id1).not.toBe(id2);
      
      const { instances } = useComponentInstanceStore.getState();
      expect(instances).toHaveLength(2);
    });
  });

  describe('removeInstance', () => {
    it('should remove an instance by ID', () => {
      const { placeComponent, removeInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      removeInstance(instanceId);

      const { instances } = useComponentInstanceStore.getState();
      expect(instances).toHaveLength(0);
    });

    it('should clear selection when removing selected instance', () => {
      const { placeComponent, removeInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      let state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBe(instanceId);

      removeInstance(instanceId);

      state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBeNull();
    });

    it('should preserve selection when removing different instance', () => {
      const { placeComponent, removeInstance, selectInstance } = useComponentInstanceStore.getState();
      const id1 = placeComponent('cmp-1', 'layer-1', 0, 0);
      const id2 = placeComponent('cmp-2', 'layer-1', 10, 10);

      selectInstance(id1);
      removeInstance(id2);

      const { selectedInstanceId } = useComponentInstanceStore.getState();
      expect(selectedInstanceId).toBe(id1);
    });
  });

  describe('moveInstance', () => {
    it('should update instance position', () => {
      const { placeComponent, moveInstance, getInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      moveInstance(instanceId, 20, 15);

      const instance = useComponentInstanceStore.getState().getInstance(instanceId);
      expect(instance?.x).toBe(20);
      expect(instance?.y).toBe(15);
    });

    it('should not affect other instances', () => {
      const { placeComponent, moveInstance, getInstance } = useComponentInstanceStore.getState();
      const id1 = placeComponent('cmp-1', 'layer-1', 0, 0);
      const id2 = placeComponent('cmp-2', 'layer-1', 10, 10);

      moveInstance(id1, 5, 5);

      const instance2 = useComponentInstanceStore.getState().getInstance(id2);
      expect(instance2?.x).toBe(10);
      expect(instance2?.y).toBe(10);
    });
  });

  describe('updateSlotValue', () => {
    it('should update slot values', () => {
      const { placeComponent, updateSlotValue } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      updateSlotValue(instanceId, 'slot-1', 'Hello');

      const instance = useComponentInstanceStore.getState().getInstance(instanceId);
      expect(instance?.slotValues).toEqual({ 'slot-1': 'Hello' });
    });

    it('should update multiple slot values', () => {
      const { placeComponent, updateSlotValue } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      updateSlotValue(instanceId, 'slot-1', 'Hello');
      updateSlotValue(instanceId, 'slot-2', 'World');

      const instance = useComponentInstanceStore.getState().getInstance(instanceId);
      expect(instance?.slotValues).toEqual({
        'slot-1': 'Hello',
        'slot-2': 'World',
      });
    });
  });

  describe('selectInstance', () => {
    it('should select an instance', () => {
      const { placeComponent, selectInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      selectInstance(null);
      let state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBeNull();

      selectInstance(instanceId);
      state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBe(instanceId);
    });

    it('should allow clearing selection', () => {
      const { placeComponent, selectInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      selectInstance(instanceId);
      let state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBe(instanceId);

      selectInstance(null);
      state = useComponentInstanceStore.getState();
      expect(state.selectedInstanceId).toBeNull();
    });
  });

  describe('getInstance', () => {
    it('should return instance by ID', () => {
      const { placeComponent, getInstance } = useComponentInstanceStore.getState();
      const instanceId = placeComponent('cmp-1', 'layer-1', 10, 5);

      const instance = useComponentInstanceStore.getState().getInstance(instanceId);

      expect(instance).toBeDefined();
      expect(instance?.id).toBe(instanceId);
    });

    it('should return undefined for non-existent ID', () => {
      const { getInstance } = useComponentInstanceStore.getState();
      const instance = getInstance('non-existent');

      expect(instance).toBeUndefined();
    });
  });

  describe('getInstancesOnLayer', () => {
    it('should return instances on specified layer', () => {
      const { placeComponent } = useComponentInstanceStore.getState();
      placeComponent('cmp-1', 'layer-1', 0, 0);
      placeComponent('cmp-2', 'layer-1', 10, 10);
      placeComponent('cmp-3', 'layer-2', 20, 20);

      const layer1Instances = useComponentInstanceStore.getState().getInstancesOnLayer('layer-1');

      expect(layer1Instances).toHaveLength(2);
      expect(layer1Instances.every((i) => i.layerId === 'layer-1')).toBe(true);
    });

    it('should return empty array for layer with no instances', () => {
      const { placeComponent } = useComponentInstanceStore.getState();
      placeComponent('cmp-1', 'layer-1', 0, 0);

      const layer2Instances = useComponentInstanceStore.getState().getInstancesOnLayer('layer-2');

      expect(layer2Instances).toHaveLength(0);
    });
  });
});
