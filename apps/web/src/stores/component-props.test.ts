import { describe, it, expect, beforeEach } from 'vitest';
import { applyPropOverridesToBuffer, validatePropOverrides, resolvePropValue } from '@/types/component-props';
import { useComponentLibraryStore } from '@/stores/component-library-store';
import { createBuffer } from '@/types/canvas';

describe('F020: Reusable Named Components with Props', () => {
  describe('applyPropOverridesToBuffer', () => {
    it('should write override text into slot regions', () => {
      const buffer = createBuffer(20, 5);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = ' '.charCodeAt(0);
      const slots = [{ name: 'title', x: 1, y: 0, width: 10, height: 1, default: 'Default' }];
      applyPropOverridesToBuffer(buffer, slots, { title: 'Hello' }, 0, 0);
      const chars: string[] = [];
      for (let i = 0; i < 5; i++) chars.push(String.fromCharCode(buffer.chars[0 * 20 + 1 + i]));
      expect(chars.join('')).toBe('Hello');
    });

    it('should use slot default when no override is provided', () => {
      const buffer = createBuffer(20, 5);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = ' '.charCodeAt(0);
      const slots = [{ name: 'title', x: 0, y: 0, width: 10, height: 1, default: 'Default' }];
      applyPropOverridesToBuffer(buffer, slots, {}, 0, 0);
      const chars: string[] = [];
      for (let i = 0; i < 7; i++) chars.push(String.fromCharCode(buffer.chars[i]));
      expect(chars.join('')).toBe('Default');
    });

    it('should handle multiple slots', () => {
      const buffer = createBuffer(20, 5);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = ' '.charCodeAt(0);
      const slots = [
        { name: 'title', x: 0, y: 0, width: 10, height: 1, default: 'Title' },
        { name: 'body', x: 0, y: 1, width: 10, height: 1, default: 'Body' },
      ];
      applyPropOverridesToBuffer(buffer, slots, { title: 'Hello', body: 'World' }, 0, 0);
      const titleChars: string[] = [];
      for (let i = 0; i < 5; i++) titleChars.push(String.fromCharCode(buffer.chars[i]));
      expect(titleChars.join('')).toBe('Hello');
      const bodyChars: string[] = [];
      for (let i = 0; i < 5; i++) bodyChars.push(String.fromCharCode(buffer.chars[20 + i]));
      expect(bodyChars.join('')).toBe('World');
    });

    it('should truncate text that exceeds slot width', () => {
      const buffer = createBuffer(20, 5);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = ' '.charCodeAt(0);
      const slots = [{ name: 'label', x: 0, y: 0, width: 3, height: 1, default: '' }];
      applyPropOverridesToBuffer(buffer, slots, { label: 'TooLong' }, 0, 0);
      const chars: string[] = [];
      for (let i = 0; i < 3; i++) chars.push(String.fromCharCode(buffer.chars[i]));
      expect(chars.join('')).toBe('Too');
      expect(String.fromCharCode(buffer.chars[3])).toBe(' ');
    });

    it('should apply offset when placing', () => {
      const buffer = createBuffer(20, 10);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = ' '.charCodeAt(0);
      const slots = [{ name: 'label', x: 1, y: 1, width: 5, height: 1, default: 'Test' }];
      applyPropOverridesToBuffer(buffer, slots, { label: 'Hi' }, 5, 3);
      const idx = 4 * 20 + 6;
      expect(String.fromCharCode(buffer.chars[idx])).toBe('H');
      expect(String.fromCharCode(buffer.chars[idx + 1])).toBe('i');
    });

    it('should skip empty slots', () => {
      const buffer = createBuffer(20, 5);
      const original = ' '.charCodeAt(0);
      for (let i = 0; i < buffer.chars.length; i++) buffer.chars[i] = original;
      const slots = [{ name: 'empty', x: 0, y: 0, width: 10, height: 1, default: '' }];
      applyPropOverridesToBuffer(buffer, slots, {}, 0, 0);
      expect(buffer.chars[0]).toBe(original);
    });
  });

  describe('validatePropOverrides', () => {
    it('should validate number props', () => {
      const props = [{ name: 'count', type: 'number' as const, default: '5' }];
      expect(validatePropOverrides(props, { count: '10' })).toEqual([]);
      expect(validatePropOverrides(props, { count: 'abc' })).toHaveLength(1);
    });

    it('should validate boolean props', () => {
      const props = [{ name: 'visible', type: 'boolean' as const, default: 'true' }];
      expect(validatePropOverrides(props, { visible: 'true' })).toEqual([]);
      expect(validatePropOverrides(props, { visible: 'false' })).toEqual([]);
      expect(validatePropOverrides(props, { visible: 'yes' })).toHaveLength(1);
    });

    it('should validate choice props', () => {
      const props = [{ name: 'size', type: 'choice' as const, default: 'md', choices: ['sm', 'md', 'lg'] }];
      expect(validatePropOverrides(props, { size: 'sm' })).toEqual([]);
      expect(validatePropOverrides(props, { size: 'xl' })).toHaveLength(1);
    });

    it('should allow text props with any value', () => {
      const props = [{ name: 'label', type: 'text' as const, default: '' }];
      expect(validatePropOverrides(props, { label: 'anything' })).toEqual([]);
    });

    it('should skip undefined overrides', () => {
      const props = [{ name: 'count', type: 'number' as const, default: '5' }];
      expect(validatePropOverrides(props, {})).toEqual([]);
    });
  });

  describe('resolvePropValue', () => {
    const props = [
      { name: 'title', type: 'text' as const, default: 'Default Title' },
      { name: 'count', type: 'number' as const, default: '5' },
    ];

    it('should return default when no override', () => {
      expect(resolvePropValue(props, 'title')).toBe('Default Title');
      expect(resolvePropValue(props, 'count')).toBe('5');
    });

    it('should return override when provided', () => {
      expect(resolvePropValue(props, 'title', { title: 'Custom' })).toBe('Custom');
    });

    it('should return undefined for unknown props', () => {
      expect(resolvePropValue(props, 'unknown')).toBeUndefined();
    });
  });

  describe('ComponentLibraryStore', () => {
    beforeEach(() => {
      useComponentLibraryStore.setState({ components: [] });
    });

    it('should define a component with props', () => {
      const { defineComponent } = useComponentLibraryStore.getState();
      const comp = defineComponent(
        'Button', 'A reusable button', 'input',
        [
          { name: 'label', type: 'text', default: 'Click me', description: 'Button text' },
          { name: 'variant', type: 'choice', default: 'primary', choices: ['primary', 'secondary'] },
        ],
        [{ propName: 'label', slotName: 'label', x: 2, y: 1, width: 8, height: 1, default: 'Click me' }],
        ['button', 'input']
      );
      expect(comp.name).toBe('Button');
      expect(comp.props).toHaveLength(2);
      expect(comp.slotMappings).toHaveLength(1);
      expect(comp.tags).toEqual(['button', 'input']);
      expect(useComponentLibraryStore.getState().components).toHaveLength(1);
    });

    it('should get component by name', () => {
      const { defineComponent } = useComponentLibraryStore.getState();
      defineComponent('Button', '', 'input', [], [], []);
      defineComponent('Card', '', 'container', [], [], []);
      expect(useComponentLibraryStore.getState().getComponentByName('Button')?.name).toBe('Button');
    });

    it('should get components by role', () => {
      const { defineComponent } = useComponentLibraryStore.getState();
      defineComponent('Button', '', 'input', [], [], []);
      defineComponent('TextField', '', 'input', [], [], []);
      defineComponent('Card', '', 'container', [], [], []);
      expect(useComponentLibraryStore.getState().getComponentsByRole('input')).toHaveLength(2);
    });

    it('should get components by tag', () => {
      const { defineComponent } = useComponentLibraryStore.getState();
      defineComponent('Button', '', 'input', [], [], ['primary']);
      defineComponent('Card', '', 'container', [], [], ['primary']);
      defineComponent('Alert', '', 'feedback', [], [], ['danger']);
      expect(useComponentLibraryStore.getState().getComponentsByTag('primary')).toHaveLength(2);
    });

    it('should update a component definition', () => {
      const { defineComponent, updateComponentDef } = useComponentLibraryStore.getState();
      const comp = defineComponent('Button', 'Old desc', 'input', [], [], []);
      updateComponentDef(comp.id, {
        description: 'New description',
        props: [{ name: 'label', type: 'text', default: 'Click' }],
      });
      const state = useComponentLibraryStore.getState();
      expect(state.components[0].description).toBe('New description');
      expect(state.components[0].props).toHaveLength(1);
    });

    it('should remove a component', () => {
      const { defineComponent, removeComponentDef } = useComponentLibraryStore.getState();
      const comp = defineComponent('Button', '', 'input', [], [], []);
      removeComponentDef(comp.id);
      expect(useComponentLibraryStore.getState().components).toHaveLength(0);
    });
  });
});
