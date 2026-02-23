/**
 * BUG-001 Test: Text tool input modal behavior
 * 
 * Verifies that typing in text tool does not trigger tool shortcuts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useToolStore } from '@/stores/tool-store';
import { useColourStore } from '@/stores/colour-store';

describe('BUG-001: Text tool modal input', () => {
  beforeEach(() => {
    // Reset stores before each test
    useToolStore.setState({
      currentTool: 'select',
      isInputActive: false,
      textCursor: null,
      settings: { eraserSize: 1 },
    });
    useColourStore.setState({
      foreground: '#FFFFFF',
      background: '#000000',
      recentColours: [],
    });
  });

  it('should switch tools with keyboard shortcuts when NOT in input mode', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Press 'e' - should activate eraser
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'e' });
      window.dispatchEvent(event);
    });
    
    expect(useToolStore.getState().currentTool).toBe('eraser');
  });

  it('should NOT switch tools when text tool is in input mode', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Activate text tool and set input mode
    act(() => {
      useToolStore.setState({
        currentTool: 'text',
        isInputActive: true,
        textCursor: { col: 0, row: 0, visible: true },
      });
    });
    
    const initialTool = useToolStore.getState().currentTool;
    
    // Press 'e' - should NOT activate eraser because we're typing
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'e' });
      window.dispatchEvent(event);
    });
    
    // Tool should remain 'text'
    expect(useToolStore.getState().currentTool).toBe(initialTool);
    expect(useToolStore.getState().currentTool).toBe('text');
  });

  it('should NOT swap colours when in input mode', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Set initial colours
    act(() => {
      useColourStore.setState({ foreground: '#FFFFFF', background: '#000000' });
    });
    
    // Activate input mode
    act(() => {
      useToolStore.setState({ isInputActive: true });
    });
    
    const initialForeground = useColourStore.getState().foreground;
    const initialBackground = useColourStore.getState().background;
    
    // Press 'x' - should NOT swap colours
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'x' });
      window.dispatchEvent(event);
    });
    
    expect(useColourStore.getState().foreground).toBe(initialForeground);
    expect(useColourStore.getState().background).toBe(initialBackground);
  });

  it('should exit input mode when ESCAPE is pressed', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Activate input mode
    act(() => {
      useToolStore.setState({
        currentTool: 'text',
        isInputActive: true,
        textCursor: { col: 5, row: 3, visible: true },
      });
    });
    
    expect(useToolStore.getState().isInputActive).toBe(true);
    expect(useToolStore.getState().textCursor).not.toBeNull();
    
    // Press ESCAPE
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
    });
    
    // Input mode should be exited
    expect(useToolStore.getState().isInputActive).toBe(false);
    expect(useToolStore.getState().textCursor).toBeNull();
  });

  it('should re-enable shortcuts after exiting input mode', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Activate input mode
    act(() => {
      useToolStore.setState({
        currentTool: 'text',
        isInputActive: true,
      });
    });
    
    // Press 'e' - should NOT switch tools
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'e' });
      window.dispatchEvent(event);
    });
    expect(useToolStore.getState().currentTool).toBe('text');
    
    // Press ESCAPE to exit input mode
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);
    });
    
    // Now press 'e' again - should switch to eraser
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'e' });
      window.dispatchEvent(event);
    });
    expect(useToolStore.getState().currentTool).toBe('eraser');
  });

  it('should ignore shortcuts when typing in HTML input elements', () => {
    renderHook(() => useKeyboardShortcuts());
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    
    // Press 'e' while focused on input - should NOT switch tools
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'e', bubbles: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });
      window.dispatchEvent(event);
    });
    
    expect(useToolStore.getState().currentTool).toBe('select');
    
    document.body.removeChild(input);
  });

  it('should accept all letter keys in text input mode without switching tools', () => {
    renderHook(() => useKeyboardShortcuts());
    
    // Activate input mode
    act(() => {
      useToolStore.setState({
        currentTool: 'text',
        isInputActive: true,
      });
    });
    
    // Try all tool shortcut keys
    const shortcutKeys = ['v', 'u', 'l', 't', 'e', 'f'];
    
    shortcutKeys.forEach(key => {
      act(() => {
        const event = new KeyboardEvent('keydown', { key });
        window.dispatchEvent(event);
      });
      
      // Tool should remain 'text'
      expect(useToolStore.getState().currentTool).toBe('text');
    });
  });
});
