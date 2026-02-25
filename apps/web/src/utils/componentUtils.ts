/**
 * Component utility functions for validation, serialization, and manipulation
 */

import {
  ComponentDefinition,
  ComponentLibrary,
  CanvasElement,
  CreateComponentOptions,
  ValidationResult,
  BoundingBox,
} from '@/types/component';

/**
 * Calculate bounding box from a set of elements
 */
export function calculateBoundingBox(elements: CanvasElement[]): BoundingBox {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert elements to relative positions based on bounding box
 */
export function normalizeElementPositions(
  elements: CanvasElement[],
  boundingBox: BoundingBox,
): CanvasElement[] {
  return elements.map((element) => ({
    ...element,
    x: element.x - boundingBox.x,
    y: element.y - boundingBox.y,
  }));
}

/**
 * Convert elements from relative to absolute positions
 */
export function denormalizeElementPositions(
  elements: CanvasElement[],
  offsetX: number,
  offsetY: number,
): CanvasElement[] {
  return elements.map((element) => ({
    ...element,
    x: element.x + offsetX,
    y: element.y + offsetY,
  }));
}

/**
 * Validate component name
 */
export function validateComponentName(
  name: string,
  existingNames: string[],
  currentName?: string,
): ValidationResult {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Component name cannot be empty');
  }

  if (name.length > 64) {
    errors.push('Component name must be 64 characters or less');
  }

  const normalizedName = name.trim().toLowerCase();
  const isDuplicate = existingNames.some(
    (existing) =>
      existing.toLowerCase() === normalizedName &&
      existing !== currentName,
  );

  if (isDuplicate) {
    errors.push('A component with this name already exists');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate component content (elements or charGrid)
 */
export function validateComponentElements(
  elements: CanvasElement[],
  charGrid?: string[],
): ValidationResult {
  const errors: string[] = [];

  // Accept either elements OR charGrid
  const hasElements = elements.length > 0;
  const hasCharGrid = charGrid && charGrid.length > 0 && charGrid.some(row => row.length > 0);

  if (!hasElements && !hasCharGrid) {
    errors.push('Component must contain at least one element');
  }

  // Check for invalid dimensions in elements
  for (const element of elements) {
    if (element.width <= 0 || element.height <= 0) {
      errors.push(`Element ${element.id} has invalid dimensions`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete component definition
 */
export function validateComponent(
  component: ComponentDefinition,
  library: ComponentLibrary,
): ValidationResult {
  const existingNames = Object.values(library.components).map((c) => c.name);
  const nameValidation = validateComponentName(
    component.name,
    existingNames,
    component.name,
  );

  if (!nameValidation.valid) {
    return nameValidation;
  }

  const elementsValidation = validateComponentElements(component.elements, component.charGrid);
  if (!elementsValidation.valid) {
    return elementsValidation;
  }

  return { valid: true, errors: [] };
}

/**
 * Create a new component definition from options
 */
export function createComponentDefinition(
  options: CreateComponentOptions,
): ComponentDefinition {
  const now = Date.now();

  // If charGrid provided, use that (simpler char-based component)
  if (options.charGrid && options.charGrid.length > 0) {
    const height = options.charGrid.length;
    const width = Math.max(...options.charGrid.map(row => row.length));
    
    return {
      id: generateComponentId(),
      name: options.name,
      description: options.description || '',
      created: now,
      modified: now,
      boundingBox: { x: 0, y: 0, width, height },
      elements: [],
      charGrid: options.charGrid,
      slots: options.slots || [],
      category: options.category,
      tags: options.tags || [],
    };
  }

  // Otherwise use elements-based definition
  const elements = options.elements || [];
  const boundingBox = calculateBoundingBox(elements);
  const normalizedElements = normalizeElementPositions(elements, boundingBox);

  return {
    id: generateComponentId(),
    name: options.name,
    description: options.description || '',
    created: now,
    modified: now,
    boundingBox,
    elements: normalizedElements,
    slots: options.slots || [],
    category: options.category,
    tags: options.tags || [],
  };
}

/**
 * Generate a unique component ID
 */
export function generateComponentId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Serialize component library to JSON
 */
export function serializeLibrary(library: ComponentLibrary): string {
  return JSON.stringify(library, null, 2);
}

/**
 * Deserialize component library from JSON
 */
export function deserializeLibrary(json: string): ComponentLibrary {
  try {
    const parsed = JSON.parse(json);
    return {
      components: parsed.components || {},
      categories: parsed.categories || [],
      version: parsed.version || '1.0.0',
    };
  } catch (error) {
    console.error('Failed to deserialize component library:', error);
    return {
      components: {},
      categories: [],
      version: '1.0.0',
    };
  }
}

/**
 * Create an empty component library
 */
export function createEmptyLibrary(): ComponentLibrary {
  return {
    components: {},
    categories: [],
    version: '1.0.0',
  };
}

/**
 * Filter components by category
 */
export function filterByCategory(
  library: ComponentLibrary,
  category: string,
): ComponentDefinition[] {
  return Object.values(library.components).filter(
    (c) => c.category === category,
  );
}

/**
 * Filter components by tag
 */
export function filterByTag(
  library: ComponentLibrary,
  tag: string,
): ComponentDefinition[] {
  return Object.values(library.components).filter(
    (c) => c.tags?.includes(tag),
  );
}

/**
 * Search components by name or description
 */
export function searchComponents(
  library: ComponentLibrary,
  query: string,
): ComponentDefinition[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(library.components).filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Get all unique tags from library
 */
export function getAllTags(library: ComponentLibrary): string[] {
  const tagsSet = new Set<string>();
  Object.values(library.components).forEach((c) => {
    c.tags?.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}
