/**
 * Demo for F054 - Render diagram in terminal
 * 
 * This creates a sample diagram to demonstrate the terminal rendering
 */

import { createBuffer, setChar, rgbaToUint32 } from '@illustrate.md/core';
import type { CanvasDocument, Layer } from '@illustrate.md/core';
import { renderDocumentWithFrame, ColorLevel } from './renderer.js';

/**
 * Create a demo wireframe document
 */
export function createDemoDocument(): CanvasDocument {
  // Create a buffer for a simple wireframe
  const width = 50;
  const height = 20;
  const buffer = createBuffer(width, height);
  
  // Draw a box for the main container
  // Top border
  setChar(buffer, 0, 0, '┌');
  for (let i = 1; i < width - 1; i++) {
    setChar(buffer, 0, i, '─');
  }
  setChar(buffer, 0, width - 1, '┐');
  
  // Side borders
  for (let i = 1; i < height - 1; i++) {
    setChar(buffer, i, 0, '│');
    setChar(buffer, i, width - 1, '│');
  }
  
  // Bottom border
  setChar(buffer, height - 1, 0, '└');
  for (let i = 1; i < width - 1; i++) {
    setChar(buffer, height - 1, i, '─');
  }
  setChar(buffer, height - 1, width - 1, '┘');
  
  // Add a title
  const title = 'Dashboard Wireframe';
  const titleStart = Math.floor((width - title.length) / 2);
  for (let i = 0; i < title.length; i++) {
    setChar(buffer, 2, titleStart + i, title.charCodeAt(i));
  }
  
  // Add a horizontal divider
  setChar(buffer, 4, 0, '├');
  for (let i = 1; i < width - 1; i++) {
    setChar(buffer, 4, i, '─');
  }
  setChar(buffer, 4, width - 1, '┤');
  
  // Add some content boxes
  // Box 1 (top left)
  const box1 = { x: 3, y: 6, w: 20, h: 5 };
  drawBox(buffer, box1.y, box1.x, box1.w, box1.h, 'User Stats');
  
  // Box 2 (top right)
  const box2 = { x: 26, y: 6, w: 20, h: 5 };
  drawBox(buffer, box2.y, box2.x, box2.w, box2.h, 'Activity Feed');
  
  // Box 3 (bottom)
  const box3 = { x: 3, y: 13, w: 43, h: 5 };
  drawBox(buffer, box3.y, box3.x, box3.w, box3.h, 'Recent Items');
  
  // Create layer
  const layer: Layer = {
    id: 'main',
    name: 'Main Layer',
    parentId: null,
    visible: true,
    locked: false,
    x: 0,
    y: 0,
    buffer
  };
  
  // Create document
  const document: CanvasDocument = {
    id: 'demo-wireframe',
    title: 'Demo Wireframe',
    width,
    height,
    layers: [layer],
    designSystem: null,
    tags: ['demo', 'wireframe'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  return document;
}

/**
 * Helper to draw a box with title
 */
function drawBox(buffer: any, row: number, col: number, width: number, height: number, title: string) {
  // Top border
  setChar(buffer, row, col, '┌');
  for (let i = 1; i < width - 1; i++) {
    setChar(buffer, row, col + i, '─');
  }
  setChar(buffer, row, col + width - 1, '┐');
  
  // Side borders
  for (let i = 1; i < height - 1; i++) {
    setChar(buffer, row + i, col, '│');
    setChar(buffer, row + i, col + width - 1, '│');
  }
  
  // Bottom border
  setChar(buffer, row + height - 1, col, '└');
  for (let i = 1; i < width - 1; i++) {
    setChar(buffer, row + height - 1, col + i, '─');
  }
  setChar(buffer, row + height - 1, col + width - 1, '┘');
  
  // Title
  const titleStart = Math.max(0, Math.floor((width - title.length) / 2) - 1);
  for (let i = 0; i < title.length && titleStart + i < width - 2; i++) {
    setChar(buffer, row + 1, col + titleStart + i + 1, title.charCodeAt(i));
  }
}

/**
 * Demo the terminal renderer
 */
export function runDemo() {
  console.log('\n=== illustrate.md Terminal Renderer Demo (F054) ===\n');
  
  const document = createDemoDocument();
  
  // Render with different color levels
  console.log('--- No Color (Fallback) ---');
  console.log(renderDocumentWithFrame(document, true, ColorLevel.None));
  
  console.log('\n--- With Colors (Auto-detected) ---');
  console.log(renderDocumentWithFrame(document, true));
  
  console.log('\n--- Without Frame ---');
  console.log(renderDocumentWithFrame(document, false));
  
  console.log('\n=== Demo Complete ===\n');
}

// Run demo if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo();
}
