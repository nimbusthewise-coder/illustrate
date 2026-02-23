/**
 * Tool system with modal input support
 */

export type ToolType = 'select' | 'text' | 'box' | 'line' | 'eraser' | 'brush';

export interface ToolState {
  activeTool: ToolType;
  isInputActive: boolean;  // Flag for modal input (e.g., text typing)
}

export const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: 'select',
  t: 'text',
  b: 'brush',
  u: 'box',
  l: 'line',
  e: 'eraser',
};

export function createToolState(): ToolState {
  return {
    activeTool: 'select',
    isInputActive: false,
  };
}

export function setActiveTool(state: ToolState, tool: ToolType): ToolState {
  return {
    ...state,
    activeTool: tool,
    isInputActive: false, // Reset input mode when switching tools
  };
}

export function setInputActive(state: ToolState, active: boolean): ToolState {
  return {
    ...state,
    isInputActive: active,
  };
}

/**
 * Check if a keyboard shortcut should be suppressed
 * Returns true if shortcuts should be blocked (e.g., during text input)
 */
export function shouldSuppressShortcuts(state: ToolState): boolean {
  return state.isInputActive;
}
