/**
 * Shortcut Help Modal — F052: Keyboard Shortcuts System
 *
 * Displays all available keyboard shortcuts organized by category.
 */

'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts/defaultShortcuts';
import { ShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import type { ShortcutBinding, ShortcutCategory } from '@/lib/shortcuts/types';

interface ShortcutHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  editing: 'Editing',
  canvas: 'Canvas',
  navigation: 'Navigation',
  tools: 'Tools',
  layers: 'Layers',
  components: 'Components',
  system: 'System',
};

const CATEGORY_ORDER: ShortcutCategory[] = [
  'system',
  'editing',
  'canvas',
  'tools',
  'navigation',
  'layers',
  'components',
];

export function ShortcutHelpModal({ isOpen, onClose }: ShortcutHelpModalProps) {
  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, ShortcutBinding[]> = {
      editing: [],
      canvas: [],
      navigation: [],
      tools: [],
      layers: [],
      components: [],
      system: [],
    };

    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      groups[shortcut.category].push(shortcut);
    });

    return groups;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] overflow-hidden bg-card border border-border rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Boost your productivity with these keyboard shortcuts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-5rem)] px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORY_ORDER.map((category) => {
              const shortcuts = groupedShortcuts[category];
              if (shortcuts.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-1.5 gap-4"
                      >
                        <span className="text-sm text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm whitespace-nowrap">
                          {ShortcutManager.formatKeyCombo(
                            shortcut.keys,
                            shortcut.modifiers
                          )}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs bg-background border border-border rounded">?</kbd>{' '}
            to show this help at any time
          </p>
        </div>
      </div>
    </div>
  );
}
