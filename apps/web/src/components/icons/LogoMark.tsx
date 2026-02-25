import Image from 'next/image';

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
 * Uses favicon.svg for the bubble-letter mark.
 * Use Logo for full wordmark contexts.
 */
export function LogoMark({
  size = 32,
  className = '',
  alt = 'illustrate.md',
}: LogoMarkProps) {
  return (
    <Image
      src="/favicon.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export default LogoMark;
