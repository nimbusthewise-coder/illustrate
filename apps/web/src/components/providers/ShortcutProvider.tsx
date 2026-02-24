/**
 * Shortcut Provider — F052: Keyboard Shortcuts System
 *
 * Initializes the keyboard shortcut system and provides it to the app.
 */

'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { getShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import { ShortcutHelpModal } from '@/components/shortcuts/ShortcutHelpModal';
import { useShortcut } from '@/hooks/useShortcuts';

interface ShortcutContextValue {
  showHelp: () => void;
  hideHelp: () => void;
  toggleHelp: () => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function useShortcutHelp() {
  const context = useContext(ShortcutContext);
  if (!context) {
    throw new Error('useShortcutHelp must be used within ShortcutProvider');
  }
  return context;
}

interface ShortcutProviderProps {
  children: ReactNode;
}

export function ShortcutProvider({ children }: ShortcutProviderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const manager = getShortcutManager();

  // Initialize shortcut manager
  useEffect(() => {
    manager.start();
    return () => manager.stop();
  }, [manager]);

  // Register help shortcut (Shift+?)
  useShortcut(
    ['?'],
    () => setIsHelpOpen(true),
    {
      modifiers: ['shift'],
      description: 'Show keyboard shortcuts',
      scope: 'global',
      preventDefault: true,
    }
  );

  const value: ShortcutContextValue = {
    showHelp: () => setIsHelpOpen(true),
    hideHelp: () => setIsHelpOpen(false),
    toggleHelp: () => setIsHelpOpen((prev) => !prev),
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
      <ShortcutHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </ShortcutContext.Provider>
  );
}
