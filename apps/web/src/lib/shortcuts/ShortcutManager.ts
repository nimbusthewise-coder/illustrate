/**
 * Keyboard Shortcut Manager — F052: Keyboard Shortcuts System
 *
 * Centralized keyboard shortcut handling with:
 * - Event listening and dispatch
 * - Scope management (global vs. context-specific)
 * - Conflict detection
 * - Custom binding support
 */

import type {
  ShortcutDefinition,
  ShortcutBinding,
  ShortcutScope,
  ModifierKey,
  ShortcutConflict,
} from './types';

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private activeScopes: Set<ShortcutScope> = new Set(['global']);
  private enabled = true;
  private listeners: Set<(event: KeyboardEvent) => void> = new Set();

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: ShortcutDefinition): void {
    const keyCombo = this.getKeyCombo(shortcut.keys, shortcut.modifiers);
    const id = `${shortcut.scope}:${keyCombo}`;
    
    this.shortcuts.set(id, { ...shortcut, id });
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(scope: ShortcutScope, keys: string[], modifiers?: ModifierKey[]): void {
    const keyCombo = this.getKeyCombo(keys, modifiers);
    const id = `${scope}:${keyCombo}`;
    this.shortcuts.delete(id);
  }

  /**
   * Clear all shortcuts for a specific scope
   */
  clearScope(scope: ShortcutScope): void {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (shortcut.scope === scope) {
        this.shortcuts.delete(id);
      }
    }
  }

  /**
   * Set active scopes (controls which shortcuts are active)
   */
  setActiveScopes(scopes: ShortcutScope[]): void {
    this.activeScopes.clear();
    scopes.forEach((scope) => this.activeScopes.add(scope));
    // Global scope is always active
    this.activeScopes.add('global');
  }

  /**
   * Add a scope to the active scopes
   */
  addScope(scope: ShortcutScope): void {
    this.activeScopes.add(scope);
  }

  /**
   * Remove a scope from active scopes
   */
  removeScope(scope: ShortcutScope): void {
    if (scope !== 'global') {
      this.activeScopes.delete(scope);
    }
  }

  /**
   * Check if a shortcut combination would conflict with existing shortcuts
   */
  checkConflict(
    binding: ShortcutBinding,
    scope?: ShortcutScope
  ): ShortcutConflict | null {
    const keyCombo = this.getKeyCombo(binding.keys, binding.modifiers);
    
    for (const [id, existing] of this.shortcuts.entries()) {
      if (scope && existing.scope !== scope && existing.scope !== 'global') {
        continue;
      }
      
      const existingCombo = this.getKeyCombo(existing.keys, existing.modifiers);
      if (existingCombo === keyCombo && existing.id !== binding.id) {
        return {
          existing: this.shortcutToBinding(existing),
          new: binding,
          keyCombo,
        };
      }
    }
    
    return null;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(scope?: ShortcutScope): ShortcutBinding[] {
    const shortcuts: ShortcutBinding[] = [];
    
    for (const shortcut of this.shortcuts.values()) {
      if (!scope || shortcut.scope === scope) {
        shortcuts.push(this.shortcutToBinding(shortcut));
      }
    }
    
    return shortcuts;
  }

  /**
   * Enable/disable the shortcut manager
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Start listening for keyboard events
   */
  start(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * Stop listening for keyboard events
   */
  stop(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * Main keyboard event handler
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Ignore shortcuts when typing in inputs/textareas
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    const pressedKey = event.key.toLowerCase();
    const modifiers: ModifierKey[] = [];
    
    if (event.ctrlKey || event.metaKey) modifiers.push(event.metaKey ? 'meta' : 'ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    // Try to find a matching shortcut in active scopes
    for (const scope of this.activeScopes) {
      const keyCombo = this.getKeyCombo([pressedKey], modifiers);
      const id = `${scope}:${keyCombo}`;
      const shortcut = this.shortcuts.get(id);

      if (shortcut && shortcut.enabled !== false) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        
        try {
          shortcut.action();
        } catch (error) {
          console.error(`Error executing shortcut ${id}:`, error);
        }
        
        // Notify listeners
        this.listeners.forEach((listener) => listener(event));
        
        return; // Only execute the first matching shortcut
      }
    }
  }

  /**
   * Add a listener for shortcut events
   */
  addListener(listener: (event: KeyboardEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Generate a key combo string for identification
   */
  private getKeyCombo(keys: string[], modifiers?: ModifierKey[]): string {
    const parts: string[] = [];
    
    if (modifiers?.includes('ctrl') || modifiers?.includes('meta')) {
      parts.push(this.isMac() ? 'meta' : 'ctrl');
    }
    if (modifiers?.includes('alt')) parts.push('alt');
    if (modifiers?.includes('shift')) parts.push('shift');
    
    parts.push(...keys.map((k) => k.toLowerCase()));
    
    return parts.join('+');
  }

  /**
   * Convert ShortcutDefinition to ShortcutBinding
   */
  private shortcutToBinding(shortcut: ShortcutDefinition): ShortcutBinding {
    // Extract category from scope or id
    const category = this.getCategoryFromId(shortcut.id);
    
    return {
      id: shortcut.id,
      keys: shortcut.keys,
      modifiers: shortcut.modifiers,
      description: shortcut.description,
      scope: shortcut.scope,
      category,
    };
  }

  /**
   * Extract category from shortcut ID
   */
  private getCategoryFromId(id: string): ShortcutCategory {
    if (id.includes('canvas')) return 'canvas';
    if (id.includes('layer')) return 'layers';
    if (id.includes('component')) return 'components';
    if (id.includes('tool')) return 'tools';
    if (id.includes('nav') || id.includes('zoom')) return 'navigation';
    if (id.includes('undo') || id.includes('redo') || id.includes('delete') || id.includes('copy')) return 'editing';
    return 'system';
  }

  /**
   * Check if running on macOS
   */
  private isMac(): boolean {
    return typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
  }

  /**
   * Format key combo for display
   */
  static formatKeyCombo(keys: string[], modifiers?: ModifierKey[]): string {
    const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform);
    const parts: string[] = [];
    
    if (modifiers?.includes('ctrl') || modifiers?.includes('meta')) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (modifiers?.includes('alt')) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (modifiers?.includes('shift')) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    
    parts.push(...keys.map((k) => k.toUpperCase()));
    
    return parts.join(isMac ? '' : '+');
  }
}

// Singleton instance
let instance: ShortcutManager | null = null;

export function getShortcutManager(): ShortcutManager {
  if (!instance) {
    instance = new ShortcutManager();
  }
  return instance;
}

// Type import for category
type ShortcutCategory = 
  | 'canvas'
  | 'editing'
  | 'navigation'
  | 'tools'
  | 'layers'
  | 'components'
  | 'system';
