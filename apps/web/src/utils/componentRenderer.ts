/**
 * Component Renderer — F021: Place Components on Canvas
 * 
 * Utilities for rendering component definitions into character grids.
 * Converts CanvasElement-based components into displayable ASCII art.
 */

import type { ComponentDefinition, CanvasElement } from '@/types/component';

/**
 * Box drawing characters for different charsets
 */
const BOX_CHARS = {
  light: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    teeUp: '┴',
    teeDown: '┬',
    teeLeft: '┤',
    teeRight: '├',
  },
  heavy: {
    horizontal: '━',
    vertical: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    cross: '╋',
    teeUp: '┻',
    teeDown: '┳',
    teeLeft: '┫',
    teeRight: '┣',
  },
  double: {
    horizontal: '═',
    vertical: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    cross: '╬',
    teeUp: '╩',
    teeDown: '╦',
    teeLeft: '╣',
    teeRight: '╠',
  },
  round: {
    horizontal: '─',
    vertical: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    cross: '┼',
    teeUp: '┴',
    teeDown: '┬',
    teeLeft: '┤',
    teeRight: '├',
  },
};

/**
 * Render a box element into the grid
 */
function renderBox(
  grid: string[][],
  element: CanvasElement,
  offsetX: number,
  offsetY: number,
): void {
  if (element.type !== 'box') return;
  
  const { x, y, width, height, data } = element;
  const boxData = data as { charset: 'light' | 'heavy' | 'double' | 'round'; fill?: string };
  const chars = BOX_CHARS[boxData.charset];
  
  const absX = x + offsetX;
  const absY = y + offsetY;

  // Draw corners
  setCell(grid, absY, absX, chars.topLeft);
  setCell(grid, absY, absX + width - 1, chars.topRight);
  setCell(grid, absY + height - 1, absX, chars.bottomLeft);
  setCell(grid, absY + height - 1, absX + width - 1, chars.bottomRight);

  // Draw horizontal edges
  for (let col = absX + 1; col < absX + width - 1; col++) {
    setCell(grid, absY, col, chars.horizontal);
    setCell(grid, absY + height - 1, col, chars.horizontal);
  }

  // Draw vertical edges and fill
  for (let row = absY + 1; row < absY + height - 1; row++) {
    setCell(grid, row, absX, chars.vertical);
    setCell(grid, row, absX + width - 1, chars.vertical);
    
    // Fill interior if specified
    if (boxData.fill) {
      for (let col = absX + 1; col < absX + width - 1; col++) {
        setCell(grid, row, col, boxData.fill);
      }
    }
  }
}

/**
 * Render a line element into the grid
 */
function renderLine(
  grid: string[][],
  element: CanvasElement,
  offsetX: number,
  offsetY: number,
): void {
  if (element.type !== 'line') return;
  
  const { x, y, data } = element;
  const lineData = data as { endX: number; endY: number; charset: 'light' | 'heavy' | 'double' | 'round' };
  const chars = BOX_CHARS[lineData.charset];
  
  const x1 = x + offsetX;
  const y1 = y + offsetY;
  const x2 = lineData.endX + offsetX;
  const y2 = lineData.endY + offsetY;

  // Simple line drawing (horizontal, vertical, or diagonal)
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  
  let currentX = x1;
  let currentY = y1;
  
  while (currentX !== x2 || currentY !== y2) {
    // Determine character based on direction
    let char = chars.horizontal;
    if (dx === 0) {
      char = chars.vertical;
    } else if (dy === 0) {
      char = chars.horizontal;
    } else {
      // Diagonal - use + or x
      char = '+';
    }
    
    setCell(grid, currentY, currentX, char);
    
    if (currentX !== x2) currentX += dx;
    if (currentY !== y2) currentY += dy;
  }
  
  // Draw final point
  setCell(grid, y2, x2, dx === 0 ? chars.vertical : chars.horizontal);
}

/**
 * Render a text element into the grid
 */
function renderText(
  grid: string[][],
  element: CanvasElement,
  offsetX: number,
  offsetY: number,
): void {
  if (element.type !== 'text') return;
  
  const { x, y, width, height, data } = element;
  const textData = data as { content: string; wrap: boolean };
  
  const absX = x + offsetX;
  const absY = y + offsetY;
  
  if (textData.wrap) {
    // Wrap text within bounds
    const words = textData.content.split(' ');
    let currentRow = absY;
    let currentCol = absX;
    
    for (const word of words) {
      // Check if word fits on current line
      if (currentCol + word.length > absX + width) {
        currentRow++;
        currentCol = absX;
      }
      
      if (currentRow >= absY + height) break;
      
      // Write word
      for (let i = 0; i < word.length; i++) {
        if (currentCol >= absX + width) break;
        setCell(grid, currentRow, currentCol, word[i]);
        currentCol++;
      }
      
      // Add space
      currentCol++;
    }
  } else {
    // No wrapping - just write content left to right
    let col = absX;
    for (const char of textData.content) {
      if (col >= absX + width) break;
      setCell(grid, absY, col, char);
      col++;
    }
  }
}

/**
 * Set a cell in the grid if within bounds
 */
function setCell(grid: string[][], row: number, col: number, char: string): void {
  if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
    grid[row][col] = char;
  }
}

/**
 * Render a complete component into a character grid
 */
export function renderComponentToGrid(
  grid: string[][],
  component: ComponentDefinition,
  offsetX: number,
  offsetY: number,
): void {
  // If component has charGrid, use that (simpler char-based component)
  if (component.charGrid && component.charGrid.length > 0) {
    for (let row = 0; row < component.charGrid.length; row++) {
      for (let col = 0; col < component.charGrid[row].length; col++) {
        const char = component.charGrid[row][col];
        if (char && char !== ' ') {
          setCell(grid, row + offsetY, col + offsetX, char);
        }
      }
    }
    return;
  }

  // Otherwise render each element in the component
  for (const element of component.elements) {
    switch (element.type) {
      case 'box':
        renderBox(grid, element, offsetX, offsetY);
        break;
      case 'line':
        renderLine(grid, element, offsetX, offsetY);
        break;
      case 'text':
        renderText(grid, element, offsetX, offsetY);
        break;
      case 'component':
        // Nested components not yet supported
        break;
    }
  }
}

/**
 * Create a preview grid for a component (useful for thumbnails)
 */
export function createComponentPreview(component: ComponentDefinition): string[][] {
  // If charGrid exists, return it directly
  if (component.charGrid && component.charGrid.length > 0) {
    return component.charGrid;
  }

  const { boundingBox } = component;
  const grid: string[][] = Array.from({ length: boundingBox.height }, () =>
    Array(boundingBox.width).fill(' ')
  );
  
  renderComponentToGrid(grid, component, 0, 0);
  
  return grid;
}

/**
 * Convert a grid to a string representation (for debugging or display)
 */
export function gridToString(grid: string[][]): string {
  return grid.map((row) => row.join('')).join('\n');
}
