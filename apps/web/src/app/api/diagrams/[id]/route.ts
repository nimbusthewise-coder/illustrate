/**
 * F048: Diagram Library — Individual diagram API endpoints
 *
 * GET    /api/diagrams/[id]  — Get a specific diagram
 * PUT    /api/diagrams/[id]  — Update a diagram
 * DELETE /api/diagrams/[id]  — Delete a diagram
 *
 * Note: Stub API. Actual persistence is client-side via localStorage/Zustand.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/diagrams/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid diagram ID' }, { status: 400 });
  }

  return NextResponse.json({
    diagram: null,
    message: `Diagram ${id} lookup is handled client-side. This endpoint is a stub for future Supabase integration.`,
  });
}

/**
 * PUT /api/diagrams/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid diagram ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, tags, layers } = body as {
      name?: string;
      description?: string;
      tags?: string[];
      layers?: unknown;
    };

    return NextResponse.json({
      success: true,
      message: `Diagram ${id} update acknowledged. Actual persistence is handled client-side.`,
      updates: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(layers !== undefined && { hasLayers: true }),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

/**
 * DELETE /api/diagrams/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid diagram ID' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `Diagram ${id} deletion acknowledged. Actual deletion is handled client-side.`,
  });
}
