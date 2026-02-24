/**
 * useToolSelection Hook — F010: Select Tool
 *
 * Hook to manage tool selection state and handle temporary tool overrides
 * (e.g., holding spacebar for pan).
 */

'use client';

import { useEffect } from 'react';
import { useToolStore } from '@/stores/tool-store';

/**
 * Handle temporary tool switching with keyboard modifiers
 * (e.g., holding spacebar activates pan tool temporarily)
 */
export function useToolSelection() {
  const activeTool = useToolStore((s) => s.activeTool);
  const effectiveTool = useToolStore((s) => s.getEffectiveTool());
  const setTemporaryTool = useToolStore((s) => s.setTemporaryTool);

  useEffect(() => {
    let spacePressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Hold spacebar for temporary pan
      if (e.code === 'Space' && !spacePressed) {
        spacePressed = true;
        setTemporaryTool('pan');
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spacePressed) {
        spacePressed = false;
        setTemporaryTool(null);
        e.preventDefault();
      }
    };

    // Clear temporary tool on window blur (user switches tabs/windows)
    const handleBlur = () => {
      if (spacePressed) {
        spacePressed = false;
        setTemporaryTool(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [setTemporaryTool]);

  return {
    activeTool,
    effectiveTool,
  };
}
