import { create } from 'zustand';
import { MAX_RECENT_COLORS } from '@/types/color';

/**
 * Color store for managing foreground/background colors and recent colors.
 * Supports F064: Colour Picker for fg/bg.
 */

export interface ColorStoreState {
  /** Current foreground color (hex) */
  foreground: string;
  /** Current background color (hex) */
  background: string;
  /** Recently used colors (hex) */
  recentColors: string[];

  /** Set foreground color */
  setForeground: (color: string) => void;
  /** Set background color */
  setBackground: (color: string) => void;
  /** Swap foreground and background colors */
  swapColors: () => void;
  /** Add color to recent colors */
  addRecentColor: (color: string) => void;
}

export const useColorStore = create<ColorStoreState>((set, get) => ({
  foreground: '#000000', // Default black
  background: '#ffffff', // Default white
  recentColors: [],

  setForeground: (color: string) => {
    set({ foreground: color });
    get().addRecentColor(color);
  },

  setBackground: (color: string) => {
    set({ background: color });
    get().addRecentColor(color);
  },

  swapColors: () => {
    const { foreground, background } = get();
    set({
      foreground: background,
      background: foreground,
    });
  },

  addRecentColor: (color: string) => {
    const { recentColors } = get();
    // Don't add if it's already the most recent
    if (recentColors[0] === color) return;

    // Remove color if it exists elsewhere in the array
    const filtered = recentColors.filter((c) => c !== color);
    
    // Add to front and limit to MAX_RECENT_COLORS
    const updated = [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    
    set({ recentColors: updated });
  },
}));
