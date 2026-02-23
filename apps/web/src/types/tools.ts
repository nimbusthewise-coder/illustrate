/**
 * Tool types for illustrate.md
 */

export type ToolType =
  | 'select'    // V - Select tool
  | 'box'       // U - Box drawing tool
  | 'line'      // L - Line tool
  | 'text'      // T - Text tool
  | 'paint'     // P - Paint (colour) tool
  | 'eraser'    // E - Eraser tool
  | 'fill';     // F - Fill tool

export type EraserSize = 1 | 3;

export interface ToolSettings {
  eraserSize: EraserSize;
  // Future tool settings can be added here
}
