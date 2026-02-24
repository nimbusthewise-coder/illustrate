/**
 * Tinker Design System - Theme Provider
 * 
 * React provider that applies theme CSS variables to the document.
 * Wrap your app with this component to enable theming.
 */

'use client';

import { useEffect, useState } from 'react';
import { useThemeStore } from '../../stores/theme-store';
import { themes } from '../../lib/themes';

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { themeId, mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const theme = themes[themeId];
    const tokens = theme[mode];
    const root = document.documentElement;

    // Apply dark mode class
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply CSS variables
    root.style.setProperty('--background', hexToHsl(tokens.background));
    root.style.setProperty('--foreground', hexToHsl(tokens.foreground));
    root.style.setProperty('--muted', hexToHsl(tokens.muted));
    root.style.setProperty('--muted-foreground', hexToHsl(tokens.mutedForeground));
    root.style.setProperty('--border', hexToHsl(tokens.border));
    root.style.setProperty('--input', hexToHsl(tokens.border));
    root.style.setProperty('--ring', hexToHsl(tokens.accent));

    // Primary uses accent
    root.style.setProperty('--primary', hexToHsl(tokens.accent));
    root.style.setProperty('--primary-foreground', hexToHsl(tokens.accentForeground));

    // Secondary uses muted
    root.style.setProperty('--secondary', hexToHsl(tokens.muted));
    root.style.setProperty('--secondary-foreground', hexToHsl(tokens.foreground));

    // Accent
    root.style.setProperty('--accent', hexToHsl(tokens.muted));
    root.style.setProperty('--accent-foreground', hexToHsl(tokens.foreground));

    // Destructive uses error
    root.style.setProperty('--destructive', hexToHsl(tokens.error));

    // Card and popover use background
    root.style.setProperty('--card', hexToHsl(tokens.background));
    root.style.setProperty('--card-foreground', hexToHsl(tokens.foreground));
    root.style.setProperty('--popover', hexToHsl(tokens.background));
    root.style.setProperty('--popover-foreground', hexToHsl(tokens.foreground));

    // Sidebar
    root.style.setProperty('--sidebar', hexToHsl(tokens.muted));
    root.style.setProperty('--sidebar-foreground', hexToHsl(tokens.foreground));
    root.style.setProperty('--sidebar-primary', hexToHsl(tokens.accent));
    root.style.setProperty('--sidebar-primary-foreground', hexToHsl(tokens.accentForeground));
    root.style.setProperty('--sidebar-accent', hexToHsl(tokens.muted));
    root.style.setProperty('--sidebar-accent-foreground', hexToHsl(tokens.foreground));
    root.style.setProperty('--sidebar-border', hexToHsl(tokens.border));
    root.style.setProperty('--sidebar-ring', hexToHsl(tokens.accent));

    // Custom tokens for status colors
    root.style.setProperty('--success', hexToHsl(tokens.success));
    root.style.setProperty('--warning', hexToHsl(tokens.warning));
    root.style.setProperty('--error', hexToHsl(tokens.error));
    root.style.setProperty('--info', hexToHsl(tokens.info));
    root.style.setProperty('--terminal', hexToHsl(tokens.terminal));
    root.style.setProperty('--terminal-text', hexToHsl(tokens.terminalText));
  }, [themeId, mode, mounted]);

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
