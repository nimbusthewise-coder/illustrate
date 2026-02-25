/**
 * Flow Generator Service
 * F026: Prompt-to-Flow Generation
 * 
 * Converts flow specifications into canvas layers and elements.
 */

import type { Layer as CoreLayer, Buffer as CoreBuffer } from '@illustrate.md/core';
import type { Layer as WebLayer, Buffer as WebBuffer } from '@/lib/types';
import type { 
  FlowSpecification, 
  ComponentSpec, 
  ConnectionSpec,
  GeneratedFlow 
} from '@/types/prompt';
import { createBuffer, setChar, getChar } from '@illustrate.md/core';

/**
 * Generate a unique ID for layers
 */
let layerIdCounter = 0;
function generateLayerId(): string {
  return `layer_gen_${Date.now()}_${layerIdCounter++}`;
}

/**
 * Create an empty buffer with given dimensions
 */
function createEmptyBuffer(width: number, height: number): CoreBuffer {
  return createBuffer(width, height);
}

/**
 * Convert core Buffer (typed arrays) to web Buffer (string arrays)
 */
function convertCoreBufferToWebBuffer(coreBuffer: CoreBuffer): WebBuffer {
  const size = coreBuffer.width * coreBuffer.height;
  const webBuffer: WebBuffer = {
    width: coreBuffer.width,
    height: coreBuffer.height,
    chars: new Array(size),
    fg: new Array(size),
    bg: new Array(size),
    flags: new Array(size),
  };

  // Convert chars from Uint16Array (char codes) to string array
  for (let i = 0; i < size; i++) {
    webBuffer.chars[i] = String.fromCharCode(coreBuffer.chars[i]);
  }

  // Convert colors from Uint32Array (RGBA) to hex strings
  for (let i = 0; i < size; i++) {
    const fgRgba = coreBuffer.fg[i];
    const bgRgba = coreBuffer.bg[i];
    
    // Extract RGBA components (stored as 0xRRGGBBAA)
    const fgR = (fgRgba >> 24) & 0xFF;
    const fgG = (fgRgba >> 16) & 0xFF;
    const fgB = (fgRgba >> 8) & 0xFF;
    const fgA = fgRgba & 0xFF;
    
    const bgR = (bgRgba >> 24) & 0xFF;
    const bgG = (bgRgba >> 16) & 0xFF;
    const bgB = (bgRgba >> 8) & 0xFF;
    const bgA = bgRgba & 0xFF;
    
    // Convert to hex (or transparent)
    webBuffer.fg[i] = fgA === 0 ? 'transparent' : `#${fgR.toString(16).padStart(2, '0')}${fgG.toString(16).padStart(2, '0')}${fgB.toString(16).padStart(2, '0')}`;
    webBuffer.bg[i] = bgA === 0 ? 'transparent' : `#${bgR.toString(16).padStart(2, '0')}${bgG.toString(16).padStart(2, '0')}${bgB.toString(16).padStart(2, '0')}`;
  }

  // Copy flags directly
  for (let i = 0; i < size; i++) {
    webBuffer.flags[i] = coreBuffer.flags[i];
  }

  return webBuffer;
}

/**
 * Convert core Layer to web Layer
 */
function convertCoreLayerToWebLayer(coreLayer: CoreLayer): WebLayer {
  return {
    id: coreLayer.id,
    name: coreLayer.name,
    parentId: coreLayer.parentId,
    visible: coreLayer.visible,
    locked: coreLayer.locked,
    x: coreLayer.x,
    y: coreLayer.y,
    buffer: convertCoreBufferToWebBuffer(coreLayer.buffer),
  };
}

/**
 * Draw a box on the buffer at the specified position
 */
