/**
 * Core types for illustrate.md
 * Based on PRD §5.2 Layer Model and §5.3 Canvas Document
 */

export interface Layer {
  id: string;
  name: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
}
