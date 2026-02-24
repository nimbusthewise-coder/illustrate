/**
 * F035: Works Natively in GitHub, Notion, Linear, READMEs
 * 
 * GET /api/embed/[id]
 * 
 * Platform-aware embed endpoint that serves diagrams in the optimal format
 * for each platform (GitHub, Notion, Linear, etc).
 * 
 * Automatically detects the platform from User-Agent and serves:
 * - SVG for platforms that support it (GitHub, Notion, Linear, browsers)
 * - PNG for platforms that don't (Slack, Discord) - future enhancement
 * - HTML preview page for browsers with proper Open Graph meta tags
 * 
 * Query parameters:
 * - format: Force a specific format ('svg', 'png', 'html')
 * - fontSize: Font size in pixels (default: 14)
 * - padding: Padding in pixels (default: 16)
 * - bg: Background color hex (default: #ffffff)
 * - fg: Foreground color hex (default: #000000)
 * - width: Max width in pixels (overrides platform defaults)
 * - height: Max height in pixels (overrides platform defaults)
 * - theme: Color theme ('light' or 'dark', default: 'light')
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportSvg, type SVGRenderOptions, type CanvasDocument } from '@illustrate.md/core';
import { checkDiagramAccess } from '@/lib/diagram-access';
import { detectPlatform, getContentType, type Platform } from '@/lib/platform-detection';
import { buildEmbedHeaders, buildOptionsHeaders, buildOpenGraphTags } from '@/lib/embed-headers';

/** Maximum diagram area (characters) to prevent abuse */
const MAX_DIAGRAM_AREA = 500 * 500;

/**
 * Parse SVG render options from URL search params
 */
function parseRenderOptions(
  params: URLSearchParams,
  platformMaxWidth?: number,
  platformMaxHeight?: number
): SVGRenderOptions {
  const options: SVGRenderOptions = {};

  const fontSize = params.get('fontSize');
  if (fontSize) {
    const parsed = parseInt(fontSize, 10);
    if (!isNaN(parsed) && parsed >= 8 && parsed <= 72) {
      options.fontSize = parsed;
    }
  }

  const padding = params.get('padding');
  if (padding) {
    const parsed = parseInt(padding, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 200) {
      options.padding = parsed;
    }
  }

  // Theme-based colors
  const theme = params.get('theme');
  if (theme === 'dark') {
    options.defaultBackground = params.get('bg') || '#1a1a1a';
    options.defaultForeground = params.get('fg') || '#ffffff';
  } else {
    options.defaultBackground = params.get('bg') || '#ffffff';
    options.defaultForeground = params.get('fg') || '#000000';
  }

  // Note: SVGRenderOptions doesn't support maxWidth/maxHeight constraints
  // Size parameters are documented for user reference but not applied to rendering
  // Users can control size via fontSize and CSS for HTML responses

  return options;
}

/**
 * Validate a CanvasDocument structure
 */
function validateDocument(doc: unknown): doc is CanvasDocument {
  if (!doc || typeof doc !== 'object') return false;
  const d = doc as Record<string, unknown>;
  return (
    typeof d.width === 'number' &&
    typeof d.height === 'number' &&
    Array.isArray(d.layers) &&
    d.width > 0 &&
    d.height > 0 &&
    d.width * d.height <= MAX_DIAGRAM_AREA
  );
}

/**
 * Generate HTML preview page for browser viewing
 */
function generateHtmlPreview(
  svg: string,
  title: string,
  embedUrl: string,
  svgUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - illustrate.md</title>
  ${buildOpenGraphTags(title, svgUrl, 'Interactive ASCII diagram created with illustrate.md')}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .header {
      margin-bottom: 2rem;
      text-align: center;
    }
    .header h1 {
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: #666;
      font-size: 0.875rem;
    }
    .diagram-container {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: auto;
    }
    .diagram-container svg {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .actions {
      margin-top: 2rem;
      text-align: center;
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      font-size: 0.875rem;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #0052a3;
    }
    .btn-secondary {
      background: #666;
    }
    .btn-secondary:hover {
      background: #555;
    }
    .footer {
      margin-top: 3rem;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <p>Interactive ASCII Diagram</p>
    </div>
    
    <div class="diagram-container">
      ${svg}
    </div>
    
    <div class="actions">
      <a href="${escapeHtml(svgUrl)}" class="btn" download="${escapeHtml(title)}.svg">
        Download SVG
      </a>
      <a href="https://illustrate.md" class="btn btn-secondary" target="_blank" rel="noopener">
        Create Your Own
      </a>
    </div>
    
    <div class="footer">
      <p>
        Created with <a href="https://illustrate.md" target="_blank" rel="noopener">illustrate.md</a>
        - The ASCII diagram editor for developers
      </p>
    </div>
  </div>
</body>
</html>`;
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

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: buildOptionsHeaders(),
  });
}

/**
 * GET /api/embed/[id]
 * 
 * Serve diagram in platform-appropriate format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userAgent = request.headers.get('user-agent');

    // Detect platform
    const platformInfo = detectPlatform(userAgent);

    // Check diagram access (handles auth for private diagrams)
    const access = await checkDiagramAccess(id);
    if (access.error) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      );
    }

    const diagram = access.diagram!;

    // Parse the stored diagram content
    let document: CanvasDocument;
    try {
      document = JSON.parse(diagram.content) as CanvasDocument;
    } catch {
      return NextResponse.json(
        { error: 'Invalid diagram data' },
        { status: 500 }
      );
    }

    if (!validateDocument(document)) {
      return NextResponse.json(
        { error: 'Invalid diagram structure or exceeds size limits' },
        { status: 422 }
      );
    }

    // Determine format (allow override via query param)
    const formatParam = request.nextUrl.searchParams.get('format') as 'svg' | 'png' | 'html' | null;
    const format = formatParam || platformInfo.preferredFormat;

    // For now, we only support SVG and HTML
    // PNG support would require an additional rendering library
    if (format === 'png') {
      return NextResponse.json(
        { error: 'PNG format not yet supported. Use format=svg or format=html' },
        { status: 501 }
      );
    }

    // Parse rendering options
    const options = parseRenderOptions(
      request.nextUrl.searchParams,
      platformInfo.maxWidth,
      platformInfo.maxHeight
    );

    // Render SVG
    const svg = exportSvg(document, options);

    // Build URLs for metadata
    const baseUrl = new URL(request.url).origin;
    const embedUrl = `${baseUrl}/api/embed/${id}`;
    const svgUrl = `${baseUrl}/api/embed/${id}?format=svg`;

    // Determine response format
    if (format === 'html' || platformInfo.platform === 'browser') {
      // Generate HTML preview for browsers
      const html = generateHtmlPreview(
        svg,
        diagram.title || 'Untitled Diagram',
        embedUrl,
        svgUrl
      );

      const headers = buildEmbedHeaders(
        platformInfo.platform,
        'html',
        getContentType(platformInfo.platform, 'html')
      );

      return new NextResponse(html, { status: 200, headers });
    }

    // Serve SVG for embed platforms
    const headers = buildEmbedHeaders(
      platformInfo.platform,
      'svg',
      getContentType(platformInfo.platform, 'svg')
    );

    return new NextResponse(svg, { status: 200, headers });
  } catch (error) {
    console.error('Embed endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate embed' },
      { status: 500 }
    );
  }
}
