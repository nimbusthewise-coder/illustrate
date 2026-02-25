'use client';

import Image from 'next/image';
import { useThemeStore } from '@/stores/theme-store';

export interface LogoMarkProps {
  /** Size in pixels (square) */
  size?: number;
  /** Custom className */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * illustrate.md logomark (icon-only variant)
 * 
 * Theme-aware: switches between light/dark variants based on current mode.
 * Use Logo for full wordmark contexts.
 */
export function LogoMark({
  size = 32,
  className = '',
  alt = 'illustrate.md',
}: LogoMarkProps) {
  const mode = useThemeStore((state) => state.mode);
  
  // Use dark logo (white) for dark mode, regular logo for light mode
  const src = mode === 'dark' ? '/logo-dark.svg' : '/favicon.svg';

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export default LogoMark;
