/**
 * F063: Local .illustrate File Operations
 * 
 * Core file operations and management
 */

import { readFile, writeFile, mkdir, stat, readdir, copyFile } from 'fs/promises';
import { resolve, dirname, basename, join, relative, extname } from 'path';
import { existsSync } from 'fs';
import type { IllustrateFile, FileDiscoveryResult, BackupMetadata } from '../types/illustrate-file.js';
import { parseIllustrateFile, serializeToIllustrateFile } from './illustrate-parser.js';
import { validateIllustrateFile } from './file-validator.js';
import type { CanvasDocument } from '@illustrate.md/core';

/**
 * Create a new .illustrate file
 */
export async function createIllustrateFile(
  filePath: string,
  document: CanvasDocument,
  metadata?: Partial<IllustrateFile['metadata']>
): Promise<void> {
  const resolvedPath = resolve(filePath);
  
  // Ensure directory exists
  const dir = dirname(resolvedPath);
  await mkdir(dir, { recursive: true });
  
  // Create file content
  const file = serializeToIllustrateFile(document, metadata);
  
  // Write to disk
  const content = JSON.stringify(file, null, 2);
  await writeFile(resolvedPath, content, 'utf-8');
}

/**
 * Read a .illustrate file
 */
export async function readIllustrateFile(filePath: string): Promise<IllustrateFile> {
  const resolvedPath = resolve(filePath);
  const content = await readFile(resolvedPath, 'utf-8');
  return parseIllustrateFile(content);
}

/**
 * Update a .illustrate file
 */
export async function updateIllustrateFile(
  filePath: string,
  document: CanvasDocument,
  options?: {
    createBackup?: boolean;
    preserveMetadata?: boolean;
  }
): Promise<BackupMetadata | null> {
  const resolvedPath = resolve(filePath);
  let backupMetadata: BackupMetadata | null = null;
  
  // Create backup if requested
  if (options?.createBackup) {
    backupMetadata = await createBackup(resolvedPath, 'update');
  }
  
  // Read existing file to preserve metadata
  let existingMetadata: IllustrateFile['metadata'] | undefined;
  if (options?.preserveMetadata) {
    try {
      const existing = await readIllustrateFile(resolvedPath);
      existingMetadata = existing.metadata;
    } catch (error) {
      // Ignore errors, just create new metadata
    }
  }
  
  // Create updated file
  const file = serializeToIllustrateFile(document, existingMetadata);
  const content = JSON.stringify(file, null, 2);
  await writeFile(resolvedPath, content, 'utf-8');
  
  return backupMetadata;
}

/**
 * Create a backup of a file
 */
export async function createBackup(filePath: string, reason: string): Promise<BackupMetadata> {
  const resolvedPath = resolve(filePath);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${resolvedPath}.backup.${timestamp}`;
  
  await copyFile(resolvedPath, backupPath);
  
  return {
    originalPath: resolvedPath,
    backupPath,
    timestamp: new Date().toISOString(),
    reason
  };
}

/**
 * List all .illustrate files in a directory (recursive)
 */
export async function findIllustrateFiles(
  searchPath: string = '.',
  options?: {
    recursive?: boolean;
    validate?: boolean;
  }
): Promise<FileDiscoveryResult[]> {
  const resolvedPath = resolve(searchPath);
  const results: FileDiscoveryResult[] = [];
  
  await scanDirectory(resolvedPath, resolvedPath, results, options);
  
  return results;
}

/**
 * Recursively scan directory for .illustrate files
 */
async function scanDirectory(
  dirPath: string,
  basePath: string,
  results: FileDiscoveryResult[],
  options?: {
    recursive?: boolean;
    validate?: boolean;
  }
): Promise<void> {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    // Skip directories we can't read
    return;
  }
  
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse into subdirectories if requested
      if (options?.recursive) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDirectory(fullPath, basePath, results, options);
        }
      }
    } else if (entry.isFile() && extname(entry.name) === '.illustrate') {
      // Found a .illustrate file
      const stats = await stat(fullPath);
      const relativePath = relative(basePath, fullPath);
      
      let valid = false;
      let metadata: IllustrateFile['metadata'] | undefined;
      
      // Validate if requested
      if (options?.validate) {
        try {
          const file = await readIllustrateFile(fullPath);
          const validation = validateIllustrateFile(file);
          valid = validation.valid;
          metadata = file.metadata;
        } catch (error) {
          valid = false;
        }
      }
      
      results.push({
        path: fullPath,
        relativePath,
        size: stats.size,
        modified: stats.mtime,
        valid,
        metadata
      });
    }
  }
}

/**
 * Check if a file exists and is a valid .illustrate file
 */
export async function validateFile(filePath: string): Promise<{
  exists: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const resolvedPath = resolve(filePath);
  
  // Check if file exists
  if (!existsSync(resolvedPath)) {
    return {
      exists: false,
      valid: false,
      errors: ['File does not exist'],
      warnings: []
    };
  }
  
  // Try to parse and validate
  try {
    const content = await readFile(resolvedPath, 'utf-8');
    const file = parseIllustrateFile(content);
    const validation = validateIllustrateFile(file);
    
    return {
      exists: true,
      valid: validation.valid,
      errors: validation.errors.map(e => `${e.path}: ${e.message}`),
      warnings: validation.warnings.map(w => `${w.path}: ${w.message}`)
    };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    };
  }
}

/**
 * Create an empty canvas document
 */
export function createEmptyDocument(
  id: string,
  title: string,
  width: number,
  height: number
): CanvasDocument {
  const now = Date.now();
  const size = width * height;
  
  return {
    id,
    title,
    width,
    height,
    layers: [
      {
        id: 'layer-1',
        name: 'Background',
        parentId: null,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        buffer: {
          width,
          height,
          chars: new Uint16Array(size).fill(32), // Space character
          fg: new Uint32Array(size).fill(0xffffffff), // White
          bg: new Uint32Array(size).fill(0x00000000), // Transparent
          flags: new Uint8Array(size).fill(0)
        }
      }
    ],
    designSystem: null,
    tags: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] + ' ' + 
         date.toTimeString().split(' ')[0];
}
