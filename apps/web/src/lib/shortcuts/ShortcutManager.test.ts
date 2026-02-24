/**
 * ShortcutManager Tests — F052: Keyboard Shortcuts System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShortcutManager } from './ShortcutManager';
import type { ShortcutDefinition } from './types';

describe('ShortcutManager', () => {
  let manager: ShortcutManager;

  beforeEach(() => {
    manager = new ShortcutManager();
  });

  afterEach(() => {
    manager.stop();
  });

  describe('register and unregister', () => {
    it('should register a shortcut', () => {
      const shortcut: ShortcutDefinition = {
        id: 'test',
        keys: ['a'],
        description: 'Test shortcut',
        scope: 'global',
        action: vi.fn(),
      };

      manager.register(shortcut);
      const shortcuts = manager.getShortcuts('global');
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it('should unregister a shortcut', () => {
      const shortcut: ShortcutDefinition = {
        id: 'test',
        keys: ['a'],
        description: 'Test shortcut',
        scope: 'global',
        action: vi.fn(),
      };

      manager.register(shortcut);
      manager.unregister('global', ['a']);
      
      const shortcuts = manager.getShortcuts('global');
      expect(shortcuts.find(s => s.id === 'test')).toBeUndefined();
    });
  });

  describe('scope management', () => {
    it('should set active scopes', () => {
      manager.setActiveScopes(['canvas', 'global']);
      // Global is always active, so we can't directly test, but no error should be thrown
      expect(() => manager.setActiveScopes(['canvas'])).not.toThrow();
    });

    it('should add and remove scopes', () => {
      manager.addScope('canvas');
      manager.removeScope('canvas');
      expect(() => manager.removeScope('canvas')).not.toThrow();
    });

    it('should not remove global scope', () => {
      manager.removeScope('global');
      // Should still work, just won't actually remove global
      expect(() => manager.setActiveScopes(['canvas'])).not.toThrow();
    });
  });

  describe('conflict detection', () => {
    it('should detect conflicts in same scope', () => {
      const shortcut1: ShortcutDefinition = {
        id: 'test1',
        keys: ['a'],
        modifiers: ['ctrl'],
        description: 'Test 1',
        scope: 'global',
        action: vi.fn(),
      };

      manager.register(shortcut1);

      const conflict = manager.checkConflict({
        id: 'test2',
        keys: ['a'],
        modifiers: ['ctrl'],
        description: 'Test 2',
        scope: 'global',
        category: 'system',
      });

      expect(conflict).not.toBeNull();
      // The ID will be either 'global:ctrl+a' or 'global:meta+a' depending on platform
      expect(conflict?.existing.id).toMatch(/^global:(ctrl|meta)\+a$/);
    });

    it('should not detect conflicts in different scopes', () => {
      const shortcut1: ShortcutDefinition = {
        id: 'test1',
        keys: ['a'],
        description: 'Test 1',
        scope: 'canvas',
        action: vi.fn(),
      };

      manager.register(shortcut1);

      const conflict = manager.checkConflict(
        {
          id: 'test2',
          keys: ['a'],
          description: 'Test 2',
          scope: 'library',
          category: 'system',
        },
        'library'
      );

      expect(conflict).toBeNull();
    });
  });

  describe('formatKeyCombo', () => {
    it('should format key combo correctly', () => {
      const formatted = ShortcutManager.formatKeyCombo(['a'], ['ctrl']);
      // Format varies by platform, but should contain both parts
      expect(formatted).toMatch(/[Cc]trl|⌘/);
      expect(formatted.toUpperCase()).toContain('A');
    });

    it('should format multiple modifiers', () => {
      const formatted = ShortcutManager.formatKeyCombo(['a'], ['ctrl', 'shift']);
      expect(formatted).toMatch(/[Cc]trl|⌘/);
      expect(formatted).toMatch(/[Ss]hift|⇧/);
    });
  });

  describe('enable/disable', () => {
    it('should enable and disable', () => {
      expect(() => manager.setEnabled(false)).not.toThrow();
      expect(() => manager.setEnabled(true)).not.toThrow();
    });
  });

  describe('clearScope', () => {
    it('should clear all shortcuts in a scope', () => {
      manager.register({
        id: 'test1',
        keys: ['a'],
        description: 'Test',
        scope: 'canvas',
        action: vi.fn(),
      });

      manager.register({
        id: 'test2',
        keys: ['b'],
        description: 'Test',
        scope: 'canvas',
        action: vi.fn(),
      });

      manager.clearScope('canvas');
      const shortcuts = manager.getShortcuts('canvas');
      expect(shortcuts.length).toBe(0);
    });
  });
});