function drawBox(
  buffer: CoreBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  charset: 'light' | 'heavy' | 'double' | 'round' = 'light'
): void {
  // Define box drawing characters for each charset
  const charsets = {
    light: {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
    },
    heavy: {
      topLeft: '┏',
      topRight: '┓',
      bottomLeft: '┗',
      bottomRight: '┛',
      horizontal: '━',
      vertical: '┃',
    },
    double: {
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝',
      horizontal: '═',
      vertical: '║',
    },
    round: {
      topLeft: '╭',
      topRight: '╮',
      bottomLeft: '╰',
      bottomRight: '╯',
      horizontal: '─',
      vertical: '│',
    },
  };

  const chars = charsets[charset];

  // Ensure coordinates are within bounds
  if (x < 0 || y < 0 || x + width > buffer.width || y + height > buffer.height) {
    return;
  }

  // Draw top edge
  for (let col = x; col < x + width; col++) {
    const char = col === x 
      ? chars.topLeft 
      : col === x + width - 1 
      ? chars.topRight 
      : chars.horizontal;
    setChar(buffer, y, col, char);
  }

  // Draw sides
  for (let row = y + 1; row < y + height - 1; row++) {
    setChar(buffer, row, x, chars.vertical);
    setChar(buffer, row, x + width - 1, chars.vertical);
  }

  // Draw bottom edge
  if (height > 1) {
    for (let col = x; col < x + width; col++) {
      const char = col === x 
        ? chars.bottomLeft 
        : col === x + width - 1 
        ? chars.bottomRight 
        : chars.horizontal;
      setChar(buffer, y + height - 1, col, char);
    }
  }
}

/**
 * Draw text on the buffer at the specified position
 */
function drawText(
  buffer: CoreBuffer,
  x: number,
  y: number,
  text: string,
  maxWidth?: number
): void {
  const lines = text.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const row = y + lineIdx;

    if (row >= buffer.height) break;

    const displayText = maxWidth ? line.slice(0, maxWidth) : line;

    for (let colIdx = 0; colIdx < displayText.length; colIdx++) {
      const col = x + colIdx;
      if (col >= buffer.width) break;

      setChar(buffer, row, col, displayText[colIdx]);
    }
  }
}

/**
 * Draw an arrow on the buffer from start to end
 */
function drawArrow(
  buffer: CoreBuffer,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  style: 'light' | 'heavy' | 'double' = 'light'
): void {
  const arrowChars = {
    light: { horizontal: '─', vertical: '│', arrowRight: '→', arrowDown: '↓' },
    heavy: { horizontal: '━', vertical: '┃', arrowRight: '⇒', arrowDown: '⇓' },
    double: { horizontal: '═', vertical: '║', arrowRight: '⇒', arrowDown: '⇓' },
  };

  const chars = arrowChars[style];

  // Simple Manhattan routing: horizontal first, then vertical
  // Horizontal segment
  const startX = Math.min(fromX, toX);
  const endX = Math.max(fromX, toX);
  
  for (let x = startX; x <= endX; x++) {
    if (fromY >= 0 && fromY < buffer.height && x >= 0 && x < buffer.width) {
      setChar(buffer, fromY, x, chars.horizontal);
    }
  }

  // Vertical segment
  const startY = Math.min(fromY, toY);
  const endY = Math.max(fromY, toY);
  
  for (let y = startY; y <= endY; y++) {
    if (y >= 0 && y < buffer.height && toX >= 0 && toX < buffer.width) {
      setChar(buffer, y, toX, chars.vertical);
    }
  }

  // Add arrowhead at destination
  if (toY >= 0 && toY < buffer.height && toX >= 0 && toX < buffer.width) {
    const arrowChar = toY > fromY ? chars.arrowDown : chars.arrowRight;
    setChar(buffer, toY, toX, arrowChar);
  }
}

/**
 * Calculate component positions based on layout hints
 */
interface ComponentPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function calculateLayout(
  components: ComponentSpec[],
  spec: FlowSpecification,
  canvasWidth: number,
  canvasHeight: number
): Map<string, ComponentPosition> {
  const positions = new Map<string, ComponentPosition>();
  const { direction, spacing, alignment } = spec.layout;

  let currentX = spacing;
  let currentY = spacing;
  let maxHeight = 0;
  let maxWidth = 0;

  for (const component of components) {
    const width = component.style?.width || 20;
    const height = component.style?.height || 5;

    // Check if we need to wrap to next row/column
    if (direction === 'horizontal' && currentX + width > canvasWidth - spacing) {
      currentX = spacing;
      currentY += maxHeight + spacing;
      maxHeight = 0;
    } else if (direction === 'vertical' && currentY + height > canvasHeight - spacing) {
      currentY = spacing;
      currentX += maxWidth + spacing;
      maxWidth = 0;
    }

    positions.set(component.id, {
      id: component.id,
      x: currentX,
      y: currentY,
      width,
      height,
    });

    // Update position for next component
    if (direction === 'horizontal' || direction === 'grid') {
      currentX += width + spacing;
      maxHeight = Math.max(maxHeight, height);
    } else {
      currentY += height + spacing;
      maxWidth = Math.max(maxWidth, width);
    }
  }

  return positions;
}

