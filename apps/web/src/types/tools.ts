/**
 * Tool Types — F010: Select Tool
 *
 * Defines tool types and interfaces for the canvas interaction system.
 */

export type ToolType = 
  | 'select'    // Marquee/rectangle selection (M)
  | 'move'      // Move selection or elements (V)
  | 'pen'       // Drawing/brush tool (B)
  | 'text'      // Text tool (T)
  | 'line'      // Line drawing tool (L)
  | 'rectangle' // Rectangle shape tool (U)
  | 'box'       // Alias for rectangle
  | 'ellipse'   // Ellipse/circle tool
  | 'arrow'     // Arrow/connector tool
  | 'fill'      // Fill tool (G)
  | 'eraser'    // Erase tool (E)
  | 'pan';      // Pan/hand tool (Space)

export interface Tool {
  type: ToolType;
  name: string;
  description: string;
  icon: string;
  cursor: string;
  shortcut: string;
}

export const TOOLS: Record<ToolType, Tool> = {
  // Photoshop-style shortcuts
  move: {
    type: 'move',
    name: 'Move',
    description: 'Move selection or components',
    icon: '✥', // Move icon
    cursor: 'move',
    shortcut: 'v',
  },
  select: {
    type: 'select',
    name: 'Marquee',
    description: 'Rectangle selection tool',
    icon: '⬚', // Dotted rectangle icon
    cursor: 'crosshair',
    shortcut: 'm',
  },
  pen: {
    type: 'pen',
    name: 'Brush',
    description: 'Draw characters',
    icon: '✎', // Pen icon
    cursor: 'crosshair',
    shortcut: 'b',
  },
  text: {
    type: 'text',
    name: 'Text',
    description: 'Add text to canvas',
    icon: 'T',
    cursor: 'text',
    shortcut: 't',
  },
  line: {
    type: 'line',
    name: 'Line',
    description: 'Draw lines',
    icon: '╱', // Line icon
    cursor: 'crosshair',
    shortcut: 'l',
  },
  rectangle: {
    type: 'rectangle',
    name: 'Rectangle',
    description: 'Draw rectangles and boxes',
    icon: '▭', // Rectangle icon
    cursor: 'crosshair',
    shortcut: 'u',
  },
  ellipse: {
    type: 'ellipse',
    name: 'Ellipse',
    description: 'Draw circles and ellipses',
    icon: '○', // Circle icon
    cursor: 'crosshair',
    shortcut: 'o',
  },
  arrow: {
    type: 'arrow',
    name: 'Arrow',
    description: 'Draw arrows and connectors',
    icon: '→', // Arrow icon
    cursor: 'crosshair',
    shortcut: 'a',
  },
  eraser: {
    type: 'eraser',
    name: 'Eraser',
    description: 'Erase characters',
    icon: '⌫', // Erase icon
    cursor: 'not-allowed',
    shortcut: 'e',
  },
  fill: {
    type: 'fill',
    name: 'Fill',
    description: 'Flood fill area',
    icon: '🪣',
    cursor: 'crosshair',
    shortcut: 'g',
  },
  pan: {
    type: 'pan',
    name: 'Pan',
    description: 'Pan canvas (hold Space)',
    icon: '✋', // Hand icon
    cursor: 'grab',
    shortcut: 'space',
  },
  // Alias
  box: {
    type: 'box',
    name: 'Box',
    description: 'Draw boxes',
    icon: '▭',
    cursor: 'crosshair',
    shortcut: 'u',
  },
};
