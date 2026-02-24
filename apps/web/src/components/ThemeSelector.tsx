/**
 * Tinker Design System - Theme Selector
 * 
 * A simple dropdown + toggle component for switching themes and modes.
 * Customize or replace with your own UI as needed.
 */

'use client';

import { useThemeStore } from '../stores/theme-store';
import { themes, themeIds, type ThemeId } from '../lib/themes';

export function ThemeSelector() {
  const { themeId, mode, setThemeId, toggleMode } = useThemeStore();
  const currentTheme = themes[themeId];

  return (
    <div className="flex items-center gap-3 p-2 bg-muted rounded-lg border border-border">
      {/* Theme dropdown */}
      <select
        value={themeId}
        onChange={(e) => setThemeId(e.target.value as ThemeId)}
        className="px-3 py-1.5 rounded-md border border-border bg-background text-foreground text-sm cursor-pointer min-w-[160px]"
      >
        {themeIds.map((id) => (
          <option key={id} value={id}>
            {themes[id].name}
          </option>
        ))}
      </select>

      {/* Mode toggle */}
      <button
        onClick={toggleMode}
        className="px-3 py-1.5 rounded-md border border-border bg-primary text-primary-foreground text-sm cursor-pointer font-medium hover:opacity-90 transition-opacity"
      >
        {mode === 'light' ? '☀️ Light' : '🌙 Dark'}
      </button>

      {/* Accent preview */}
      <div
        className="w-6 h-6 rounded-md border border-border"
        style={{ backgroundColor: currentTheme[mode].accent }}
        title={`${currentTheme.name} accent color`}
      />
    </div>
  );
}

/**
 * Minimal mode toggle button (for use in headers/toolbars)
 */
export function ModeToggle() {
  const { mode, toggleMode } = useThemeStore();

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
    >
      {mode === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
