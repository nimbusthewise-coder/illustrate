/**
 * Shortcut Badge — F052: Keyboard Shortcuts System
 *
 * Badge component that displays keyboard shortcuts in menus and buttons.
 * Automatically formats based on platform (Mac/Windows/Linux).
 */

'use client';

import { ShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import type { ModifierKey } from '@/lib/shortcuts/types';

interface ShortcutBadgeProps {
  keys: string[];
  modifiers?: ModifierKey[];
  variant?: 'default' | 'compact' | 'minimal';
  className?: string;
}

export function ShortcutBadge({
  keys,
  modifiers,
  variant = 'default',
  className = '',
}: ShortcutBadgeProps) {
  const formatted = ShortcutManager.formatKeyCombo(keys, modifiers);

  if (variant === 'minimal') {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        {formatted}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <kbd
        className={`inline-flex items-center px-1 py-0.5 text-xs font-mono bg-muted/50 border border-border/50 rounded ${className}`}
      >
        {formatted}
      </kbd>
    );
  }

  return (
    <kbd
      className={`inline-flex items-center gap-0.5 px-2 py-1 text-xs font-mono bg-muted border border-border rounded shadow-sm ${className}`}
    >
      {formatted}
    </kbd>
  );
}

interface MenuItemWithShortcutProps {
  label: string;
  keys: string[];
  modifiers?: ModifierKey[];
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * MenuItem with integrated shortcut display
 */
export function MenuItemWithShortcut({
  label,
  keys,
  modifiers,
  onClick,
  disabled = false,
  icon,
  className = '',
}: MenuItemWithShortcutProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-between w-full px-3 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <ShortcutBadge keys={keys} modifiers={modifiers} variant="compact" />
    </button>
  );
}
