/**
 * Shortcut Hint — F052: Keyboard Shortcuts System
 *
 * Displays keyboard shortcut hints in tooltips and UI elements.
 */

'use client';

import { ShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import type { ModifierKey } from '@/lib/shortcuts/types';

interface ShortcutHintProps {
  keys: string[];
  modifiers?: ModifierKey[];
  className?: string;
}

export function ShortcutHint({ keys, modifiers, className = '' }: ShortcutHintProps) {
  const formatted = ShortcutManager.formatKeyCombo(keys, modifiers);

  return (
    <kbd
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm ${className}`}
    >
      {formatted}
    </kbd>
  );
}

interface ShortcutBadgeProps {
  keys: string[];
  modifiers?: ModifierKey[];
  label: string;
  className?: string;
}

export function ShortcutBadge({ keys, modifiers, label, className = '' }: ShortcutBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <ShortcutHint keys={keys} modifiers={modifiers} />
    </div>
  );
}
