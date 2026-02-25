'use client';

import { useState, useEffect } from 'react';
import { useColorStore } from '@/stores/color-store';
import { ColorSwatch } from './ColorSwatch';
import { PRESET_COLORS } from '@/types/color';
import { isValidHex, normalizeHex, getContrastColor } from '@/utils/colorUtils';

/**
 * ColorPicker — main color selection interface.
 * Supports F064: Colour Picker for fg/bg.
 * 
 * Features:
 * - Foreground/background color selection
 * - Preset color palette
 * - Hex input
 * - Recent colors
 * - Swap colors (X key handled globally)
 */

type ColorTarget = 'foreground' | 'background';

export function ColorPicker() {
  const foreground = useColorStore((s) => s.foreground);
  const background = useColorStore((s) => s.background);
  const recentColors = useColorStore((s) => s.recentColors);
  const setForeground = useColorStore((s) => s.setForeground);
  const setBackground = useColorStore((s) => s.setBackground);
  const swapColors = useColorStore((s) => s.swapColors);

  const [activeTarget, setActiveTarget] = useState<ColorTarget>('foreground');
  const [hexInput, setHexInput] = useState('');
  const [hexError, setHexError] = useState('');

  // Sync hex input with active color
  useEffect(() => {
    const activeColor = activeTarget === 'foreground' ? foreground : background;
    setHexInput(activeColor);
    setHexError('');
  }, [activeTarget, foreground, background]);

  // Global keyboard shortcut for swapping colors (X key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only swap if not typing in an input
      if (e.key === 'x' || e.key === 'X') {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          swapColors();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swapColors]);

  const handlePresetClick = (color: string) => {
    if (activeTarget === 'foreground') {
      setForeground(color);
    } else {
      setBackground(color);
    }
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    setHexError('');
  };

  const handleHexInputSubmit = () => {
    const normalized = normalizeHex(hexInput);
    if (isValidHex(normalized)) {
      if (activeTarget === 'foreground') {
        setForeground(normalized);
      } else {
        setBackground(normalized);
      }
      setHexError('');
    } else {
      setHexError('Invalid hex color');
    }
  };

  const handleHexKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHexInputSubmit();
    }
  };

  const activeColor = activeTarget === 'foreground' ? foreground : background;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Colors</h3>
        <button
          type="button"
          onClick={swapColors}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
          aria-label="Swap foreground and background colors (X)"
          title="Swap colors (X)"
        >
          ⇄ Swap
        </button>
      </div>

      {/* Current Colors Display */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTarget('foreground')}
          className={`
            flex-1 p-3 rounded border-2 transition-all
            ${
              activeTarget === 'foreground'
                ? 'border-primary ring-2 ring-primary/50'
                : 'border-border hover:border-muted-foreground'
            }
          `}
          aria-label="Select foreground color"
        >
          <div className="text-xs text-muted-foreground mb-1">Foreground</div>
          <div
            className="w-full h-8 rounded border border-border"
            style={{ backgroundColor: foreground }}
            title={foreground}
          />
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            {foreground}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTarget('background')}
          className={`
            flex-1 p-3 rounded border-2 transition-all
            ${
              activeTarget === 'background'
                ? 'border-primary ring-2 ring-primary/50'
                : 'border-border hover:border-muted-foreground'
            }
          `}
          aria-label="Select background color"
        >
          <div className="text-xs text-muted-foreground mb-1">Background</div>
          <div
            className="w-full h-8 rounded border border-border"
            style={{ backgroundColor: background }}
            title={background}
          />
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            {background}
          </div>
        </button>
      </div>

      {/* Hex Input */}
      <div>
        <label
          htmlFor="hex-input"
          className="text-xs text-muted-foreground block mb-1"
        >
          Hex Color
        </label>
        <input
          id="hex-input"
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInputChange(e.target.value)}
          onKeyDown={handleHexKeyDown}
          onBlur={handleHexInputSubmit}
          className="w-full px-3 py-2 text-sm font-mono bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="#000000"
          maxLength={7}
        />
        {hexError && (
          <div className="text-xs text-error mt-1">{hexError}</div>
        )}
      </div>

      {/* Preset Palette */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">Preset Colors</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              onClick={() => handlePresetClick(color)}
              selected={activeColor === color}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <div>
          <div className="text-xs text-muted-foreground mb-2">
            Recent Colors
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((color, idx) => (
              <ColorSwatch
                key={`${color}-${idx}`}
                color={color}
                onClick={() => handlePresetClick(color)}
                selected={activeColor === color}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
