/**
 * Tinker Design System - Theme Store
 * 
 * Zustand store for theme persistence.
 * Default: Standard theme, Light mode
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ThemeId, type Mode, DEFAULT_THEME, DEFAULT_MODE } from '../lib/themes';

const THEME_STORAGE_KEY = 'tinker-theme';

interface ThemeState {
  themeId: ThemeId;
  mode: Mode;
  setThemeId: (themeId: ThemeId) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME,
      mode: DEFAULT_MODE,
      setThemeId: (themeId) => set({ themeId }),
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: THEME_STORAGE_KEY,
    }
  )
);
