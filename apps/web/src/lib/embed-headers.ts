/**
 * Platform-specific HTTP headers for embeds
 * 
 * Configures appropriate caching, CORS, and content headers
 * based on the requesting platform.
 */

import type { Platform } from './platform-detection';

export type EmbedHeaders = Record<string, string>;

/**
 * Get platform-specific cache control headers
 */
function getCacheControl(platform: Platform): string {
  switch (platform) {
    case 'github':
      // GitHub Camo proxy caches aggressively
      // Allow caching but with revalidation
      return 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

    case 'notion':
      // Notion caches embeds, allow longer cache
      return 'public, max-age=7200, s-maxage=86400, stale-while-revalidate=604800';

    case 'linear':
      // Linear refreshes previews periodically
      return 'public, max-age=3600, s-maxage=43200, stale-while-revalidate=86400';

    case 'slack':
    case 'discord':
      // Chat platforms cache unfurl previews
      return 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';

    case 'browser':
      // Browsers can use standard caching
      return 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

    default:
      // Conservative default
      return 'public, max-age=300, s-maxage=3600';
  }
}

/**
 * Get CORS headers for embed endpoints
 */
function getCorsHeaders(platform: Platform): Partial<EmbedHeaders> {
  // Allow embeds from anywhere for public diagrams
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
  };
}

/**
 * Get security headers for embed responses
 */
function getSecurityHeaders(platform: Platform, format: 'svg' | 'png' | 'html'): Partial<EmbedHeaders> {
  const headers: Partial<EmbedHeaders> = {
    'X-Content-Type-Options': 'nosniff',
  };

  // For HTML responses, add more security
  if (format === 'html') {
    headers['X-Frame-Options'] = 'SAMEORIGIN';
    headers['Content-Security-Policy'] = "default-src 'self'; style-src 'unsafe-inline'; img-src data: https:;";
  }

  return headers;
}

/**
 * Build complete headers for an embed response
 */
export function buildEmbedHeaders(
  platform: Platform,
  format: 'svg' | 'png' | 'html',
  contentType: string
): EmbedHeaders {
  const headers: EmbedHeaders = {
    'Content-Type': contentType,
    'Cache-Control': getCacheControl(platform),
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'User-Agent, Accept',
  };

  // Add CORS headers
  Object.assign(headers, getCorsHeaders(platform));

  // Add security headers
  Object.assign(headers, getSecurityHeaders(platform, format));

  return headers;
}

/**
 * Build headers for OPTIONS preflight requests
 */
export function buildOptionsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Build Open Graph meta tags for social sharing
 */
export function buildOpenGraphTags(
  title: string,
  imageUrl: string,
  description?: string
): string {
  const tags = [
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `<meta property="og:type" content="image" />`,
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta property="twitter:image" content="${escapeHtml(imageUrl)}" />`,
  ];

  if (description) {
    tags.push(`<meta property="og:description" content="${escapeHtml(description)}" />`);
    tags.push(`<meta property="twitter:description" content="${escapeHtml(description)}" />`);
  }

  return tags.join('\n    ');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}