/**
 * Generate layers from flow specification
 */
function generateLayers(
  spec: FlowSpecification,
  positions: Map<string, ComponentPosition>,
  canvasWidth: number,
  canvasHeight: number
): CoreLayer[] {
  const layers: CoreLayer[] = [];

  // Create components layer
  const componentsBuffer = createEmptyBuffer(canvasWidth, canvasHeight);
  
  for (const component of spec.components) {
    const pos = positions.get(component.id);
    if (!pos) continue;

    if (component.type === 'box') {
      drawBox(
        componentsBuffer,
        pos.x,
        pos.y,
        pos.width,
        pos.height,
        component.style?.charset || 'light'
      );

      // Draw content inside box
      if (component.content) {
        const contentX = pos.x + 2;
        const contentY = pos.y + 1;
        const contentMaxWidth = pos.width - 4;
        drawText(componentsBuffer, contentX, contentY, component.content, contentMaxWidth);
      }

      // Draw component name at top of box
      if (component.name) {
        const nameX = pos.x + 2;
        const nameY = pos.y;
        drawText(componentsBuffer, nameX, nameY, ` ${component.name} `, pos.width - 4);
      }
    } else if (component.type === 'text') {
      drawText(
        componentsBuffer,
        pos.x,
        pos.y,
        component.content || component.name,
        pos.width
      );
    }
  }

  layers.push({
    id: generateLayerId(),
    name: spec.title || 'Generated Flow',
    parentId: null,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    buffer: componentsBuffer,
  });

  // Create connections layer
  if (spec.connections.length > 0) {
    const connectionsBuffer = createEmptyBuffer(canvasWidth, canvasHeight);

    for (const connection of spec.connections) {
      const fromPos = positions.get(connection.from);
      const toPos = positions.get(connection.to);

      if (!fromPos || !toPos) continue;

      // Calculate connection points (right edge of from, left edge of to)
      const fromX = fromPos.x + fromPos.width;
      const fromY = fromPos.y + Math.floor(fromPos.height / 2);
      const toX = toPos.x - 1;
      const toY = toPos.y + Math.floor(toPos.height / 2);

      drawArrow(
        connectionsBuffer,
        fromX,
        fromY,
        toX,
        toY,
        connection.style?.lineStyle || 'light'
      );

      // Draw connection label if present
      if (connection.label) {
        const midX = Math.floor((fromX + toX) / 2);
        const midY = Math.floor((fromY + toY) / 2);
        drawText(connectionsBuffer, midX, midY - 1, connection.label);
      }
    }

    layers.push({
      id: generateLayerId(),
      name: 'Connections',
      parentId: null,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      buffer: connectionsBuffer,
    });
  }

  return layers;
}

/**
 * Generate flow from specification
 * 
 * @param spec - Flow specification from LLM
 * @param canvasWidth - Canvas width in cells
 * @param canvasHeight - Canvas height in cells
 * @returns Generated flow with layers and metadata
 */
export function generateFlow(
  spec: FlowSpecification,
  canvasWidth: number,
  canvasHeight: number,
  promptId: string
): GeneratedFlow {
  // Calculate component positions
  const positions = calculateLayout(spec.components, spec, canvasWidth, canvasHeight);

  // Generate layers with drawn components and connections (using core types)
  const coreLayers = generateLayers(spec, positions, canvasWidth, canvasHeight);

  // Convert core layers to web layers
  const webLayers = coreLayers.map(convertCoreLayerToWebLayer);

  return {
    id: `flow_${Date.now()}`,
    promptId,
    specification: spec,
    layers: webLayers,
    components: [], // Empty for now, will be populated when component system is integrated
    createdAt: Date.now(),
    canvasWidth,
    canvasHeight,
  };
}

/**
 * Validate that generated flow fits within canvas bounds
 */
export function validateFlowBounds(
  flow: GeneratedFlow,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  return flow.canvasWidth <= canvasWidth && flow.canvasHeight <= canvasHeight;
}

/**
 * Estimate the number of components that can fit in the canvas
 */
export function estimateCapacity(
  canvasWidth: number,
  canvasHeight: number,
  avgComponentWidth: number = 20,
  avgComponentHeight: number = 5,
  spacing: number = 3
): number {
  const componentsPerRow = Math.floor(canvasWidth / (avgComponentWidth + spacing));
  const componentsPerCol = Math.floor(canvasHeight / (avgComponentHeight + spacing));
  return componentsPerRow * componentsPerCol;
}
