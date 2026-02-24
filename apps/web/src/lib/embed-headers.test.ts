/**
 * Tests for embed headers utilities
 */

import { describe, it, expect } from 'vitest';
import { buildEmbedHeaders, buildOptionsHeaders, buildOpenGraphTags } from './embed-headers';

describe('buildEmbedHeaders', () => {
  it('includes required headers for GitHub', () => {
    const headers = buildEmbedHeaders('github', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Content-Type']).toBe('image/svg+xml; charset=utf-8');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Cache-Control']).toContain('public');
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Vary']).toContain('User-Agent');
  });

  it('includes CORS headers', () => {
    const headers = buildEmbedHeaders('github', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, HEAD, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, User-Agent');
  });

  it('uses platform-specific cache control for GitHub', () => {
    const headers = buildEmbedHeaders('github', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Cache-Control']).toContain('max-age=3600');
    expect(headers['Cache-Control']).toContain('s-maxage=86400');
    expect(headers['Cache-Control']).toContain('stale-while-revalidate');
  });

  it('uses platform-specific cache control for Notion', () => {
    const headers = buildEmbedHeaders('notion', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Cache-Control']).toContain('max-age=7200');
    expect(headers['Cache-Control']).toContain('s-maxage=86400');
  });

  it('uses platform-specific cache control for Linear', () => {
    const headers = buildEmbedHeaders('linear', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Cache-Control']).toContain('max-age=3600');
    expect(headers['Cache-Control']).toContain('s-maxage=43200');
  });

  it('uses platform-specific cache control for browsers', () => {
    const headers = buildEmbedHeaders('browser', 'html', 'text/html; charset=utf-8');
    
    expect(headers['Cache-Control']).toContain('max-age=300');
    expect(headers['Cache-Control']).toContain('s-maxage=3600');
  });

  it('adds security headers for HTML responses', () => {
    const headers = buildEmbedHeaders('browser', 'html', 'text/html; charset=utf-8');
    
    expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(headers['Content-Security-Policy']).toBeDefined();
  });

  it('does not add frame options for SVG responses', () => {
    const headers = buildEmbedHeaders('github', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['X-Frame-Options']).toBeUndefined();
  });

  it('includes Vary header for content negotiation', () => {
    const headers = buildEmbedHeaders('github', 'svg', 'image/svg+xml; charset=utf-8');
    
    expect(headers['Vary']).toBe('User-Agent, Accept');
  });
});

describe('buildOptionsHeaders', () => {
  it('returns CORS preflight headers', () => {
    const headers = buildOptionsHeaders();
    
    expect(headers['Access-Control-Allow-Origin']).toBe('*');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, HEAD, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, User-Agent');
    expect(headers['Access-Control-Max-Age']).toBe('86400');
  });

  it('allows caching of preflight for 24 hours', () => {
    const headers = buildOptionsHeaders();
    
    expect(headers['Access-Control-Max-Age']).toBe('86400');
  });
});

describe('buildOpenGraphTags', () => {
  it('generates basic Open Graph tags', () => {
    const tags = buildOpenGraphTags('Test Diagram', 'https://example.com/image.svg');
    
    expect(tags).toContain('og:title');
    expect(tags).toContain('Test Diagram');
    expect(tags).toContain('og:image');
    expect(tags).toContain('https://example.com/image.svg');
    expect(tags).toContain('og:type');
    expect(tags).toContain('image');
  });

  it('includes Twitter card tags', () => {
    const tags = buildOpenGraphTags('Test Diagram', 'https://example.com/image.svg');
    
    expect(tags).toContain('twitter:card');
    expect(tags).toContain('summary_large_image');
    expect(tags).toContain('twitter:title');
    expect(tags).toContain('twitter:image');
  });

  it('includes description when provided', () => {
    const tags = buildOpenGraphTags(
      'Test Diagram',
      'https://example.com/image.svg',
      'A test description'
    );
    
    expect(tags).toContain('og:description');
    expect(tags).toContain('A test description');
    expect(tags).toContain('twitter:description');
  });

  it('escapes HTML in title', () => {
    const tags = buildOpenGraphTags('<script>alert("xss")</script>', 'https://example.com/image.svg');
    
    expect(tags).not.toContain('<script>');
    expect(tags).toContain('&lt;script&gt;');
  });

  it('escapes HTML in image URL', () => {
    const tags = buildOpenGraphTags('Test', 'https://example.com/image.svg?foo=<bar>');
    
    expect(tags).toContain('&lt;bar&gt;');
  });

  it('escapes HTML in description', () => {
    const tags = buildOpenGraphTags(
      'Test',
      'https://example.com/image.svg',
      'Description with <tags>'
    );
    
    expect(tags).toContain('&lt;tags&gt;');
  });

  it('escapes quotes in attributes', () => {
    const tags = buildOpenGraphTags('Test "quoted" title', 'https://example.com/image.svg');
    
    expect(tags).toContain('&quot;quoted&quot;');
  });

  it('escapes ampersands', () => {
    const tags = buildOpenGraphTags('Test & Title', 'https://example.com/image.svg');
    
    expect(tags).toContain('Test &amp; Title');
  });

  it('returns properly formatted meta tags', () => {
    const tags = buildOpenGraphTags('Test', 'https://example.com/image.svg');
    
    // Should have multiple meta tags separated by newlines
    const metaTags = tags.split('\n');
    expect(metaTags.length).toBeGreaterThan(1);
    
    // Each line should be a meta tag
    metaTags.forEach((tag) => {
      if (tag.trim()) {
        expect(tag.trim()).toMatch(/^<meta property="(og|twitter):/);
      }
    });
  });
});
