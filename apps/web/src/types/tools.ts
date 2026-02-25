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
  select: {
    type: 'select',
    name: 'Select',
    description: 'Select and move components',
    icon: '⌖', // Crosshair/target icon
    cursor: 'default',
    shortcut: '1',
  },
  pen: {
    type: 'pen',
    name: 'Pen',
    description: 'Draw text and characters',
    icon: '✎', // Pen icon
    cursor: 'text',
    shortcut: '2',
  },
  line: {
    type: 'line',
    name: 'Line',
    description: 'Draw lines',
    icon: '╱', // Line icon
    cursor: 'crosshair',
    shortcut: '3',
  },
  rectangle: {
    type: 'rectangle',
    name: 'Rectangle',
    description: 'Draw rectangles and boxes',
    icon: '▭', // Rectangle icon
    cursor: 'crosshair',
    shortcut: '4',
  },
  ellipse: {
    type: 'ellipse',
    name: 'Ellipse',
    description: 'Draw circles and ellipses',
    icon: '○', // Circle icon
    cursor: 'crosshair',
    shortcut: '5',
  },
  arrow: {
    type: 'arrow',
    name: 'Arrow',
    description: 'Draw arrows and connectors between boxes',
    icon: '→', // Arrow icon
    cursor: 'crosshair',
    shortcut: '6',
  },
  eraser: {
    type: 'eraser',
    name: 'Eraser',
    description: 'Erase characters',
    icon: '⌫', // Erase icon
    cursor: 'not-allowed',
    shortcut: '7',
  },
  pan: {
    type: 'pan',
    name: 'Pan',
    description: 'Pan and navigate canvas',
    icon: '✋', // Hand icon
    cursor: 'grab',
    shortcut: 'space',
  },
  // Aliases and additional tools
  text: {
    type: 'text',
    name: 'Text',
    description: 'Add text to canvas',
    icon: 'T',
    cursor: 'text',
    shortcut: 't',
  },
  box: {
    type: 'box',
    name: 'Box',
    description: 'Draw boxes',
    icon: '▭',
    cursor: 'crosshair',
    shortcut: 'b',
  },
  fill: {
    type: 'fill',
    name: 'Fill',
    description: 'Fill area with color',
    icon: '🪣',
    cursor: 'crosshair',
    shortcut: 'f',
  },
};
