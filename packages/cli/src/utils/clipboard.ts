/**
 * F045: Node.js Clipboard Adapter
 * 
 * Node.js-specific clipboard implementation using the clipboardy package
 * for cross-platform clipboard access (Windows, macOS, Linux).
 */

import type { ClipboardAdapter, ClipboardResult } from '@illustrate.md/core';

/**
 * Node.js clipboard adapter using clipboardy
 * Provides cross-platform clipboard access for CLI environments
 */
export class NodeClipboardAdapter implements ClipboardAdapter {
  private clipboardy: any = null;
  
  /**
   * Lazy-load clipboardy to avoid import errors in environments where it's not available
   */
  private async getClipboardy() {
    if (!this.clipboardy) {
      try {
        // Dynamic import to handle optional dependency
        this.clipboardy = await import('clipboardy');
      } catch (error) {
        throw new Error(
          'clipboardy package is not installed. ' +
          'Install it with: npm install clipboardy'
        );
      }
    }
    return this.clipboardy;
  }
  
  /**
   * Write text to system clipboard
   */
  async writeText(text: string): Promise<ClipboardResult> {
    try {
      const clipboardy = await this.getClipboardy();
      await clipboardy.default.write(text);
      
      return {
        success: true,
        content: text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Read text from system clipboard
   */
  async readText(): Promise<string> {
    try {
      const clipboardy = await this.getClipboardy();
      return await clipboardy.default.read();
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? `Failed to read clipboard: ${error.message}`
          : 'Failed to read clipboard'
      );
    }
  }
  
  /**
   * Check if clipboard operations are supported
   * In Node.js, this checks if we're in a terminal environment
   */
  isSupported(): boolean {
    // Check if we're in a Node.js environment with a terminal
    return typeof process !== 'undefined' && 
           typeof process.stdout !== 'undefined';
  }
}

/**
 * Create a Node.js clipboard adapter instance
 */
export function createNodeClipboard(): ClipboardAdapter {
  return new NodeClipboardAdapter();
}

/**
 * Fallback adapter that uses the system clipboard commands directly
 * (pbcopy on macOS, xclip/xsel on Linux, clip on Windows)
 * This is used when clipboardy is not available
 */
export class SystemCommandClipboardAdapter implements ClipboardAdapter {
  /**
   * Detect the platform and return the appropriate clipboard command
   */
  private getClipboardCommand(): { write: string; read?: string } | null {
    const platform = process.platform;
    
    switch (platform) {
      case 'darwin':
        return { write: 'pbcopy', read: 'pbpaste' };
      case 'win32':
        return { write: 'clip' };
      case 'linux':
        // Try xclip first, fall back to xsel
        return { write: 'xclip -selection clipboard', read: 'xclip -selection clipboard -o' };
      default:
        return null;
    }
  }
  
  /**
   * Execute a shell command with text input
   */
  private async execCommand(command: string, input?: string): Promise<string> {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    if (input) {
      // Pipe input to the command
      const { spawn } = await import('child_process');
      return new Promise((resolve, reject) => {
        const proc = spawn(command, { shell: true });
        
        proc.stdin.write(input);
        proc.stdin.end();
        
        let stdout = '';
        let stderr = '';
        
        proc.stdout.on('data', (data) => { stdout += data; });
        proc.stderr.on('data', (data) => { stderr += data; });
        
        proc.on('close', (code) => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`Command failed: ${stderr || 'Unknown error'}`));
          }
        });
      });
    } else {
      const { stdout } = await execAsync(command);
      return stdout;
    }
  }
  
  async writeText(text: string): Promise<ClipboardResult> {
    const command = this.getClipboardCommand();
    
    if (!command) {
      return {
        success: false,
        error: `Clipboard operations not supported on platform: ${process.platform}`
      };
    }
    
    try {
      await this.execCommand(command.write, text);
      return {
        success: true,
        content: text
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  async readText(): Promise<string> {
    const command = this.getClipboardCommand();
    
    if (!command || !command.read) {
      throw new Error(`Reading clipboard not supported on platform: ${process.platform}`);
    }
    
    try {
      return await this.execCommand(command.read);
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? `Failed to read clipboard: ${error.message}`
          : 'Failed to read clipboard'
      );
    }
  }
  
  isSupported(): boolean {
    return this.getClipboardCommand() !== null;
  }
}

/**
 * Create a system command clipboard adapter
 */
export function createSystemCommandClipboard(): ClipboardAdapter {
  return new SystemCommandClipboardAdapter();
}

/**
 * Create the best available clipboard adapter for the current environment
 * Tries clipboardy first, falls back to system commands
 */
export async function createBestClipboard(): Promise<ClipboardAdapter> {
  try {
    // Try to use clipboardy first
    const adapter = new NodeClipboardAdapter();
    await adapter.writeText(''); // Test if it works
    return adapter;
  } catch {
    // Fall back to system commands
    return new SystemCommandClipboardAdapter();
  }
}
