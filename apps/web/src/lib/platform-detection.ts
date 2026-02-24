/**
 * Platform detection utilities for embed endpoints
 * 
 * Detects which platform is requesting an embed (GitHub, Notion, Linear, etc.)
 * based on user-agent headers and other request characteristics.
 */

export type Platform =
  | 'github'
  | 'notion'
  | 'linear'
  | 'slack'
  | 'discord'
  | 'browser'
  | 'unknown';

export interface PlatformInfo {
  platform: Platform;
  supportsHtml: boolean;
  supportsSvg: boolean;
  preferredFormat: 'svg' | 'png' | 'html';
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Detect platform from user-agent string
 */
export function detectPlatform(userAgent: string | null): PlatformInfo {
  if (!userAgent) {
    return {
      platform: 'unknown',
      supportsHtml: true,
      supportsSvg: true,
      preferredFormat: 'svg',
    };
  }

  const ua = userAgent.toLowerCase();

  // GitHub
  // GitHub uses various user agents including their camo proxy
  if (
    ua.includes('github') ||
    ua.includes('camo') ||
    ua.includes('githubusercontent')
  ) {
    return {
      platform: 'github',
      supportsHtml: false,
      supportsSvg: true,
      preferredFormat: 'svg',
      maxWidth: 1000,
      maxHeight: 2000,
    };
  }

  // Notion
  // Notion's embed service uses specific user agents
  if (ua.includes('notion') || ua.includes('notionembedder')) {
    return {
      platform: 'notion',
      supportsHtml: true,
      supportsSvg: true,
      preferredFormat: 'svg',
      maxWidth: 1920,
    };
  }

  // Linear
  // Linear's preview service
  if (ua.includes('linear') || ua.includes('linearapp')) {
    return {
      platform: 'linear',
      supportsHtml: false,
      supportsSvg: true,
      preferredFormat: 'svg',
      maxWidth: 800,
    };
  }

  // Slack
  if (ua.includes('slackbot') || ua.includes('slack')) {
    return {
      platform: 'slack',
      supportsHtml: false,
      supportsSvg: false,
      preferredFormat: 'png',
      maxWidth: 360,
      maxHeight: 500,
    };
  }

  // Discord
  if (ua.includes('discord') || ua.includes('discordbot')) {
    return {
      platform: 'discord',
      supportsHtml: false,
      supportsSvg: false,
      preferredFormat: 'png',
      maxWidth: 400,
    };
  }

  // Browser (fallback for common browsers)
  if (
    ua.includes('mozilla') ||
    ua.includes('chrome') ||
    ua.includes('safari') ||
    ua.includes('firefox') ||
    ua.includes('edge')
  ) {
    return {
      platform: 'browser',
      supportsHtml: true,
      supportsSvg: true,
      preferredFormat: 'html',
    };
  }

  return {
    platform: 'unknown',
    supportsHtml: true,
    supportsSvg: true,
    preferredFormat: 'svg',
  };
}

/**
 * Check if request is from an embed/preview service
 */
export function isEmbedRequest(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();
  return (
    ua.includes('github') ||
    ua.includes('notion') ||
    ua.includes('linear') ||
    ua.includes('slack') ||
    ua.includes('discord') ||
    ua.includes('camo') ||
    ua.includes('preview') ||
    ua.includes('embed')
  );
}

/**
 * Get appropriate Content-Type for platform
 */
export function getContentType(platform: Platform, format: 'svg' | 'png' | 'html'): string {
  switch (format) {
    case 'svg':
      return 'image/svg+xml; charset=utf-8';
    case 'png':
      return 'image/png';
    case 'html':
      return 'text/html; charset=utf-8';
    default:
      return 'image/svg+xml; charset=utf-8';
  }
}
