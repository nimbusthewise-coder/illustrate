'use client';

import { getContrastColor } from '@/utils/colorUtils';

/**
 * ColorSwatch — displays a single color as a clickable swatch.
 * Used in color palette and recent colors display.
 */

interface ColorSwatchProps {
  color: string;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

export function ColorSwatch({
  color,
  onClick,
  selected = false,
  size = 'md',
  'aria-label': ariaLabel,
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const contrastColor = getContrastColor(color);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        ${sizeClasses[size]}
        rounded border-2 transition-all
        ${
          selected
            ? 'border-primary ring-2 ring-primary/50 scale-110'
            : 'border-border hover:border-muted-foreground hover:scale-105'
        }
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
      `}
      style={{ backgroundColor: color }}
      aria-label={ariaLabel || `Select color ${color}`}
      title={color}
    >
      {selected && (
        <div
          className="w-full h-full flex items-center justify-center text-xs font-bold"
          style={{ color: contrastColor }}
        >
          ✓
        </div>
      )}
    </button>
  );
}
