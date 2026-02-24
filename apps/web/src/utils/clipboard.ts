/**
 * F045: Browser Clipboard Adapter
 * 
 * Browser-specific clipboard implementation using the Clipboard API
 * with fallback to document.execCommand for older browsers.
 */

import type { ClipboardAdapter, ClipboardResult } from '@illustrate.md/core';

/**
 * Browser clipboard adapter using modern Clipboard API
 * with fallback to legacy execCommand
 */
export class BrowserClipboardAdapter implements ClipboardAdapter {
  /**
   * Check if the Clipboard API is supported
   */
  private hasClipboardAPI(): boolean {
    return typeof navigator !== 'undefined' && 
           typeof navigator.clipboard !== 'undefined' &&
           typeof navigator.clipboard.writeText === 'function';
  }
  
  /**
   * Check if document.execCommand is supported (fallback)
   */
  private hasExecCommand(): boolean {
    return typeof document !== 'undefined' &&
           typeof document.execCommand === 'function';
  }
  
  /**
   * Write text to clipboard using modern Clipboard API
   */
  private async writeWithClipboardAPI(text: string): Promise<ClipboardResult> {
    try {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        content: text
      };
    } catch (error) {
      // Permission denied or other clipboard API error
      if (error instanceof Error) {
        return {
          success: false,
          error: `Clipboard API error: ${error.message}`
        };
      }
      return {
        success: false,
        error: 'Failed to write to clipboard'
      };
    }
  }
  
  /**
   * Write text to clipboard using legacy execCommand (fallback)
   */
  private writeWithExecCommand(text: string): ClipboardResult {
    try {
      // Create a temporary textarea to hold the text
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make it invisible but not display:none (which prevents copying)
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      textarea.setAttribute('readonly', '');
      
      document.body.appendChild(textarea);
      
      // Select the text
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Execute copy command
      const success = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      if (success) {
        return {
          success: true,
          content: text
        };
      } else {
        return {
          success: false,
          error: 'execCommand("copy") returned false'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'execCommand failed'
      };
    }
  }
  
  /**
   * Read text from clipboard (requires user permission)
   */
  async readText(): Promise<string> {
    if (!this.hasClipboardAPI()) {
      throw new Error('Reading from clipboard is not supported in this browser');
    }
    
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? `Failed to read clipboard: ${error.message}`
          : 'Failed to read clipboard'
      );
    }
  }
  
  /**
   * Write text to clipboard with automatic fallback
   */
  async writeText(text: string): Promise<ClipboardResult> {
    // Try modern API first
    if (this.hasClipboardAPI()) {
      return await this.writeWithClipboardAPI(text);
    }
    
    // Fall back to execCommand
    if (this.hasExecCommand()) {
      return this.writeWithExecCommand(text);
    }
    
    // No clipboard support
    return {
      success: false,
      error: 'Clipboard operations are not supported in this browser'
    };
  }
  
  /**
   * Check if clipboard operations are supported
   */
  isSupported(): boolean {
    return this.hasClipboardAPI() || this.hasExecCommand();
  }
}

/**
 * Create a browser clipboard adapter instance
 */
export function createBrowserClipboard(): ClipboardAdapter {
  return new BrowserClipboardAdapter();
}

/**
 * Check if clipboard write permissions are granted
 * Note: This requires user interaction and may not work in all contexts
 */
export async function checkClipboardPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    // Permissions API not supported - assume allowed
    return true;
  }
  
  try {
    // Check clipboard-write permission
    const result = await navigator.permissions.query({ 
      name: 'clipboard-write' as PermissionName 
    });
    return result.state === 'granted' || result.state === 'prompt';
  } catch {
    // Permission query not supported or failed - assume allowed
    return true;
  }
}
