/**
 * Shortcut Preferences Storage — F052: Keyboard Shortcuts System
 *
 * Persists custom keyboard shortcuts to localStorage.
 */

import type { ShortcutPreferences } from '../shortcuts/types';

const STORAGE_KEY = 'illustrate:shortcuts';

/**
 * Load shortcut preferences from localStorage
 */
export function loadShortcutPreferences(): ShortcutPreferences {
  if (typeof window === 'undefined') {
    return { customBindings: {}, disabledShortcuts: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { customBindings: {}, disabledShortcuts: [] };
    }

    const parsed = JSON.parse(stored);
    return {
      customBindings: parsed.customBindings || {},
      disabledShortcuts: parsed.disabledShortcuts || [],
    };
  } catch (error) {
    console.error('Failed to load shortcut preferences:', error);
    return { customBindings: {}, disabledShortcuts: [] };
  }
}

/**
 * Save shortcut preferences to localStorage
 */
export function saveShortcutPreferences(preferences: ShortcutPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save shortcut preferences:', error);
  }
}

/**
 * Clear all custom shortcut preferences
 */
export function clearShortcutPreferences(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear shortcut preferences:', error);
  }
}
