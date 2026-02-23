'use client';

import { useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { exportAsPlainText } from '@/lib/export';

/**
 * Global keyboard handler for copy operations
 * Handles Cmd/Ctrl + C to copy canvas content when no text is selected
 */
export function KeyboardHandler() {
  const { document } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + C
      const isCopy = (e.metaKey || e.ctrlKey) && e.key === 'c';
      
      if (!isCopy) return;

      // Don't interfere with copy in input fields or text selections
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        window.getSelection()?.toString()
      ) {
        return;
      }

      // Copy canvas content
      e.preventDefault();
      
      if (!document) return;
      
      try {
        const text = exportAsPlainText(document.layers, document.width, document.height);
        await navigator.clipboard.writeText(text);
      } catch (err) {
        console.error('Failed to copy canvas to clipboard:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [document]);

  // This component renders nothing - it's purely functional
  return null;
}
