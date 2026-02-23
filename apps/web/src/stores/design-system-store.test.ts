import { describe, it, expect, beforeEach } from 'vitest';
import { useDesignSystemStore } from './design-system-store';
import { createBuffer } from '@/types/canvas';

describe('DesignSystemStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useDesignSystemStore.setState({
      activeDesignSystem: null,
      designSystems: [],
    });
  });

  describe('createNewDesignSystem', () => {
    it('should create a new design system', () => {
      const { createNewDesignSystem, designSystems, activeDesignSystem } = useDesignSystemStore.getState();
      
      createNewDesignSystem('Test System', 'A test design system');
      
      const state = useDesignSystemStore.getState();
      expect(state.designSystems).toHaveLength(1);
      expect(state.designSystems[0].name).toBe('Test System');
      expect(state.designSystems[0].description).toBe('A test design system');
      expect(state.activeDesignSystem).toBe(state.designSystems[0]);
    });

    it('should set the new design system as active', () => {
      const { createNewDesignSystem } = useDesignSystemStore.getState();
      
      createNewDesignSystem('First System');
      const state1 = useDesignSystemStore.getState();
      const firstSystem = state1.designSystems[0];
      
      createNewDesignSystem('Second System');
      const state2 = useDesignSystemStore.getState();
      
      expect(state2.designSystems).toHaveLength(2);
      expect(state2.activeDesignSystem?.name).toBe('Second System');
    });
  });

  describe('addComponent', () => {
    it('should add a component to the active design system', () => {
      const { createNewDesignSystem, addComponent } = useDesignSystemStore.getState();
      
      createNewDesignSystem('Test System');
      
      const buffer = createBuffer(5, 3);
      addComponent({
        name: 'Test Component',
        description: 'A test component',
        role: 'container',
        minWidth: 5,
        minHeight: 3,
        resizable: false,
        template: buffer,
        slots: [],
        tags: ['test'],
      });
      
      const state = useDesignSystemStore.getState();
      expect(state.activeDesignSystem?.components).toHaveLength(1);
      expect(state.activeDesignSystem?.components[0].name).toBe('Test Component');
    });

    it('should not add component if no active design system', () => {
      const { addComponent } = useDesignSystemStore.getState();
      
      const buffer = createBuffer(5, 3);
      addComponent({
        name: 'Test Component',
        description: '',
        role: 'container',
        minWidth: 5,
        minHeight: 3,
        resizable: false,
        template: buffer,
        slots: [],
        tags: [],
      });
      
      const state = useDesignSystemStore.getState();
      expect(state.activeDesignSystem).toBeNull();
      expect(state.designSystems).toHaveLength(0);
    });
  });

  describe('removeComponent', () => {
    it('should remove a component from the active design system', () => {
      const { createNewDesignSystem, addComponent, removeComponent } = useDesignSystemStore.getState();
      
      createNewDesignSystem('Test System');
      
      const buffer = createBuffer(5, 3);
      addComponent({
        name: 'Test Component',
        description: '',
        role: 'container',
        minWidth: 5,
        minHeight: 3,
        resizable: false,
        template: buffer,
        slots: [],
        tags: [],
      });
      
      const state1 = useDesignSystemStore.getState();
      const componentId = state1.activeDesignSystem?.components[0].id;
      
      if (componentId) {
        removeComponent(componentId);
      }
      
      const state2 = useDesignSystemStore.getState();
      expect(state2.activeDesignSystem?.components).toHaveLength(0);
    });
  });

  describe('createComponentFromRegion', () => {
    it('should create a component from a buffer region', () => {
      const { createComponentFromRegion } = useDesignSystemStore.getState();
      
      const sourceBuffer = createBuffer(10, 10);
      // Fill a region with characters
      for (let row = 2; row < 5; row++) {
        for (let col = 3; col < 8; col++) {
          const index = row * 10 + col;
          sourceBuffer.chars[index] = 'X'.charCodeAt(0);
        }
      }
      
      const component = createComponentFromRegion(
        'Test Component',
        'Created from region',
        'container',
        sourceBuffer,
        3, 2, 7, 4,  // startCol, startRow, endCol, endRow
        [],
        ['test']
      );
      
      expect(component).not.toBeNull();
      expect(component?.name).toBe('Test Component');
      expect(component?.minWidth).toBe(5);  // 7 - 3 + 1
      expect(component?.minHeight).toBe(3); // 4 - 2 + 1
      expect(component?.template.width).toBe(5);
      expect(component?.template.height).toBe(3);
    });

    it('should handle reversed coordinates', () => {
      const { createComponentFromRegion } = useDesignSystemStore.getState();
      
      const sourceBuffer = createBuffer(10, 10);
      
      const component = createComponentFromRegion(
        'Test',
        '',
        'container',
        sourceBuffer,
        7, 4, 3, 2,  // reversed coordinates
        [],
        []
      );
      
      expect(component).not.toBeNull();
      expect(component?.minWidth).toBe(5);
      expect(component?.minHeight).toBe(3);
    });

    it('should handle edge case coordinates correctly', () => {
      const { createComponentFromRegion } = useDesignSystemStore.getState();
      
      const sourceBuffer = createBuffer(10, 10);
      
      // Even with same or reversed coordinates, creates valid 1x2 component due to normalization
      const component = createComponentFromRegion(
        'Test',
        '',
        'container',
        sourceBuffer,
        5, 5, 5, 4,  // normalized to 1x2 component
        [],
        []
      );
      
      expect(component).not.toBeNull();
      expect(component?.minWidth).toBe(1);
      expect(component?.minHeight).toBe(2);
    });
  });

  describe('setActiveDesignSystem', () => {
    it('should set the active design system', () => {
      const { createNewDesignSystem, setActiveDesignSystem } = useDesignSystemStore.getState();
      
      createNewDesignSystem('First');
      const state1 = useDesignSystemStore.getState();
      const firstId = state1.designSystems[0].id;
      
      createNewDesignSystem('Second');
      const state2 = useDesignSystemStore.getState();
      const secondId = state2.designSystems[1].id;
      
      expect(state2.activeDesignSystem?.name).toBe('Second');
      
      setActiveDesignSystem(firstId);
      const state3 = useDesignSystemStore.getState();
      expect(state3.activeDesignSystem?.name).toBe('First');
    });
  });

  describe('deleteDesignSystem', () => {
    it('should delete a design system', () => {
      const { createNewDesignSystem, deleteDesignSystem } = useDesignSystemStore.getState();
      
      createNewDesignSystem('Test');
      const state1 = useDesignSystemStore.getState();
      const systemId = state1.designSystems[0].id;
      
      deleteDesignSystem(systemId);
      const state2 = useDesignSystemStore.getState();
      
      expect(state2.designSystems).toHaveLength(0);
      expect(state2.activeDesignSystem).toBeNull();
    });

    it('should switch active to first available when deleting active', () => {
      const { createNewDesignSystem, deleteDesignSystem } = useDesignSystemStore.getState();
      
      createNewDesignSystem('First');
      const state1 = useDesignSystemStore.getState();
      const firstId = state1.designSystems[0].id;
      
      createNewDesignSystem('Second');
      const state2 = useDesignSystemStore.getState();
      const secondId = state2.activeDesignSystem?.id;
      
      expect(state2.activeDesignSystem?.name).toBe('Second');
      
      if (secondId) {
        deleteDesignSystem(secondId);
      }
      
      const state3 = useDesignSystemStore.getState();
      expect(state3.activeDesignSystem?.name).toBe('First');
    });
  });
});
