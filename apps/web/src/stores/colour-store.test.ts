import { describe, it, expect, beforeEach } from 'vitest';
import { useColourStore, PRESET_COLOURS } from './colour-store';

describe('Colour Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useColourStore.setState({
      foreground: '#000000',
      background: '#ffffff',
      recentColours: [],
    });
  });

  it('should initialize with default colours', () => {
    const state = useColourStore.getState();
    expect(state.foreground).toBe('#000000');
    expect(state.background).toBe('#ffffff');
    expect(state.recentColours).toEqual([]);
  });

  it('should set foreground colour and add to recent', () => {
    const { setForeground } = useColourStore.getState();
    setForeground('#ff0000');
    
    const state = useColourStore.getState();
    expect(state.foreground).toBe('#ff0000');
    expect(state.recentColours).toContain('#ff0000');
  });

  it('should set background colour and add to recent', () => {
    const { setBackground } = useColourStore.getState();
    setBackground('#00ff00');
    
    const state = useColourStore.getState();
    expect(state.background).toBe('#00ff00');
    expect(state.recentColours).toContain('#00ff00');
  });

  it('should swap foreground and background colours', () => {
    const { setForeground, setBackground, swapColours } = useColourStore.getState();
    
    setForeground('#ff0000');
    setBackground('#0000ff');
    
    swapColours();
    
    const state = useColourStore.getState();
    expect(state.foreground).toBe('#0000ff');
    expect(state.background).toBe('#ff0000');
  });

  it('should maintain recent colours list with max 10 items', () => {
    const { setForeground } = useColourStore.getState();
    
    // Add 15 colours
    for (let i = 0; i < 15; i++) {
      const colour = `#${i.toString(16).padStart(6, '0')}`;
      setForeground(colour);
    }
    
    const state = useColourStore.getState();
    expect(state.recentColours.length).toBe(10);
  });

  it('should move existing colour to front of recent list', () => {
    const { setForeground } = useColourStore.getState();
    
    setForeground('#ff0000');
    setForeground('#00ff00');
    setForeground('#0000ff');
    
    // Set red again - should move to front
    setForeground('#ff0000');
    
    const state = useColourStore.getState();
    expect(state.recentColours[0]).toBe('#ff0000');
    expect(state.recentColours.length).toBe(3);
  });

  it('should normalize colour case in recent list', () => {
    const { setForeground } = useColourStore.getState();
    
    setForeground('#FF0000');
    setForeground('#Ff0000'); // Same colour, different case
    
    const state = useColourStore.getState();
    // Should only have one entry
    expect(state.recentColours.length).toBe(1);
    expect(state.recentColours[0]).toBe('#ff0000');
  });

  it('should have correct preset colours', () => {
    expect(PRESET_COLOURS).toHaveLength(16);
    expect(PRESET_COLOURS).toContain('#000000');
    expect(PRESET_COLOURS).toContain('#ffffff');
    expect(PRESET_COLOURS).toContain('#ff0000');
    expect(PRESET_COLOURS).toContain('#00ff00');
    expect(PRESET_COLOURS).toContain('#0000ff');
  });

  it('should handle rapid colour changes', () => {
    const { setForeground, setBackground } = useColourStore.getState();
    
    setForeground('#ff0000');
    setBackground('#00ff00');
    setForeground('#0000ff');
    setBackground('#ffff00');
    
    const state = useColourStore.getState();
    expect(state.foreground).toBe('#0000ff');
    expect(state.background).toBe('#ffff00');
    expect(state.recentColours.length).toBe(4);
  });
});
