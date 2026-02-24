/**
 * F048: Diagram Library — CRUD API endpoints
 *
 * GET  /api/diagrams        — List diagrams (with optional search/filter)
 * POST /api/diagrams        — Create a new diagram
 *
 * Note: This is a stub API that demonstrates the endpoint structure.
 * In production, these operations go through Supabase client-side.
 * The client-side Zustand store handles local persistence via localStorage.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/diagrams
 *
 * Query params:
 *  - q: search text
 *  - tags: comma-separated tag filter
 *  - favorite: "true" to filter favorites only
 *  - sort: field to sort by (name, created, updated)
 *  - order: asc or desc
 *  - limit: max results (default 50)
 *  - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse query parameters for documentation / future Supabase integration
  const _query = searchParams.get('q') ?? '';
  const _tags = searchParams.get('tags')?.split(',').filter(Boolean) ?? [];
  const _favorite = searchParams.get('favorite') === 'true';
  const _sort = searchParams.get('sort') ?? 'updated';
  const _order = searchParams.get('order') ?? 'desc';
  const _limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);
  const _offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);

  // Stub response — actual data comes from client-side store
  return NextResponse.json({
    diagrams: [],
    total: 0,
    limit: _limit,
    offset: _offset,
    message: 'Diagram data is managed client-side via localStorage. This endpoint is a stub for future Supabase integration.',
  });
}

/**
 * POST /api/diagrams
 *
 * Body: { name, description?, tags?, width, height, layers }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { name, description, tags, width, height, layers } = body as {
      name?: string;
      description?: string;
      tags?: string[];
      width?: number;
      height?: number;
      layers?: unknown;
    };

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!width || !height || typeof width !== 'number' || typeof height !== 'number') {
      return NextResponse.json({ error: 'Valid width and height are required' }, { status: 400 });
    }

    if (!layers || !Array.isArray(layers)) {
      return NextResponse.json({ error: 'Layers array is required' }, { status: 400 });
    }

    // Stub: acknowledge receipt but actual storage is client-side
    return NextResponse.json(
      {
        success: true,
        message: 'Diagram creation acknowledged. Actual persistence is handled client-side via localStorage.',
        diagram: {
          name,
          description: description ?? '',
          tags: tags ?? [],
          width,
          height,
          layerCount: layers.length,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
