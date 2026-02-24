/**
 * Component creation and management
 */

import type { 
  Buffer, 
  Component, 
  ComponentRole, 
  Slot, 
  CharacterSet,
  BoxChars,
  ConnectorChars,
  ArrowChars,
  DesignSystem
} from './types.js';
import { createBuffer, getIndex } from './buffer.js';

/**
 * Extract a rectangular region from a buffer
 */
export function extractBuffer(
  source: Buffer,
  x: number,
  y: number,
  width: number,
  height: number
): Buffer {
  const result = createBuffer(width, height);
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const sourceRow = y + row;
      const sourceCol = x + col;
      
      // Skip if out of bounds
      if (sourceRow >= source.height || sourceCol >= source.width) {
        continue;
      }
      
      const sourceIndex = getIndex(source.width, sourceRow, sourceCol);
      const destIndex = getIndex(width, row, col);
      
      result.chars[destIndex] = source.chars[sourceIndex];
      result.fg[destIndex] = source.fg[sourceIndex];
      result.bg[destIndex] = source.bg[sourceIndex];
      result.flags[destIndex] = source.flags[sourceIndex];
    }
  }
  
  return result;
}

/**
 * Create a component from a buffer selection
 */
export function createComponent(params: {
  name: string;
  description: string;
  role: ComponentRole;
  buffer: Buffer;
  x: number;
  y: number;
  width: number;
  height: number;
  slots?: Slot[];
  resizable?: boolean;
  tags?: string[];
}): Component {
  const {
    name,
    description,
    role,
    buffer,
    x,
    y,
    width,
    height,
    slots = [],
    resizable = true,
    tags = []
  } = params;
  
  // Extract the template buffer from the selection
  const template = extractBuffer(buffer, x, y, width, height);
  
  // Generate unique ID
  const id = `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    name,
    description,
    role,
    minWidth: width,
    minHeight: height,
    resizable,
    template,
    slots,
    tags
  };
}

/**
 * Create a slot within a component
 */
export function createSlot(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  defaultText: string = ''
): Slot {
  return {
    name,
    x,
    y,
    width,
    height,
    default: defaultText
  };
}

/**
 * Default light box drawing characters
 */
const defaultBoxLight: BoxChars = {
  tl: '┌',
  tr: '┐',
  bl: '└',
  br: '┘',
  h: '─',
  v: '│'
};

/**
 * Default heavy box drawing characters
 */
const defaultBoxHeavy: BoxChars = {
  tl: '┏',
  tr: '┓',
  bl: '┗',
  br: '┛',
  h: '━',
  v: '┃'
};

/**
 * Default double box drawing characters
 */
const defaultBoxDouble: BoxChars = {
  tl: '╔',
  tr: '╗',
  bl: '╚',
  br: '╝',
  h: '═',
  v: '║'
};

/**
 * Default round box drawing characters
 */
const defaultBoxRound: BoxChars = {
  tl: '╭',
  tr: '╮',
  bl: '╰',
  br: '╯',
  h: '─',
  v: '│'
};

/**
 * Default connector characters
 */
const defaultConnectors: ConnectorChars = {
  left: '├',
  right: '┤',
  top: '┬',
  bottom: '┴',
  cross: '┼'
};

/**
 * Default arrow characters
 */
const defaultArrows: ArrowChars = {
  left: '←',
  right: '→',
  up: '↑',
  down: '↓',
  leftFilled: '◀',
  rightFilled: '▶',
  upFilled: '▲',
  downFilled: '▼'
};

/**
 * Create a default character set
 */
export function createDefaultCharacterSet(): CharacterSet {
  return {
    boxLight: defaultBoxLight,
    boxHeavy: defaultBoxHeavy,
    boxDouble: defaultBoxDouble,
    boxRound: defaultBoxRound,
    connectors: defaultConnectors,
    arrows: defaultArrows,
    fills: [' ', '░', '▒', '▓', '█']
  };
}

/**
 * Create a new design system
 */
export function createDesignSystem(
  name: string,
  description: string,
  version: string = '1.0.0'
): DesignSystem {
  const id = `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();
  
  return {
    id,
    name,
    description,
    version,
    charset: createDefaultCharacterSet(),
    components: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Add a component to a design system
 */
export function addComponentToDesignSystem(
  designSystem: DesignSystem,
  component: Component
): DesignSystem {
  return {
    ...designSystem,
    components: [...designSystem.components, component],
    updatedAt: Date.now()
  };
}

/**
 * Remove a component from a design system by ID
 */
export function removeComponentFromDesignSystem(
  designSystem: DesignSystem,
  componentId: string
): DesignSystem {
  return {
    ...designSystem,
    components: designSystem.components.filter(c => c.id !== componentId),
    updatedAt: Date.now()
  };
}

/**
 * Find a component in a design system by ID
 */
export function findComponent(
  designSystem: DesignSystem,
  componentId: string
): Component | undefined {
  return designSystem.components.find(c => c.id === componentId);
}

/**
 * Update a component in a design system
 */
export function updateComponent(
  designSystem: DesignSystem,
  componentId: string,
  updates: Partial<Component>
): DesignSystem {
  return {
    ...designSystem,
    components: designSystem.components.map(c =>
      c.id === componentId ? { ...c, ...updates } : c
    ),
    updatedAt: Date.now()
  };
}
