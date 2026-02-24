/**
 * F045: Copy to Clipboard
 * 
 * Core clipboard abstraction and utilities for copying ASCII diagrams
 * to the system clipboard. Provides a platform-agnostic interface that
 * can be implemented differently in browser and Node.js environments.
 */

import type { CanvasDocument } from './types.js';
import { exportPlainAscii, exportAnsiText } from './export.js';

/**
 * Format options for clipboard content
 */
export interface ClipboardOptions {
  /**
   * Whether to include ANSI color codes in the output
   * @default false
   */
  includeColors?: boolean;
  
  /**
   * Custom export format function
   * If provided, this will be used instead of the default exporters
   */
  customFormat?: (document: CanvasDocument) => string;
}

/**
 * Result of a clipboard operation
 */
export interface ClipboardResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * Error message if the operation failed
   */
  error?: string;
  
  /**
   * The content that was copied (or attempted to be copied)
   */
  content?: string;
}

/**
 * Platform-agnostic clipboard interface
 * Implementations should handle platform-specific clipboard APIs
 */
export interface ClipboardAdapter {
  /**
   * Write text to the clipboard
   * @param text - The text to copy
   * @returns Promise that resolves with the operation result
   */
  writeText(text: string): Promise<ClipboardResult>;
  
  /**
   * Read text from the clipboard (optional, for paste operations)
   * @returns Promise that resolves with the clipboard content
   */
  readText?(): Promise<string>;
  
  /**
   * Check if clipboard operations are supported in the current environment
   * @returns true if clipboard operations are available
   */
  isSupported(): boolean;
}

/**
 * Format a canvas document for clipboard export
 * 
 * @param document - The canvas document to format
 * @param options - Export options
 * @returns Formatted text ready for clipboard
 */
export function formatForClipboard(
  document: CanvasDocument,
  options: ClipboardOptions = {}
): string {
  const { includeColors = false, customFormat } = options;
  
  // Use custom format if provided
  if (customFormat) {
    return customFormat(document);
  }
  
  // Use ANSI export if colors are requested
  if (includeColors) {
    return exportAnsiText(document);
  }
  
  // Default to plain ASCII export
  return exportPlainAscii(document);
}

/**
 * Copy a canvas document to clipboard using the provided adapter
 * 
 * @param document - The canvas document to copy
 * @param adapter - Platform-specific clipboard adapter
 * @param options - Export options
 * @returns Promise that resolves with the operation result
 */
export async function copyToClipboard(
  document: CanvasDocument,
  adapter: ClipboardAdapter,
  options: ClipboardOptions = {}
): Promise<ClipboardResult> {
  // Check if clipboard is supported
  if (!adapter.isSupported()) {
    return {
      success: false,
      error: 'Clipboard operations are not supported in this environment'
    };
  }
  
  try {
    // Format the document for clipboard
    const content = formatForClipboard(document, options);
    
    // Write to clipboard using the adapter
    const result = await adapter.writeText(content);
    
    return {
      ...result,
      content
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Copy plain text directly to clipboard (for arbitrary content)
 * 
 * @param text - The text to copy
 * @param adapter - Platform-specific clipboard adapter
 * @returns Promise that resolves with the operation result
 */
export async function copyTextToClipboard(
  text: string,
  adapter: ClipboardAdapter
): Promise<ClipboardResult> {
  if (!adapter.isSupported()) {
    return {
      success: false,
      error: 'Clipboard operations are not supported in this environment'
    };
  }
  
  try {
    const result = await adapter.writeText(text);
    return {
      ...result,
      content: text
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
