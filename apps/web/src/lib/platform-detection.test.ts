/**
 * Tests for platform detection utilities
 */

import { describe, it, expect } from 'vitest';
import { detectPlatform, isEmbedRequest, getContentType } from './platform-detection';

describe('detectPlatform', () => {
  it('detects GitHub user agents', () => {
    const result = detectPlatform('github-camo (github/v1.0)');
    expect(result.platform).toBe('github');
    expect(result.supportsSvg).toBe(true);
    expect(result.preferredFormat).toBe('svg');
  });

  it('detects GitHub camo proxy', () => {
    const result = detectPlatform('camo-proxy/1.0');
    expect(result.platform).toBe('github');
    expect(result.supportsSvg).toBe(true);
  });

  it('detects Notion user agents', () => {
    const result = detectPlatform('notion-embedder/1.0');
    expect(result.platform).toBe('notion');
    expect(result.supportsSvg).toBe(true);
    expect(result.supportsHtml).toBe(true);
    expect(result.preferredFormat).toBe('svg');
  });

  it('detects Linear user agents', () => {
    const result = detectPlatform('linearapp/1.0');
    expect(result.platform).toBe('linear');
    expect(result.supportsSvg).toBe(true);
    expect(result.preferredFormat).toBe('svg');
  });

  it('detects Slack user agents', () => {
    const result = detectPlatform('slackbot-linkexpanding 1.0');
    expect(result.platform).toBe('slack');
    expect(result.supportsSvg).toBe(false);
    expect(result.preferredFormat).toBe('png');
  });

  it('detects Discord user agents', () => {
    const result = detectPlatform('discordbot/2.0');
    expect(result.platform).toBe('discord');
    expect(result.supportsSvg).toBe(false);
    expect(result.preferredFormat).toBe('png');
  });

  it('detects browser user agents', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const result = detectPlatform(ua);
    expect(result.platform).toBe('browser');
    expect(result.supportsSvg).toBe(true);
    expect(result.supportsHtml).toBe(true);
    expect(result.preferredFormat).toBe('html');
  });

  it('handles null user agent', () => {
    const result = detectPlatform(null);
    expect(result.platform).toBe('unknown');
    expect(result.supportsSvg).toBe(true);
    expect(result.supportsHtml).toBe(true);
  });

  it('handles unknown user agents', () => {
    const result = detectPlatform('custom-bot/1.0');
    expect(result.platform).toBe('unknown');
    expect(result.supportsSvg).toBe(true);
    expect(result.preferredFormat).toBe('svg');
  });

  it('sets appropriate max dimensions for GitHub', () => {
    const result = detectPlatform('github-camo');
    expect(result.maxWidth).toBe(1000);
    expect(result.maxHeight).toBe(2000);
  });

  it('sets appropriate max dimensions for Notion', () => {
    const result = detectPlatform('notion');
    expect(result.maxWidth).toBe(1920);
    expect(result.maxHeight).toBeUndefined();
  });

  it('is case insensitive', () => {
    const result = detectPlatform('GITHUB-CAMO');
    expect(result.platform).toBe('github');
  });
});

describe('isEmbedRequest', () => {
  it('returns true for GitHub user agents', () => {
    expect(isEmbedRequest('github-camo')).toBe(true);
    expect(isEmbedRequest('github.com')).toBe(true);
  });

  it('returns true for Notion user agents', () => {
    expect(isEmbedRequest('notion-embedder')).toBe(true);
  });

  it('returns true for Linear user agents', () => {
    expect(isEmbedRequest('linearapp')).toBe(true);
  });

  it('returns true for Slack user agents', () => {
    expect(isEmbedRequest('slackbot')).toBe(true);
  });

  it('returns true for Discord user agents', () => {
    expect(isEmbedRequest('discordbot')).toBe(true);
  });

  it('returns true for generic embed/preview user agents', () => {
    expect(isEmbedRequest('embed-service')).toBe(true);
    expect(isEmbedRequest('preview-bot')).toBe(true);
  });

  it('returns false for regular browsers', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)';
    expect(isEmbedRequest(ua)).toBe(false);
  });

  it('returns false for null user agent', () => {
    expect(isEmbedRequest(null)).toBe(false);
  });

  it('is case insensitive', () => {
    expect(isEmbedRequest('GITHUB-CAMO')).toBe(true);
  });
});

describe('getContentType', () => {
  it('returns correct content type for SVG', () => {
    expect(getContentType('github', 'svg')).toBe('image/svg+xml; charset=utf-8');
    expect(getContentType('notion', 'svg')).toBe('image/svg+xml; charset=utf-8');
  });

  it('returns correct content type for PNG', () => {
    expect(getContentType('slack', 'png')).toBe('image/png');
    expect(getContentType('discord', 'png')).toBe('image/png');
  });

  it('returns correct content type for HTML', () => {
    expect(getContentType('browser', 'html')).toBe('text/html; charset=utf-8');
  });

  it('defaults to SVG for unknown formats', () => {
    expect(getContentType('github', 'unknown' as any)).toBe('image/svg+xml; charset=utf-8');
  });
});
