/**
 * Component creation and management tests
 */

import { describe, it, expect } from 'vitest';
import { createBuffer, setChar } from './buffer.js';
import {
  extractBuffer,
  createComponent,
  createSlot,
  createDefaultCharacterSet,
  createDesignSystem,
  addComponentToDesignSystem,
  removeComponentFromDesignSystem,
  findComponent,
  updateComponent
} from './component.js';

describe('extractBuffer', () => {
  it('extracts a rectangular region from a buffer', () => {
    const source = createBuffer(10, 10);
    
    // Draw a simple pattern
    setChar(source, 2, 2, 'A');
    setChar(source, 2, 3, 'B');
    setChar(source, 3, 2, 'C');
    setChar(source, 3, 3, 'D');
    
    // Extract the 2x2 region containing the pattern
    const extracted = extractBuffer(source, 2, 2, 2, 2);
    
    expect(extracted.width).toBe(2);
    expect(extracted.height).toBe(2);
    expect(String.fromCharCode(extracted.chars[0])).toBe('A');
    expect(String.fromCharCode(extracted.chars[1])).toBe('B');
    expect(String.fromCharCode(extracted.chars[2])).toBe('C');
    expect(String.fromCharCode(extracted.chars[3])).toBe('D');
  });
  
  it('handles extraction at buffer boundaries', () => {
    const source = createBuffer(5, 5);
    setChar(source, 4, 4, 'X');
    
    // Extract from the corner
    const extracted = extractBuffer(source, 3, 3, 2, 2);
    
    expect(extracted.width).toBe(2);
    expect(extracted.height).toBe(2);
    expect(String.fromCharCode(extracted.chars[3])).toBe('X'); // Bottom-right
  });
  
  it('handles out-of-bounds extraction gracefully', () => {
    const source = createBuffer(5, 5);
    
    // Try to extract beyond buffer bounds
    const extracted = extractBuffer(source, 4, 4, 5, 5);
    
    expect(extracted.width).toBe(5);
    expect(extracted.height).toBe(5);
    // Out-of-bounds cells should be empty (char code 0)
    expect(extracted.chars[0]).toBe(0);
  });
});

describe('createComponent', () => {
  it('creates a component from a buffer selection', () => {
    const buffer = createBuffer(20, 20);
    
    // Draw a simple box
    setChar(buffer, 5, 5, '┌');
    setChar(buffer, 5, 6, '─');
    setChar(buffer, 5, 7, '┐');
    setChar(buffer, 6, 5, '│');
    setChar(buffer, 6, 7, '│');
    setChar(buffer, 7, 5, '└');
    setChar(buffer, 7, 6, '─');
    setChar(buffer, 7, 7, '┘');
    
    const component = createComponent({
      name: 'Simple Box',
      description: 'A simple 3x3 box',
      role: 'container',
      buffer,
      x: 5,
      y: 5,
      width: 3,
      height: 3
    });
    
    expect(component.name).toBe('Simple Box');
    expect(component.description).toBe('A simple 3x3 box');
    expect(component.role).toBe('container');
    expect(component.minWidth).toBe(3);
    expect(component.minHeight).toBe(3);
    expect(component.resizable).toBe(true); // default
    expect(component.template.width).toBe(3);
    expect(component.template.height).toBe(3);
    expect(component.id).toMatch(/^component_/);
  });
  
  it('creates a component with slots', () => {
    const buffer = createBuffer(20, 20);
    
    const slot = createSlot('title', 1, 1, 5, 1, 'Title');
    
    const component = createComponent({
      name: 'Card',
      description: 'A card with a title slot',
      role: 'container',
      buffer,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      slots: [slot]
    });
    
    expect(component.slots).toHaveLength(1);
    expect(component.slots[0].name).toBe('title');
    expect(component.slots[0].default).toBe('Title');
  });
  
  it('creates a non-resizable component', () => {
    const buffer = createBuffer(10, 10);
    
    const component = createComponent({
      name: 'Fixed Icon',
      description: 'A fixed-size icon',
      role: 'display',
      buffer,
      x: 0,
      y: 0,
      width: 3,
      height: 3,
      resizable: false
    });
    
    expect(component.resizable).toBe(false);
  });
  
  it('creates a component with tags', () => {
    const buffer = createBuffer(10, 10);
    
    const component = createComponent({
      name: 'Button',
      description: 'A button component',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 10,
      height: 3,
      tags: ['button', 'ui', 'interactive']
    });
    
    expect(component.tags).toEqual(['button', 'ui', 'interactive']);
  });
});

describe('createSlot', () => {
  it('creates a slot with all properties', () => {
    const slot = createSlot('body', 2, 2, 10, 5, 'Content here');
    
    expect(slot.name).toBe('body');
    expect(slot.x).toBe(2);
    expect(slot.y).toBe(2);
    expect(slot.width).toBe(10);
    expect(slot.height).toBe(5);
    expect(slot.default).toBe('Content here');
  });
  
  it('creates a slot with empty default text', () => {
    const slot = createSlot('icon', 1, 1, 2, 2);
    
    expect(slot.default).toBe('');
  });
});

