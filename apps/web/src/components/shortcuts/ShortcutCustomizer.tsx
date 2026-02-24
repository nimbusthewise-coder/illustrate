/**
 * Shortcut Customizer — F052: Keyboard Shortcuts System
 *
 * UI for customizing keyboard shortcuts and detecting conflicts.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, AlertCircle } from 'lucide-react';
import { DEFAULT_SHORTCUTS } from '@/lib/shortcuts/defaultShortcuts';
import { getShortcutManager, ShortcutManager } from '@/lib/shortcuts/ShortcutManager';
import {
  loadShortcutPreferences,
  saveShortcutPreferences,
  clearShortcutPreferences,
} from '@/lib/storage/shortcutPreferences';
import type {
  ShortcutBinding,
  ShortcutCategory,
  ShortcutPreferences,
  ModifierKey,
} from '@/lib/shortcuts/types';

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

export function ShortcutCustomizer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [preferences, setPreferences] = useState<ShortcutPreferences>({
    customBindings: {},
    disabledShortcuts: [],
  });
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState<{
    keys: string[];
    modifiers: ModifierKey[];
  } | null>(null);

  // Load preferences on mount
  useEffect(() => {
    setPreferences(loadShortcutPreferences());
  }, []);

  // Filter shortcuts based on search
  const filteredShortcuts = useMemo(() => {
    if (!searchQuery) return DEFAULT_SHORTCUTS;

    const query = searchQuery.toLowerCase();
    return DEFAULT_SHORTCUTS.filter(
      (shortcut) =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.id.toLowerCase().includes(query) ||
        ShortcutManager.formatKeyCombo(shortcut.keys, shortcut.modifiers)
          .toLowerCase()
          .includes(query)
    );
  }, [searchQuery]);

  // Group shortcuts by category
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

    filteredShortcuts.forEach((shortcut) => {
      groups[shortcut.category].push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  const handleResetAll = () => {
    if (confirm('Reset all shortcuts to defaults?')) {
      clearShortcutPreferences();
      setPreferences({ customBindings: {}, disabledShortcuts: [] });
    }
  };

  const handleResetShortcut = (shortcutId: string) => {
    const newPreferences = { ...preferences };
    delete newPreferences.customBindings[shortcutId];
    newPreferences.disabledShortcuts = newPreferences.disabledShortcuts.filter(
      (id) => id !== shortcutId
    );
    setPreferences(newPreferences);
    saveShortcutPreferences(newPreferences);
  };

  const handleStartRecording = (shortcutId: string) => {
    setEditingShortcut(shortcutId);
    setRecordingKeys(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingShortcut) return;

    e.preventDefault();
    e.stopPropagation();

    const key = e.key.toLowerCase();
    const modifiers: ModifierKey[] = [];

    if (e.ctrlKey || e.metaKey) modifiers.push(e.metaKey ? 'meta' : 'ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');

    // Ignore modifier-only presses
    if (['control', 'alt', 'shift', 'meta'].includes(key)) {
      return;
    }

    setRecordingKeys({ keys: [key], modifiers });
  };

  const handleSaveBinding = () => {
    if (!editingShortcut || !recordingKeys) return;

    const manager = getShortcutManager();
    const shortcut = DEFAULT_SHORTCUTS.find((s) => s.id === editingShortcut);
    if (!shortcut) return;

    // Check for conflicts
    const conflict = manager.checkConflict(
      {
        ...shortcut,
        keys: recordingKeys.keys,
        modifiers: recordingKeys.modifiers,
      },
      shortcut.scope
    );

    if (conflict) {
      if (
        !confirm(
          `This shortcut conflicts with "${conflict.existing.description}". Continue?`
        )
      ) {
        return;
      }
    }

    const newPreferences = { ...preferences };
    newPreferences.customBindings[editingShortcut] = {
      keys: recordingKeys.keys,
      modifiers: recordingKeys.modifiers,
    };
    setPreferences(newPreferences);
    saveShortcutPreferences(newPreferences);
    setEditingShortcut(null);
    setRecordingKeys(null);
  };

  const handleCancelRecording = () => {
    setEditingShortcut(null);
    setRecordingKeys(null);
  };

  const getDisplayBinding = (shortcut: ShortcutBinding) => {
    const custom = preferences.customBindings[shortcut.id];
    if (custom) {
      return ShortcutManager.formatKeyCombo(custom.keys, custom.modifiers);
    }
    return ShortcutManager.formatKeyCombo(shortcut.keys, shortcut.modifiers);
  };

  const isCustomized = (shortcutId: string) => {
    return !!preferences.customBindings[shortcutId];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize shortcuts to match your workflow
          </p>
        </div>
        <button
          onClick={handleResetAll}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset All
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Recording Modal */}
      {editingShortcut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleCancelRecording}
          />
          <div
            className="relative z-10 bg-card border border-border rounded-xl p-6 shadow-2xl max-w-md w-full"
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Record New Shortcut
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Press your desired key combination
            </p>
            <div className="flex items-center justify-center h-20 bg-muted border border-border rounded-lg mb-4">
              {recordingKeys ? (
                <kbd className="text-2xl font-mono">
                  {ShortcutManager.formatKeyCombo(
                    recordingKeys.keys,
                    recordingKeys.modifiers
                  )}
                </kbd>
              ) : (
                <span className="text-muted-foreground">Waiting...</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBinding}
                disabled={!recordingKeys}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Save
              </button>
              <button
                onClick={handleCancelRecording}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts List */}
      <div className="space-y-6">
        {CATEGORY_ORDER.map((category) => {
          const shortcuts = groupedShortcuts[category];
          if (shortcuts.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="space-y-1">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        {shortcut.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {shortcut.scope} scope
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleStartRecording(shortcut.id)}
                        className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 border border-border rounded transition-colors"
                      >
                        <kbd className="font-mono">
                          {getDisplayBinding(shortcut)}
                        </kbd>
                      </button>
                      {isCustomized(shortcut.id) && (
                        <button
                          onClick={() => handleResetShortcut(shortcut.id)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                          title="Reset to default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Note</p>
          <p>
            Custom shortcuts will override defaults. Some browser shortcuts
            cannot be overridden due to system restrictions.
          </p>
        </div>
      </div>
    </div>
  );
}
