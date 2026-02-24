/**
 * F063: Local .illustrate File Operations - Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  createIllustrateFile,
  readIllustrateFile,
  findIllustrateFiles,
  validateFile,
  createEmptyDocument
} from '../utils/file-manager.js';

const TEST_DIR = join(process.cwd(), 'test-output', 'file-ops');

describe('File Operations', () => {
  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should create a new .illustrate file', async () => {
    const filePath = join(TEST_DIR, 'test.illustrate');
    const document = createEmptyDocument('test-id', 'Test Diagram', 80, 24);
    
    await createIllustrateFile(filePath, document, {
      author: 'Test Author',
      description: 'Test description'
    });
    
    expect(existsSync(filePath)).toBe(true);
    
    const file = await readIllustrateFile(filePath);
    expect(file.version).toBe('1.0');
    expect(file.metadata.author).toBe('Test Author');
    expect(file.metadata.description).toBe('Test description');
    expect(file.document.id).toBe('test-id');
    expect(file.document.title).toBe('Test Diagram');
    expect(file.document.width).toBe(80);
    expect(file.document.height).toBe(24);
  });

  it('should read an existing .illustrate file', async () => {
    const filePath = join(TEST_DIR, 'read-test.illustrate');
    const document = createEmptyDocument('read-id', 'Read Test', 40, 12);
    
    await createIllustrateFile(filePath, document);
    
    const file = await readIllustrateFile(filePath);
    expect(file.document.id).toBe('read-id');
    expect(file.document.width).toBe(40);
    expect(file.document.height).toBe(12);
  });

  it('should validate a correct file', async () => {
    const filePath = join(TEST_DIR, 'valid.illustrate');
    const document = createEmptyDocument('valid-id', 'Valid', 80, 24);
    
    await createIllustrateFile(filePath, document);
    
    const result = await validateFile(filePath);
    expect(result.exists).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect invalid file', async () => {
    const filePath = join(TEST_DIR, 'invalid.illustrate');
    await writeFile(filePath, '{ "invalid": "json" }', 'utf-8');
    
    const result = await validateFile(filePath);
    expect(result.exists).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should find .illustrate files in directory', async () => {
    // Create multiple files
    await createIllustrateFile(
      join(TEST_DIR, 'file1.illustrate'),
      createEmptyDocument('id1', 'File 1', 80, 24)
    );
    await createIllustrateFile(
      join(TEST_DIR, 'file2.illustrate'),
      createEmptyDocument('id2', 'File 2', 80, 24)
    );
    
    // Create a subdirectory with another file
    const subDir = join(TEST_DIR, 'subdir');
    await mkdir(subDir, { recursive: true });
    await createIllustrateFile(
      join(subDir, 'file3.illustrate'),
      createEmptyDocument('id3', 'File 3', 80, 24)
    );
    
    // Non-recursive search
    const files = await findIllustrateFiles(TEST_DIR, { recursive: false });
    expect(files.length).toBe(2);
    
    // Recursive search
    const allFiles = await findIllustrateFiles(TEST_DIR, { recursive: true });
    expect(allFiles.length).toBe(3);
  });

  it('should create empty document with correct structure', () => {
    const document = createEmptyDocument('test-id', 'Test', 40, 20);
    
    expect(document.id).toBe('test-id');
    expect(document.title).toBe('Test');
    expect(document.width).toBe(40);
    expect(document.height).toBe(20);
    expect(document.layers.length).toBe(1);
    expect(document.layers[0].name).toBe('Background');
    expect(document.layers[0].buffer.width).toBe(40);
    expect(document.layers[0].buffer.height).toBe(20);
    expect(document.layers[0].buffer.chars.length).toBe(800); // 40 * 20
  });
});