describe('createDefaultCharacterSet', () => {
  it('creates a character set with all box styles', () => {
    const charset = createDefaultCharacterSet();
    
    expect(charset.boxLight.tl).toBe('┌');
    expect(charset.boxHeavy.tl).toBe('┏');
    expect(charset.boxDouble.tl).toBe('╔');
    expect(charset.boxRound.tl).toBe('╭');
  });
  
  it('includes connector characters', () => {
    const charset = createDefaultCharacterSet();
    
    expect(charset.connectors.left).toBe('├');
    expect(charset.connectors.right).toBe('┤');
    expect(charset.connectors.cross).toBe('┼');
  });
  
  it('includes arrow characters', () => {
    const charset = createDefaultCharacterSet();
    
    expect(charset.arrows.left).toBe('←');
    expect(charset.arrows.right).toBe('→');
    expect(charset.arrows.upFilled).toBe('▲');
  });
  
  it('includes fill characters', () => {
    const charset = createDefaultCharacterSet();
    
    expect(charset.fills).toEqual([' ', '░', '▒', '▓', '█']);
  });
});

describe('createDesignSystem', () => {
  it('creates a design system with basic properties', () => {
    const ds = createDesignSystem('My Design System', 'A test design system');
    
    expect(ds.name).toBe('My Design System');
    expect(ds.description).toBe('A test design system');
    expect(ds.version).toBe('1.0.0');
    expect(ds.components).toEqual([]);
    expect(ds.id).toMatch(/^ds_/);
    expect(ds.createdAt).toBeGreaterThan(0);
    expect(ds.updatedAt).toBe(ds.createdAt);
  });
  
  it('creates a design system with custom version', () => {
    const ds = createDesignSystem('My DS', 'Test', '2.5.0');
    
    expect(ds.version).toBe('2.5.0');
  });
  
  it('includes a default character set', () => {
    const ds = createDesignSystem('My DS', 'Test');
    
    expect(ds.charset.boxLight.tl).toBe('┌');
    expect(ds.charset.fills).toHaveLength(5);
  });
});

describe('addComponentToDesignSystem', () => {
  it('adds a component to the design system', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    const component = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    const updatedDs = addComponentToDesignSystem(ds, component);
    
    expect(updatedDs.components).toHaveLength(1);
    expect(updatedDs.components[0].name).toBe('Button');
    expect(updatedDs.updatedAt).toBeGreaterThanOrEqual(ds.createdAt);
  });
  
  it('preserves existing components', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const comp1 = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    const comp2 = createComponent({
      name: 'Card',
      description: 'A card',
      role: 'container',
      buffer,
      x: 0,
      y: 0,
      width: 10,
      height: 10
    });
    
    let updatedDs = addComponentToDesignSystem(ds, comp1);
    updatedDs = addComponentToDesignSystem(updatedDs, comp2);
    
    expect(updatedDs.components).toHaveLength(2);
    expect(updatedDs.components[0].name).toBe('Button');
    expect(updatedDs.components[1].name).toBe('Card');
  });
});

describe('removeComponentFromDesignSystem', () => {
  it('removes a component by ID', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const component = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    let updatedDs = addComponentToDesignSystem(ds, component);
    updatedDs = removeComponentFromDesignSystem(updatedDs, component.id);
    
    expect(updatedDs.components).toHaveLength(0);
  });
  
  it('does not affect other components', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const comp1 = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    const comp2 = createComponent({
      name: 'Card',
      description: 'A card',
      role: 'container',
      buffer,
      x: 0,
      y: 0,
      width: 10,
      height: 10
    });
    
    let updatedDs = addComponentToDesignSystem(ds, comp1);
    updatedDs = addComponentToDesignSystem(updatedDs, comp2);
    updatedDs = removeComponentFromDesignSystem(updatedDs, comp1.id);
    
    expect(updatedDs.components).toHaveLength(1);
    expect(updatedDs.components[0].name).toBe('Card');
  });
});

describe('findComponent', () => {
  it('finds a component by ID', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const component = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    const updatedDs = addComponentToDesignSystem(ds, component);
    const found = findComponent(updatedDs, component.id);
    
    expect(found).toBeDefined();
    expect(found?.name).toBe('Button');
  });
  
  it('returns undefined for non-existent ID', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const found = findComponent(ds, 'non-existent-id');
    
    expect(found).toBeUndefined();
  });
});

describe('updateComponent', () => {
  it('updates a component in the design system', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const component = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    let updatedDs = addComponentToDesignSystem(ds, component);
    updatedDs = updateComponent(updatedDs, component.id, {
      name: 'Primary Button',
      description: 'A primary button'
    });
    
    const found = findComponent(updatedDs, component.id);
    expect(found?.name).toBe('Primary Button');
    expect(found?.description).toBe('A primary button');
    expect(found?.role).toBe('input'); // Unchanged
  });
  
  it('does not affect other components', () => {
    const ds = createDesignSystem('My DS', 'Test');
    const buffer = createBuffer(10, 10);
    
    const comp1 = createComponent({
      name: 'Button',
      description: 'A button',
      role: 'input',
      buffer,
      x: 0,
      y: 0,
      width: 5,
      height: 3
    });
    
    const comp2 = createComponent({
      name: 'Card',
      description: 'A card',
      role: 'container',
      buffer,
      x: 0,
      y: 0,
      width: 10,
      height: 10
    });
    
    let updatedDs = addComponentToDesignSystem(ds, comp1);
    updatedDs = addComponentToDesignSystem(updatedDs, comp2);
    updatedDs = updateComponent(updatedDs, comp1.id, { name: 'Updated Button' });
    
    const foundComp1 = findComponent(updatedDs, comp1.id);
    const foundComp2 = findComponent(updatedDs, comp2.id);
    
    expect(foundComp1?.name).toBe('Updated Button');
    expect(foundComp2?.name).toBe('Card'); // Unchanged
  });
});
