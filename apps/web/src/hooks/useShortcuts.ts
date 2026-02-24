/**
 * useShortcuts Hook — F052: Keyboard Shortcuts System
 *
 * React hook for registering and managing keyboard shortcuts in components.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import type { ShortcutDefinition, ShortcutScope, ModifierKey } from '@/lib/shortcuts/types';

interface UseShortcutsOptions {
  scope?: ShortcutScope;
  enabled?: boolean;
}

/**
 * Register keyboard shortcuts for a component
 */
export function useShortcuts(
  shortcuts: Omit<ShortcutDefinition, 'id' | 'scope'>[],
  options: UseShortcutsOptions = {}
) {
  const { scope = 'canvas', enabled = true } = options;
  const manager = getShortcutManager();
  const shortcutsRef = useRef(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    // Register all shortcuts
    shortcuts.forEach((shortcut, index) => {
      const id = `${scope}:shortcut-${index}`;
      manager.register({
        ...shortcut,
        id,
        scope,
      });
    });

    // Add scope to active scopes
    manager.addScope(scope);

    // Cleanup
    return () => {
      shortcuts.forEach((shortcut, index) => {
        manager.unregister(scope, shortcut.keys, shortcut.modifiers);
      });
      manager.removeScope(scope);
    };
  }, [scope, enabled, manager, shortcuts]);
}

/**
 * Register a single keyboard shortcut
 */
export function useShortcut(
  keys: string[],
  action: () => void,
  options: {
    modifiers?: ModifierKey[];
    description?: string;
    scope?: ShortcutScope;
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const {
    modifiers,
    description = '',
    scope = 'canvas',
    enabled = true,
    preventDefault = true,
  } = options;

  const manager = getShortcutManager();
  const actionRef = useRef(action);

  // Update ref when action changes
  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    if (!enabled) return;

    const id = `${scope}:${keys.join('+')}-${modifiers?.join('+') || 'none'}`;
    
    manager.register({
      id,
      keys,
      modifiers,
      description,
      scope,
      action: () => actionRef.current(),
      preventDefault,
    });

    manager.addScope(scope);

    return () => {
      manager.unregister(scope, keys, modifiers);
      manager.removeScope(scope);
    };
  }, [keys, modifiers, description, scope, enabled, preventDefault, manager]);
}

/**
 * Hook to set active shortcut scope
 */
export function useShortcutScope(scope: ShortcutScope | ShortcutScope[]) {
  const manager = getShortcutManager();

  useEffect(() => {
    const scopes = Array.isArray(scope) ? scope : [scope];
    manager.setActiveScopes(scopes);

    return () => {
      manager.setActiveScopes(['global']);
    };
  }, [scope, manager]);
}

/**
 * Hook to enable/disable shortcuts globally
 */
export function useShortcutsEnabled(enabled: boolean) {
  const manager = getShortcutManager();

  useEffect(() => {
    manager.setEnabled(enabled);
  }, [enabled, manager]);
}

/**
 * Hook to listen for any shortcut execution
 */
export function useShortcutListener(callback: (event: KeyboardEvent) => void) {
  const manager = getShortcutManager();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = manager.addListener((event) => {
      callbackRef.current(event);
    });

    return unsubscribe;
  }, [manager]);
}

/**
 * Hook to format a key combination for display
 */
export function useFormattedShortcut(
  keys: string[],
  modifiers?: ModifierKey[]
): string {
  return useCallback(() => {
    const { ShortcutManager } = require('@/lib/shortcuts/ShortcutManager');
    return ShortcutManager.formatKeyCombo(keys, modifiers);
  }, [keys, modifiers])();
}
