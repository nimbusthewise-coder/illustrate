import { describe, it, expect, beforeEach } from 'vitest';
import { useColorStore } from './color-store';
import { MAX_RECENT_COLORS } from '@/types/color';

describe('colorStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useColorStore.setState({
      foreground: '#000000',
      background: '#ffffff',
      recentColors: [],
    });
  });

  describe('initial state', () => {
    it('has default black foreground and white background', () => {
      const state = useColorStore.getState();
      expect(state.foreground).toBe('#000000');
      expect(state.background).toBe('#ffffff');
      expect(state.recentColors).toEqual([]);
    });
  });

  describe('setForeground', () => {
    it('sets foreground color', () => {
      useColorStore.getState().setForeground('#ff0000');
      expect(useColorStore.getState().foreground).toBe('#ff0000');
    });

    it('adds color to recent colors', () => {
      useColorStore.getState().setForeground('#ff0000');
      expect(useColorStore.getState().recentColors).toContain('#ff0000');
    });
  });

  describe('setBackground', () => {
    it('sets background color', () => {
      useColorStore.getState().setBackground('#00ff00');
      expect(useColorStore.getState().background).toBe('#00ff00');
    });

    it('adds color to recent colors', () => {
      useColorStore.getState().setBackground('#00ff00');
      expect(useColorStore.getState().recentColors).toContain('#00ff00');
    });
  });

  describe('swapColors', () => {
    it('swaps foreground and background colors', () => {
      const store = useColorStore.getState();
      store.setForeground('#ff0000');
      store.setBackground('#00ff00');
      
      store.swapColors();
      
      expect(useColorStore.getState().foreground).toBe('#00ff00');
      expect(useColorStore.getState().background).toBe('#ff0000');
    });
  });

  describe('addRecentColor', () => {
    it('adds color to recent colors', () => {
      useColorStore.getState().addRecentColor('#ff0000');
      expect(useColorStore.getState().recentColors).toEqual(['#ff0000']);
    });

    it('does not add duplicate if already most recent', () => {
      const store = useColorStore.getState();
      store.addRecentColor('#ff0000');
      store.addRecentColor('#ff0000');
      expect(useColorStore.getState().recentColors).toEqual(['#ff0000']);
    });

    it('moves existing color to front', () => {
      const store = useColorStore.getState();
      store.addRecentColor('#ff0000');
      store.addRecentColor('#00ff00');
      store.addRecentColor('#ff0000');
      
      const recent = useColorStore.getState().recentColors;
      expect(recent[0]).toBe('#ff0000');
      expect(recent[1]).toBe('#00ff00');
      expect(recent.length).toBe(2);
    });

    it('limits recent colors to MAX_RECENT_COLORS', () => {
      const store = useColorStore.getState();
      
      // Add more colors than the limit
      for (let i = 0; i < MAX_RECENT_COLORS + 5; i++) {
        store.addRecentColor(`#${i.toString().padStart(6, '0')}`);
      }
      
      expect(useColorStore.getState().recentColors.length).toBe(MAX_RECENT_COLORS);
    });

    it('keeps most recently added colors', () => {
      const store = useColorStore.getState();
      
      // Add colors
      for (let i = 0; i < MAX_RECENT_COLORS + 2; i++) {
        store.addRecentColor(`#${i.toString().padStart(6, '0')}`);
      }
      
      const recent = useColorStore.getState().recentColors;
      // Most recent should be the last added
      expect(recent[0]).toBe(`#${(MAX_RECENT_COLORS + 1).toString().padStart(6, '0')}`);
    });
  });
});
