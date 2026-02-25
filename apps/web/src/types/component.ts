/**
 * Component system types for illustrate.md
 * Based on PRD §6.4 F020: Define Reusable Named Components
 */

/**
 * Base canvas element that can be part of a component.
 * This represents any drawable element on the canvas.
 */
export interface CanvasElement {
  id: string;
  type: 'box' | 'line' | 'text' | 'component';
  x: number; // Grid column position
  y: number; // Grid row position
  width: number; // Width in characters
  height: number; // Height in characters
  data: BoxData | LineData | TextData | ComponentInstanceData;
  layerId: string; // Which layer this element belongs to
}

/**
 * Box element data (rectangle with border characters)
 */
export interface BoxData {
  charset: 'light' | 'heavy' | 'double' | 'round';
  fill?: string; // Optional fill character
}

/**
 * Line element data
 */
export interface LineData {
  endX: number;
  endY: number;
  charset: 'light' | 'heavy' | 'double' | 'round';
  arrowhead?: 'start' | 'end' | 'both' | 'none';
}

/**
 * Text element data
 */
export interface TextData {
  content: string;
  wrap: boolean;
}

/**
 * Component instance data (reference to a component definition)
 */
export interface ComponentInstanceData {
  componentId: string;
  slotValues?: Record<string, string>; // Slot name → content
}

/**
 * Slot definition within a component
 */
export interface ComponentSlot {
  id: string;
  name: string;
  x: number; // Relative position within component
  y: number;
  width: number;
  height: number;
  defaultValue: string;
}

/**
 * Bounding box for a component
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Component definition - a reusable template
 */
export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  created: number; // timestamp
  modified: number; // timestamp
  boundingBox: BoundingBox;
  elements: CanvasElement[]; // Elements with relative positioning
  charGrid?: string[][]; // Simple char-based definition (alternative to elements)
  slots: ComponentSlot[];
  category?: string; // Optional category for organization
  tags?: string[]; // Optional tags for filtering
  thumbnail?: string; // Optional base64 encoded preview image
}

/**
 * Component library - collection of component definitions
 */
export interface ComponentLibrary {
  components: Record<string, ComponentDefinition>;
  categories: string[];
  version: string;
}

/**
 * Validation result for component operations
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Options for creating a new component
 */
export interface CreateComponentOptions {
  name: string;
  description?: string;
  elements?: CanvasElement[];
  charGrid?: string[][]; // Simple char-based component
  slots?: ComponentSlot[];
  category?: string;
  tags?: string[];
}

/**
 * Options for updating an existing component
 */
export interface UpdateComponentOptions {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
}
