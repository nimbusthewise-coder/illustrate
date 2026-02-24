/**
 * F063: Local .illustrate File Operations
 * 
 * CLI commands for managing .illustrate files
 */

import {
  createIllustrateFile,
  readIllustrateFile,
  findIllustrateFiles,
  validateFile,
  createEmptyDocument,
  formatFileSize,
  formatDate
} from '../utils/file-manager.js';
import { validateIllustrateFile } from '../utils/file-validator.js';

interface CreateOptions {
  width?: number;
  height?: number;
  title?: string;
  author?: string;
  description?: string;
}

interface ListOptions {
  recursive?: boolean;
  validate?: boolean;
  detailed?: boolean;
}

interface ValidateOptions {
  verbose?: boolean;
}

/**
 * Create a new .illustrate file
 */
export async function createCommand(name: string, options: CreateOptions): Promise<void> {
  try {
    // Add .illustrate extension if not present
    const fileName = name.endsWith('.illustrate') ? name : `${name}.illustrate`;
    
    // Get dimensions
    const width = options.width || 80;
    const height = options.height || 24;
    const title = options.title || name;
    
    // Validate dimensions
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }
    
    if (width > 1000 || height > 1000) {
      console.warn(`Warning: Creating a very large canvas (${width}x${height})`);
    }
    
    // Create empty document
    const id = `doc-${Date.now()}`;
    const document = createEmptyDocument(id, title, width, height);
    
    // Create file with metadata
    await createIllustrateFile(fileName, document, {
      author: options.author,
      description: options.description
    });
    
    console.log(`✓ Created ${fileName}`);
    console.log(`  Size: ${width}x${height}`);
    console.log(`  Title: ${title}`);
    if (options.author) {
      console.log(`  Author: ${options.author}`);
    }
    if (options.description) {
      console.log(`  Description: ${options.description}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error creating file: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * List .illustrate files in directory
 */
export async function listCommand(directory: string = '.', options: ListOptions = {}): Promise<void> {
  try {
    console.log(`Searching for .illustrate files in ${directory}${options.recursive ? ' (recursive)' : ''}...`);
    console.log();
    
    const files = await findIllustrateFiles(directory, {
      recursive: options.recursive,
      validate: options.validate
    });
    
    if (files.length === 0) {
      console.log('No .illustrate files found.');
      process.exit(0);
      return;
    }
    
    console.log(`Found ${files.length} file${files.length === 1 ? '' : 's'}:`);
    console.log();
    
    // Sort by path
    files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    
    for (const file of files) {
      if (options.detailed) {
        console.log(`📄 ${file.relativePath}`);
        console.log(`   Path: ${file.path}`);
        console.log(`   Size: ${formatFileSize(file.size)}`);
        console.log(`   Modified: ${formatDate(file.modified)}`);
        
        if (options.validate) {
          console.log(`   Valid: ${file.valid ? '✓ Yes' : '✗ No'}`);
        }
        
        if (file.metadata) {
          if (file.metadata.author) {
            console.log(`   Author: ${file.metadata.author}`);
          }
          if (file.metadata.description) {
            console.log(`   Description: ${file.metadata.description}`);
          }
        }
        
        console.log();
      } else {
        const status = options.validate 
          ? (file.valid ? ' ✓' : ' ✗')
          : '';
        const size = ` (${formatFileSize(file.size)})`;
        console.log(`  ${file.relativePath}${status}${size}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error listing files: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Validate a .illustrate file
 */
export async function validateCommand(filePath: string, options: ValidateOptions = {}): Promise<void> {
  try {
    console.log(`Validating ${filePath}...`);
    console.log();
    
    const result = await validateFile(filePath);
    
    if (!result.exists) {
      console.error('✗ File does not exist');
      process.exit(1);
      return;
    }
    
    if (result.valid) {
      console.log('✓ File is valid');
      
      // Show file info if verbose
      if (options.verbose) {
        const file = await readIllustrateFile(filePath);
        console.log();
        console.log('File information:');
        console.log(`  Version: ${file.version}`);
        console.log(`  Created: ${file.metadata.created}`);
        console.log(`  Modified: ${file.metadata.modified}`);
        if (file.metadata.author) {
          console.log(`  Author: ${file.metadata.author}`);
        }
        if (file.metadata.description) {
          console.log(`  Description: ${file.metadata.description}`);
        }
        console.log();
        console.log('Document:');
        console.log(`  ID: ${file.document.id}`);
        console.log(`  Title: ${file.document.title}`);
        console.log(`  Size: ${file.document.width}x${file.document.height}`);
        console.log(`  Layers: ${file.document.layers.length}`);
        console.log(`  Tags: ${file.document.tags.join(', ') || '(none)'}`);
      }
      
      // Show warnings if any
      if (result.warnings.length > 0) {
        console.log();
        console.log('Warnings:');
        for (const warning of result.warnings) {
          console.log(`  ⚠ ${warning}`);
        }
      }
      
      process.exit(0);
    } else {
      console.error('✗ File is invalid');
      console.log();
      console.log('Errors:');
      for (const error of result.errors) {
        console.error(`  ✗ ${error}`);
      }
      
      if (result.warnings.length > 0) {
        console.log();
        console.log('Warnings:');
        for (const warning of result.warnings) {
          console.log(`  ⚠ ${warning}`);
        }
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error validating file: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Read and display file info
 */
export async function infoCommand(filePath: string): Promise<void> {
  try {
    const file = await readIllustrateFile(filePath);
    const validation = validateIllustrateFile(file);
    
    console.log(`File: ${filePath}`);
    console.log();
    console.log('Metadata:');
    console.log(`  Version: ${file.version}`);
    console.log(`  Created: ${file.metadata.created}`);
    console.log(`  Modified: ${file.metadata.modified}`);
    if (file.metadata.author) {
      console.log(`  Author: ${file.metadata.author}`);
    }
    if (file.metadata.description) {
      console.log(`  Description: ${file.metadata.description}`);
    }
    if (file.metadata.exportedFrom) {
      console.log(`  Exported from: ${file.metadata.exportedFrom}`);
    }
    
    console.log();
    console.log('Document:');
    console.log(`  ID: ${file.document.id}`);
    console.log(`  Title: ${file.document.title}`);
    console.log(`  Size: ${file.document.width}x${file.document.height}`);
    console.log(`  Layers: ${file.document.layers.length}`);
    console.log(`  Tags: ${file.document.tags.join(', ') || '(none)'}`);
    
    // Show layer details
    console.log();
    console.log('Layers:');
    for (const layer of file.document.layers) {
      const visibleStr = layer.visible ? '👁' : '🚫';
      const lockedStr = layer.locked ? '🔒' : '🔓';
      console.log(`  ${layer.name} ${visibleStr} ${lockedStr}`);
      console.log(`    ID: ${layer.id}`);
      console.log(`    Position: (${layer.x}, ${layer.y})`);
      console.log(`    Buffer: ${layer.buffer.width}x${layer.buffer.height}`);
    }
    
    // Show validation status
    console.log();
    console.log(`Validation: ${validation.valid ? '✓ Valid' : '✗ Invalid'}`);
    
    if (validation.errors.length > 0) {
      console.log();
      console.log('Errors:');
      for (const error of validation.errors) {
        console.log(`  ✗ ${error.path}: ${error.message}`);
      }
    }
    
    if (validation.warnings.length > 0) {
      console.log();
      console.log('Warnings:');
      for (const warning of validation.warnings) {
        console.log(`  ⚠ ${warning.path}: ${warning.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(`Error reading file: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
