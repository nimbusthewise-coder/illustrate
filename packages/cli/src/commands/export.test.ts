/**
 * Tests for F062: Pipe ASCII to stdout
 * Tests for F042: Markdown code block export
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { CanvasDocument } from '@illustrate.md/core';
import { createBuffer, setChar } from '@illustrate.md/core';

const execFileAsync = promisify(execFile);

describe('F062: Export command', () => {
  const testDir = resolve(__dirname, '../../test-output');
  const testFile = resolve(testDir, 'test-diagram.illustrate');
  
  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });
  
  afterEach(async () => {
    // Clean up test file
    try {
      await unlink(testFile);
    } catch {
      // Ignore if file doesn't exist
    }
  });
  
  it('should export a simple diagram to stdout', async () => {
    // Create a simple test document
    const buffer = createBuffer(10, 5);
    
    const document: CanvasDocument = {
      id: 'test-diagram',
      title: 'Test Diagram',
      width: 10,
      height: 5,
      layers: [{
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Write test document to file
    await writeFile(testFile, JSON.stringify(document, null, 2));
    
    // Note: This test would need the CLI to be built first
    // For now, we'll test the function directly
    const { exportCommand } = await import('./export.js');
    
    // Capture stdout
    let output = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: any) => {
      output += chunk;
      return true;
    }) as any;
    
    // Mock process.exit to prevent test from exiting
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
    }) as any;
    
    try {
      await exportCommand('test-diagram', { file: testFile });
      
      // Verify output exists
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
      expect(exitCode).toBe(0);
    } finally {
      // Restore stdout and exit
      process.stdout.write = originalWrite;
      process.exit = originalExit;
    }
  });
  
  it('should handle missing diagram gracefully', async () => {
    const { exportCommand } = await import('./export.js');
    
    // Capture stderr
    let errorOutput = '';
    const originalWrite = process.stderr.write;
    process.stderr.write = ((chunk: any) => {
      errorOutput += chunk;
      return true;
    }) as any;
    
    // Mock process.exit
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
    }) as any;
    
    try {
      await exportCommand('nonexistent', {});
      
      // Verify error was written to stderr
      expect(errorOutput).toContain('Error');
      expect(exitCode).toBe(1);
    } finally {
      // Restore stderr and exit
      process.stderr.write = originalWrite;
      process.exit = originalExit;
    }
  });

  it('should export as markdown with language hint', async () => {
    const buffer = createBuffer(5, 2);
    setChar(buffer, 0, 0, 'H');
    setChar(buffer, 0, 1, 'i');
    setChar(buffer, 1, 0, 'O');
    setChar(buffer, 1, 1, 'K');
    
    // Serialize buffer to plain object for JSON
    const serializedBuffer = {
      width: buffer.width,
      height: buffer.height,
      chars: Array.from(buffer.chars),
      fg: Array.from(buffer.fg),
      bg: Array.from(buffer.bg),
      flags: Array.from(buffer.flags)
    };
    
    const document: CanvasDocument = {
      id: 'test-markdown',
      title: 'Test Markdown',
      width: 5,
      height: 2,
      layers: [{
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: serializedBuffer as any
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await writeFile(testFile, JSON.stringify(document, null, 2));
    
    const { exportCommand } = await import('./export.js');
    
    let output = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: any) => {
      output += chunk;
      return true;
    }) as any;
    
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
    }) as any;
    
    try {
      await exportCommand('test-markdown', { 
        file: testFile,
        format: 'markdown',
        lang: 'ascii'
      });
      
      expect(output).toContain('```ascii');
      expect(output).toContain('Hi');
      expect(output).toContain('OK');
      expect(output).toContain('```');
      expect(exitCode).toBe(0);
    } finally {
      process.stdout.write = originalWrite;
      process.exit = originalExit;
    }
  });

  it('should export markdown with title and metadata', async () => {
    const buffer = createBuffer(3, 1);
    setChar(buffer, 0, 0, 'A');
    setChar(buffer, 0, 1, 'B');
    setChar(buffer, 0, 2, 'C');
    
    // Serialize buffer to plain object for JSON
    const serializedBuffer = {
      width: buffer.width,
      height: buffer.height,
      chars: Array.from(buffer.chars),
      fg: Array.from(buffer.fg),
      bg: Array.from(buffer.bg),
      flags: Array.from(buffer.flags)
    };
    
    const document: CanvasDocument = {
      id: 'test-md-full',
      title: 'Test Full',
      width: 3,
      height: 1,
      layers: [{
        id: 'layer1',
        name: 'Layer 1',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: serializedBuffer as any
      }],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    await writeFile(testFile, JSON.stringify(document, null, 2));
    
    const { exportCommand } = await import('./export.js');
    
    let output = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = ((chunk: any) => {
      output += chunk;
      return true;
    }) as any;
    
    const originalExit = process.exit;
    let exitCode: number | undefined;
    process.exit = ((code?: number) => {
      exitCode = code;
    }) as any;
    
    try {
      await exportCommand('test-md-full', { 
        file: testFile,
        format: 'markdown',
        lang: 'text',
        title: 'Example Diagram',
        headingLevel: 2,
        metadata: true
      });
      
      expect(output).toContain('## Example Diagram');
      expect(output).toContain('<!-- Canvas: 3×1 | Layers: 1 -->');
      expect(output).toContain('```text');
      expect(output).toContain('ABC');
      expect(exitCode).toBe(0);
    } finally {
      process.stdout.write = originalWrite;
      process.exit = originalExit;
    }
  });
});
