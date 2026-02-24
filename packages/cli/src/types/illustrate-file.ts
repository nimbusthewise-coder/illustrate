/**
 * F063: Local .illustrate File Operations
 * 
 * TypeScript types for .illustrate file format
 */

import type { CanvasDocument } from '@illustrate.md/core';

/**
 * .illustrate file format
 * 
 * A .illustrate file is a JSON file with metadata and canvas data
 */
export interface IllustrateFile {
  version: string;              // File format version (e.g., "1.0")
  metadata: IllustrateMetadata;
  document: CanvasDocument;
}

/**
 * Metadata about the .illustrate file
 */
export interface IllustrateMetadata {
  created: string;              // ISO 8601 timestamp
  modified: string;             // ISO 8601 timestamp
  author?: string;              // Optional author name
  description?: string;         // Optional file description
  exportedFrom?: string;        // Optional source (e.g., "illustrate.md CLI v0.1.0")
}

/**
 * Validation result for .illustrate files
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error with location info
 */
export interface ValidationError {
  path: string;                 // JSON path to the error (e.g., "document.layers[0].buffer")
  message: string;
  expected?: string;
  actual?: string;
  line?: number;                // Line number in file (if available)
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
}

/**
 * File discovery result
 */
export interface FileDiscoveryResult {
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  valid: boolean;
  metadata?: IllustrateMetadata;
}

/**
 * Backup metadata
 */
export interface BackupMetadata {
  originalPath: string;
  backupPath: string;
  timestamp: string;
  reason: string;
}
