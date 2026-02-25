import Image from 'next/image';

export interface LogoProps {
  /** Width in pixels (height auto-scales) */
  width?: number;
  /** Height in pixels (width auto-scales) */
  height?: number;
  /** Use dark variant for light backgrounds */
  variant?: 'default' | 'dark' | 'light';
  /** Custom className */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
}

/**
 * illustrate.md logo component
 * 
 * Renders the full logo with wordmark.
 * Use LogoMark for icon-only contexts (favicons, small UI).
 */
export function Logo({
  width,
  height,
  variant = 'default',
  className = '',
  alt = 'illustrate.md',
}: LogoProps) {
  // Default to reasonable size if neither specified
  const finalWidth = width ?? (height ? undefined : 180);
  const finalHeight = height;

  const src = variant === 'dark' 
    ? '/logo-dark.svg'
    : variant === 'light'
    ? '/logo-light.svg'
    : '/logo.svg';

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
