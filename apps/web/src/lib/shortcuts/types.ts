/**
 * Keyboard Shortcuts Types — F052: Keyboard Shortcuts System
 *
 * Type definitions for the keyboard shortcuts system.
 */

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta';

export type ShortcutScope = 'global' | 'canvas' | 'library' | 'settings';

export interface ShortcutDefinition {
  id: string;
  keys: string[];
  modifiers?: ModifierKey[];
  description: string;
  scope: ShortcutScope;
  action: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

export interface ShortcutBinding {
  id: string;
  keys: string[];
  modifiers?: ModifierKey[];
  description: string;
  scope: ShortcutScope;
  category: ShortcutCategory;
}

export type ShortcutCategory = 
  | 'canvas'
  | 'editing'
  | 'navigation'
  | 'tools'
  | 'layers'
  | 'components'
  | 'system';

export interface ShortcutConflict {
  existing: ShortcutBinding;
  new: ShortcutBinding;
  keyCombo: string;
}

export interface ShortcutPreferences {
  customBindings: Record<string, { keys: string[]; modifiers?: ModifierKey[] }>;
  disabledShortcuts: string[];
}
