/**
 * Keyboard shortcuts hook with modal input suppression (BUG-001 fix)
 * 
 * When text tool is active and user is typing (isInputActive = true),
 * all tool-switching shortcuts are suppressed to prevent typing 'e' from
 * activating the eraser tool, etc.
 * 
 * User can press ESCAPE to exit text input mode and re-enable shortcuts.
 */

import { useEffect } from 'react';
import { useToolStore } from '@/stores/tool-store';
import { useColourStore } from '@/stores/colour-store';
import { ToolType } from '@/types/tools';

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  v: 'select',
  u: 'box',
  l: 'line',
  t: 'text',
  e: 'eraser',
  f: 'fill',
};

export function useKeyboardShortcuts() {
  const { isInputActive, setTool, exitTextMode } = useToolStore();
  const { swapColours } = useColourStore();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // ESCAPE always exits text mode
      if (event.key === 'Escape') {
        exitTextMode();
        return;
      }

      // Ignore shortcuts if typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // BUG-001 FIX: If modal input is active (e.g., text tool typing),
      // suppress all tool-switching shortcuts
      if (isInputActive) {
        return;
      }

      // Colour swap shortcut (X) - only when NOT in input mode
      const key = event.key.toLowerCase();
      
      if (key === 'x') {
        event.preventDefault();
        swapColours();
        return;
      }

      // Tool shortcuts - only when NOT in input mode
      const tool = TOOL_SHORTCUTS[key];

      if (tool) {
        event.preventDefault();
        setTool(tool);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputActive, setTool, exitTextMode, swapColours]);
}
