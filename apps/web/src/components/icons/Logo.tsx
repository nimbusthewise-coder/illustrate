'use client';

import Image from 'next/image';
import { useThemeStore } from '@/stores/theme-store';

export interface LogoProps {
  /** Width in pixels (height auto-scales) */
  width?: number;
  /** Height in pixels (width auto-scales) */
  height?: number;
  /** Override automatic theme detection */
  variant?: 'auto' | 'dark' | 'light';
  /** Custom className */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * illustrate.md logo component
 * 
 * Theme-aware: automatically switches between light/dark variants.
 * Use LogoMark for icon-only contexts (favicons, small UI).
 */
export function Logo({
  width,
  height,
  variant = 'auto',
  className = '',
  alt = 'illustrate.md',
}: LogoProps) {
  const mode = useThemeStore((state) => state.mode);
  
  // Default to reasonable size if neither specified
  const finalWidth = width ?? (height ? undefined : 180);
  const finalHeight = height;

  // Determine which logo to use
  let src: string;
  if (variant === 'dark') {
    src = '/logo-dark.svg';
  } else if (variant === 'light') {
    src = '/logo-light.svg';
  } else {
    // Auto: use dark logo (white) for dark mode
    src = mode === 'dark' ? '/logo-dark.svg' : '/logo.svg';
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth ?? 180}
      height={finalHeight ?? 40}
      className={className}
      priority
    />
  );
}

export default Logo;
