'use client';

import { useState } from 'react';
import { useColourStore, PRESET_COLOURS } from '@/stores/colour-store';

export function ColourPicker() {
  const {
    foreground,
    background,
    recentColours,
    setForeground,
    setBackground,
    swapColours,
  } = useColourStore();

  const [fgHexInput, setFgHexInput] = useState(foreground);
  const [bgHexInput, setBgHexInput] = useState(background);
  const [activeTab, setActiveTab] = useState<'foreground' | 'background'>('foreground');

  const isValidHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleFgHexChange = (value: string) => {
    setFgHexInput(value);
    if (isValidHex(value)) {
      setForeground(value);
    }
  };

  const handleBgHexChange = (value: string) => {
    setBgHexInput(value);
    if (isValidHex(value)) {
      setBackground(value);
    }
  };

  const handlePresetClick = (colour: string) => {
    if (activeTab === 'foreground') {
      setForeground(colour);
      setFgHexInput(colour);
    } else {
      setBackground(colour);
      setBgHexInput(colour);
    }
  };

  const handleRecentClick = (colour: string) => {
    if (activeTab === 'foreground') {
      setForeground(colour);
      setFgHexInput(colour);
    } else {
      setBackground(colour);
      setBgHexInput(colour);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Colours</h3>
        <button
          onClick={swapColours}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Swap foreground/background (X)"
        >
          ⇄ Swap (X)
        </button>
      </div>

      {/* Active colours display */}
      <div className="mb-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              Foreground
            </label>
            <div
              className="w-full h-12 border-2 border-border rounded cursor-pointer hover:border-ring transition-colors"
              style={{ backgroundColor: foreground }}
              onClick={() => setActiveTab('foreground')}
              title={`Foreground: ${foreground}`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              Background
            </label>
            <div
              className="w-full h-12 border-2 border-border rounded cursor-pointer hover:border-ring transition-colors"
              style={{ backgroundColor: background }}
              onClick={() => setActiveTab('background')}
              title={`Background: ${background}`}
            />
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('foreground')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'foreground'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Foreground
        </button>
        <button
          onClick={() => setActiveTab('background')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
            activeTab === 'background'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          Background
        </button>
      </div>

      {/* Hex input */}
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-1">
          Hex Colour
        </label>
        <input
          type="text"
          value={activeTab === 'foreground' ? fgHexInput : bgHexInput}
          onChange={(e) =>
            activeTab === 'foreground'
              ? handleFgHexChange(e.target.value)
              : handleBgHexChange(e.target.value)
          }
          className="w-full px-3 py-2 bg-background border border-input rounded text-foreground font-mono text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none transition-all"
          placeholder="#000000"
          maxLength={7}
        />
        {activeTab === 'foreground' && !isValidHex(fgHexInput) && fgHexInput.length > 0 && (
          <p className="text-xs text-error mt-1">
            Invalid hex format. Use #RRGGBB
          </p>
        )}
        {activeTab === 'background' && !isValidHex(bgHexInput) && bgHexInput.length > 0 && (
          <p className="text-xs text-error mt-1">
            Invalid hex format. Use #RRGGBB
          </p>
        )}
      </div>

      {/* Preset palette */}
      <div className="mb-4">
        <label className="block text-xs text-muted-foreground mb-2">
          Preset Palette
        </label>
        <div className="grid grid-cols-8 gap-1">
          {PRESET_COLOURS.map((colour) => (
            <button
              key={colour}
              onClick={() => handlePresetClick(colour)}
              className="w-full aspect-square rounded border-2 border-border hover:border-ring hover:scale-110 transition-all cursor-pointer"
              style={{ backgroundColor: colour }}
              title={colour}
            />
          ))}
        </div>
      </div>

      {/* Recently used colours */}
      {recentColours.length > 0 && (
        <div>
          <label className="block text-xs text-muted-foreground mb-2">
            Recently Used
          </label>
          <div className="grid grid-cols-10 gap-1">
            {recentColours.map((colour, index) => (
              <button
                key={`${colour}-${index}`}
                onClick={() => handleRecentClick(colour)}
                className="w-full aspect-square rounded border-2 border-border hover:border-ring hover:scale-110 transition-all cursor-pointer"
                style={{ backgroundColor: colour }}
                title={colour}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
