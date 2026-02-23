/**
 * Demo script for F063: Local .illustrate file operations
 * 
 * Creates a sample .illustrate file and demonstrates:
 * - Saving a document to a local file
 * - Opening and rendering a local file
 */

import { writeFile } from 'fs/promises';
import type { CanvasDocument } from '@illustrate.md/core';

/**
 * Create a sample wireframe document
 */
function createSampleDocument(): any {
  const width = 60;
  const height = 20;
  const size = width * height;
  
  // Initialize buffers
  const chars = new Array(size).fill(32); // Space character
  const fg = new Array(size).fill(0xFFFFFFFF); // White foreground
  const bg = new Array(size).fill(0x00000000); // Transparent background
  const flags = new Array(size).fill(0);
  
  // Helper to set character at position
  const setChar = (x: number, y: number, charCode: number) => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      chars[y * width + x] = charCode;
    }
  };
  
  // Draw a box (using box-drawing characters)
  const drawBox = (x: number, y: number, w: number, h: number) => {
    // Top-left corner: ┌
    setChar(x, y, 0x250C);
    // Top-right corner: ┐
    setChar(x + w - 1, y, 0x2510);
    // Bottom-left corner: └
    setChar(x, y + h - 1, 0x2514);
    // Bottom-right corner: ┘
    setChar(x + w - 1, y + h - 1, 0x2518);
    
    // Horizontal lines: ─
    for (let i = 1; i < w - 1; i++) {
      setChar(x + i, y, 0x2500);
      setChar(x + i, y + h - 1, 0x2500);
    }
    
    // Vertical lines: │
    for (let i = 1; i < h - 1; i++) {
      setChar(x, y + i, 0x2502);
      setChar(x + w - 1, y + i, 0x2502);
    }
  };
  
  // Draw text
  const drawText = (x: number, y: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      setChar(x + i, y, text.charCodeAt(i));
    }
  };
  
  // Create a sample dashboard layout
  drawBox(0, 0, width, height);
  drawText(2, 0, '[ Local File Demo ]');
  
  // Title
  drawText(20, 2, 'illustrate.md');
  drawText(17, 3, 'Local File Operations');
  
  // Draw three panels
  drawBox(2, 5, 18, 8);
  drawText(4, 6, 'User Profile');
  drawText(4, 8, 'Status: Active');
  
  drawBox(22, 5, 18, 8);
  drawText(24, 6, 'Recent Items');
  drawText(24, 8, '• Document 1');
  drawText(24, 9, '• Document 2');
  
  drawBox(42, 5, 16, 8);
  drawText(44, 6, 'Quick Stats');
  drawText(44, 8, 'Files: 42');
  drawText(44, 9, 'Layers: 127');
  
  // Bottom info
  drawText(2, height - 2, 'Saved to: example.illustrate');
  
  return {
    version: '1',
    document: {
      id: 'demo-local-file',
      title: 'Local File Demo',
      width,
      height,
      designSystem: null,
      tags: ['demo', 'local', 'f063'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      layers: [
        {
          id: 'layer-1',
          name: 'Main Layout',
          parentId: null,
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          buffer: {
            width,
            height,
            chars,
            fg,
            bg,
            flags,
          },
        },
      ],
    },
  };
}

/**
 * Main demo function
 */
async function main() {
  console.log('Creating sample .illustrate file...\n');
  
  // Create sample document
  const fileData = createSampleDocument();
  
  // Save to file
  const filename = 'example.illustrate';
  const json = JSON.stringify(fileData, null, 2);
  await writeFile(filename, json, 'utf-8');
  
  console.log(`✓ Created ${filename}\n`);
  console.log('File structure:');
  console.log('  version: "1"');
  console.log('  document:');
  console.log(`    id: ${fileData.document.id}`);
  console.log(`    title: ${fileData.document.title}`);
  console.log(`    dimensions: ${fileData.document.width}x${fileData.document.height}`);
  console.log(`    layers: ${fileData.document.layers.length}`);
  console.log(`    tags: [${fileData.document.tags.join(', ')}]`);
  console.log('\nTo view this file, run:');
  console.log(`  illustrate open ${filename}`);
  console.log('\nTo save a remote diagram locally:');
  console.log('  illustrate save {id} --out my-diagram.illustrate');
}

main().catch(console.error);
