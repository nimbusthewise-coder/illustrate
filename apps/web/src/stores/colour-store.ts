import { create } from 'zustand';

interface ColourState {
  foreground: string;
  background: string;
  recentColours: string[];
  setForeground: (colour: string) => void;
  setBackground: (colour: string) => void;
  swapColours: () => void;
  addToRecent: (colour: string) => void;
}

// Default preset palette
export const PRESET_COLOURS = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#808080', // Gray
  '#c0c0c0', // Silver
  '#800000', // Maroon
  '#008000', // Dark Green
  '#000080', // Navy
  '#808000', // Olive
  '#800080', // Purple
  '#008080', // Teal
];

const MAX_RECENT_COLOURS = 10;

export const useColourStore = create<ColourState>((set, get) => ({
  foreground: '#000000',
  background: '#ffffff',
  recentColours: [],

  setForeground: (colour: string) => {
    set({ foreground: colour });
    get().addToRecent(colour);
  },

  setBackground: (colour: string) => {
    set({ background: colour });
    get().addToRecent(colour);
  },

  swapColours: () => {
    const { foreground, background } = get();
    set({
      foreground: background,
      background: foreground,
    });
  },

  addToRecent: (colour: string) => {
    set((state) => {
      const normalizedColour = colour.toLowerCase();
      // Remove if already exists
      const filtered = state.recentColours.filter(
        (c) => c.toLowerCase() !== normalizedColour
      );
      // Add to beginning
      const updated = [normalizedColour, ...filtered];
      // Keep only MAX_RECENT_COLOURS
      return {
        recentColours: updated.slice(0, MAX_RECENT_COLOURS),
      };
    });
  },
}));
