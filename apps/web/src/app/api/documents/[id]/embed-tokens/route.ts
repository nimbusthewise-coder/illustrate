import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents/{id}/embed-tokens
 * List all embed tokens for a document (requires auth, must be owner)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const tokens = await prisma.embedToken.findMany({
      where: { documentId: id },
      select: {
        id: true,
        token: true,
        label: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error listing embed tokens:', error);
    return NextResponse.json(
      { error: 'Failed to list embed tokens' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/{id}/embed-tokens
 * Create a new long-lived embed token for a document
 * 
 * Body: { label?: string, expiresInDays?: number }
 * If expiresInDays is omitted, token never expires.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const label = typeof body.label === 'string' ? body.label.slice(0, 100) : null;
    const expiresInDays = typeof body.expiresInDays === 'number' && body.expiresInDays > 0
      ? body.expiresInDays
      : null;

    // Generate a secure random token (48 bytes = 64 base64url chars)
    const token = randomBytes(48).toString('base64url');

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const embedToken = await prisma.embedToken.create({
      data: {
        token,
        documentId: id,
        label,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        label: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Build the embed URL with token
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const embedUrl = `${baseUrl}/api/embed/${id}?token=${token}`;

    return NextResponse.json(
      { embedToken, embedUrl },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating embed token:', error);
    return NextResponse.json(
      { error: 'Failed to create embed token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/{id}/embed-tokens
 * Revoke an embed token
 * 
 * Body: { tokenId: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { tokenId } = body;

    if (!tokenId || typeof tokenId !== 'string') {
      return NextResponse.json(
        { error: 'tokenId is required' },
        { status: 400 }
      );
    }

    // Revoke (soft-delete) the token
    const updated = await prisma.embedToken.updateMany({
      where: {
        id: tokenId,
        documentId: id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Token not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error revoking embed token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke embed token' },
      { status: 500 }
    );
  }
}
