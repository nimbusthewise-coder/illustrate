/**
 * F030: SVG Render Endpoint
 * 
 * GET /api/diagrams/[id]/render/svg
 * 
 * Renders a diagram as SVG. Supports both stored diagrams (by ID)
 * and inline document rendering via POST.
 * 
 * Query parameters:
 * - fontSize: Font size in pixels (default: 14)
 * - padding: Padding in pixels (default: 16)
 * - colors: Include colors (default: true)
 * - bg: Background color hex (default: #ffffff)
 * - fg: Foreground color hex (default: #000000)
 * - download: If "true", sets Content-Disposition for file download
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exportSvg,
  bufferToSvg,
  type SVGRenderOptions,
  type CanvasDocument,
} from '@illustrate.md/core';
import { checkDiagramAccess } from '@/lib/diagram-access';

/** Maximum diagram area (characters) to prevent abuse */
const MAX_DIAGRAM_AREA = 500 * 500; // 250,000 characters

/** Request timeout in ms */
const RENDER_TIMEOUT_MS = 10_000;

/**
 * Parse SVG render options from URL search params
 */
function parseOptionsFromParams(params: URLSearchParams): SVGRenderOptions {
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

  const colors = params.get('colors');
  if (colors === 'false') {
    options.includeColors = false;
  }

  const bg = params.get('bg');
  if (bg && /^#[0-9a-fA-F]{6}$/.test(bg)) {
    options.defaultBackground = bg;
  }

  const fg = params.get('fg');
  if (fg && /^#[0-9a-fA-F]{6}$/.test(fg)) {
    options.defaultForeground = fg;
  }

  return options;
}

/**
 * Validate a CanvasDocument structure for rendering
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
 * Create SVG response with appropriate headers
 */
function svgResponse(svg: string, filename?: string): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'X-Content-Type-Options': 'nosniff',
  };

  if (filename) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  return new NextResponse(svg, { status: 200, headers });
}

/**
 * Create error response in JSON
 */
function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * GET /api/diagrams/[id]/render/svg
 * 
 * Fetch a diagram by ID and render it as SVG.
 * Public diagrams are accessible without auth.
 * Private diagrams require authentication and ownership.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check diagram access (handles auth for private diagrams)
    const access = await checkDiagramAccess(id);
    if (access.error) {
      return errorResponse(access.error, access.status);
    }

    const diagram = access.diagram!;

    // Parse the stored diagram content
    let document: CanvasDocument;
    try {
      document = JSON.parse(diagram.content) as CanvasDocument;
    } catch {
      return errorResponse('Invalid diagram data', 500);
    }

    if (!validateDocument(document)) {
      return errorResponse('Invalid diagram structure or exceeds size limits', 422);
    }

    // Parse rendering options from query params
    const options = parseOptionsFromParams(request.nextUrl.searchParams);

    // Render SVG
    const svg = exportSvg(document, options);

    // Determine filename for download
    const download = request.nextUrl.searchParams.get('download');
    const filename = download === 'true'
      ? `${diagram.title || 'diagram'}.svg`
      : undefined;

    return svgResponse(svg, filename);
  } catch (error) {
    console.error('SVG render error:', error);
    return errorResponse('Failed to render SVG', 500);
  }
}

/**
 * POST /api/diagrams/[id]/render/svg
 * 
 * Render an inline CanvasDocument as SVG.
 * The [id] parameter is ignored for POST — the document is provided in the body.
 * This endpoint is useful for preview rendering without saving first.
 * 
 * Request body:
 * - document: CanvasDocument
 * - options: SVGRenderOptions (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, options } = body as {
      document: CanvasDocument;
      options?: SVGRenderOptions;
    };

    if (!document) {
      return errorResponse('Missing document in request body', 400);
    }

    if (!validateDocument(document)) {
      return errorResponse(
        'Invalid document structure or exceeds size limits',
        422
      );
    }

    // Merge any query params with body options (body options take precedence)
    const queryOptions = parseOptionsFromParams(request.nextUrl.searchParams);
    const mergedOptions: SVGRenderOptions = { ...queryOptions, ...options };

    // Render SVG
    const svg = exportSvg(document, mergedOptions);

    return svgResponse(svg);
  } catch (error) {
    console.error('SVG render POST error:', error);
    return errorResponse('Failed to render SVG', 500);
  }
}
