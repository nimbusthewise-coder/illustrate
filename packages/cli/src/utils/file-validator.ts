/**
 * F063: Local .illustrate File Operations
 * 
 * Schema validation for .illustrate files
 */

import type { IllustrateFile, ValidationResult, ValidationError, ValidationWarning } from '../types/illustrate-file.js';

/**
 * Validate a .illustrate file
 */
export function validateIllustrateFile(file: IllustrateFile): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Validate version
  if (!file.version || typeof file.version !== 'string') {
    errors.push({
      path: 'version',
      message: 'Version must be a string',
      expected: 'string',
      actual: typeof file.version
    });
  } else if (!file.version.match(/^\d+\.\d+$/)) {
    warnings.push({
      path: 'version',
      message: `Version "${file.version}" does not follow semver format (e.g., "1.0")`
    });
  }
  
  // Validate metadata
  if (!file.metadata) {
    errors.push({
      path: 'metadata',
      message: 'Metadata is required'
    });
  } else {
    validateMetadata(file.metadata, errors, warnings);
  }
  
  // Validate document
  if (!file.document) {
    errors.push({
      path: 'document',
      message: 'Document is required'
    });
  } else {
    validateDocument(file.document, errors, warnings);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate metadata
 */
function validateMetadata(
  metadata: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  if (!metadata.created || typeof metadata.created !== 'string') {
    errors.push({
      path: 'metadata.created',
      message: 'Created timestamp is required and must be a string'
    });
  } else if (!isValidISO8601(metadata.created)) {
    warnings.push({
      path: 'metadata.created',
      message: 'Created timestamp is not a valid ISO 8601 date'
    });
  }
  
  if (!metadata.modified || typeof metadata.modified !== 'string') {
    errors.push({
      path: 'metadata.modified',
      message: 'Modified timestamp is required and must be a string'
    });
  } else if (!isValidISO8601(metadata.modified)) {
    warnings.push({
      path: 'metadata.modified',
      message: 'Modified timestamp is not a valid ISO 8601 date'
    });
  }
  
  if (metadata.author !== undefined && typeof metadata.author !== 'string') {
    errors.push({
      path: 'metadata.author',
      message: 'Author must be a string',
      expected: 'string',
      actual: typeof metadata.author
    });
  }
  
  if (metadata.description !== undefined && typeof metadata.description !== 'string') {
    errors.push({
      path: 'metadata.description',
      message: 'Description must be a string',
      expected: 'string',
      actual: typeof metadata.description
    });
  }
}

/**
 * Validate document
 */
function validateDocument(
  document: any,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Required string fields
  const requiredStrings = ['id', 'title'];
  for (const field of requiredStrings) {
    if (!document[field] || typeof document[field] !== 'string') {
      errors.push({
        path: `document.${field}`,
        message: `${field} is required and must be a string`,
        expected: 'string',
        actual: typeof document[field]
      });
    }
  }
  
  // Required number fields
  const requiredNumbers = ['width', 'height', 'createdAt', 'updatedAt'];
  for (const field of requiredNumbers) {
    if (typeof document[field] !== 'number') {
      errors.push({
        path: `document.${field}`,
        message: `${field} is required and must be a number`,
        expected: 'number',
        actual: typeof document[field]
      });
    }
  }
  
  // Validate width and height are positive
  if (typeof document.width === 'number' && document.width <= 0) {
    errors.push({
      path: 'document.width',
      message: 'Width must be positive',
      expected: '> 0',
      actual: String(document.width)
    });
  }
  
  if (typeof document.height === 'number' && document.height <= 0) {
    errors.push({
      path: 'document.height',
      message: 'Height must be positive',
      expected: '> 0',
      actual: String(document.height)
    });
  }
  
  // Validate layers
  if (!Array.isArray(document.layers)) {
    errors.push({
      path: 'document.layers',
      message: 'Layers must be an array',
      expected: 'array',
      actual: typeof document.layers
    });
  } else {
    document.layers.forEach((layer: any, index: number) => {
      validateLayer(layer, index, errors, warnings);
    });
  }
  
  // Validate tags
  if (!Array.isArray(document.tags)) {
    errors.push({
      path: 'document.tags',
      message: 'Tags must be an array',
      expected: 'array',
      actual: typeof document.tags
    });
  }
  
  // Validate design system (optional)
  if (document.designSystem !== null && typeof document.designSystem !== 'object') {
    errors.push({
      path: 'document.designSystem',
      message: 'Design system must be null or an object',
      expected: 'null | object',
      actual: typeof document.designSystem
    });
  }
}

/**
 * Validate a layer
 */
function validateLayer(
  layer: any,
  index: number,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  const basePath = `document.layers[${index}]`;
  
  // Required fields
  if (!layer.id || typeof layer.id !== 'string') {
    errors.push({
      path: `${basePath}.id`,
      message: 'Layer id is required and must be a string'
    });
  }
  
  if (!layer.name || typeof layer.name !== 'string') {
    errors.push({
      path: `${basePath}.name`,
      message: 'Layer name is required and must be a string'
    });
  }
  
  if (typeof layer.visible !== 'boolean') {
    errors.push({
      path: `${basePath}.visible`,
      message: 'Layer visible must be a boolean'
    });
  }
  
  if (typeof layer.locked !== 'boolean') {
    errors.push({
      path: `${basePath}.locked`,
      message: 'Layer locked must be a boolean'
    });
  }
  
  if (typeof layer.x !== 'number') {
    errors.push({
      path: `${basePath}.x`,
      message: 'Layer x must be a number'
    });
  }
  
  if (typeof layer.y !== 'number') {
    errors.push({
      path: `${basePath}.y`,
      message: 'Layer y must be a number'
    });
  }
  
  // Validate buffer
  if (!layer.buffer) {
    errors.push({
      path: `${basePath}.buffer`,
      message: 'Layer buffer is required'
    });
  } else {
    validateBuffer(layer.buffer, `${basePath}.buffer`, errors, warnings);
  }
}

/**
 * Validate a buffer
 */
function validateBuffer(
  buffer: any,
  basePath: string,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): void {
  // Required number fields
  if (typeof buffer.width !== 'number' || buffer.width <= 0) {
    errors.push({
      path: `${basePath}.width`,
      message: 'Buffer width must be a positive number'
    });
  }
  
  if (typeof buffer.height !== 'number' || buffer.height <= 0) {
    errors.push({
      path: `${basePath}.height`,
      message: 'Buffer height must be a positive number'
    });
  }
  
  // Validate arrays
  const requiredArrays = ['chars', 'fg', 'bg', 'flags'];
  const expectedSize = buffer.width * buffer.height;
  
  for (const field of requiredArrays) {
    if (!Array.isArray(buffer[field]) && !ArrayBuffer.isView(buffer[field])) {
      errors.push({
        path: `${basePath}.${field}`,
        message: `Buffer ${field} must be an array or typed array`
      });
    } else if (buffer[field].length !== expectedSize) {
      errors.push({
        path: `${basePath}.${field}`,
        message: `Buffer ${field} length must match width * height`,
        expected: String(expectedSize),
        actual: String(buffer[field].length)
      });
    }
  }
}

/**
 * Check if a string is a valid ISO 8601 date
 */
function isValidISO8601(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
