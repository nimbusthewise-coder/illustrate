import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/embed/{id}
 * 
 * Returns diagram data for embedding. No auth required for public diagrams.
 * Private diagrams require a valid embed token passed as ?token= query param.
 * 
 * F033: Living diagram updates on source change
 * - Always fetches the latest saved version from the database
 * - Returns ETag and Last-Modified headers for cache validation
 * - Uses s-maxage=60 with stale-while-revalidate=300 for CDN caching
 * - On-demand revalidation via revalidateTag in updateDocument
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token');

    // Find the document (always fetches latest saved version)
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Diagram not found' },
        { status: 404 }
      );
    }

    // F033: Generate ETag from updatedAt for cache validation
    // When the document is saved, updatedAt changes, producing a new ETag
    const etag = `"${document.id}-${document.updatedAt.getTime()}"`;
    const ifNoneMatch = request.headers.get('if-none-match');

    // Check if client already has the current version (304 Not Modified)
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // If public, return data directly
    if (document.isPublic) {
      return NextResponse.json(
        {
          id: document.id,
          title: document.title,
          width: document.width,
          height: document.height,
          tags: document.tags,
          data: document.data,
          author: document.user?.username || null,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          embedUrl: buildEmbedUrl(document.user?.username, document.id),
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            'Access-Control-Allow-Origin': '*',
            'ETag': etag,
            'Last-Modified': document.updatedAt.toUTCString(),
          },
        }
      );
    }

    // Private document: require embed token
    if (!token) {
      return NextResponse.json(
        { error: 'This diagram is private. Provide a valid embed token.' },
        { status: 403 }
      );
    }

    // Validate embed token
    const embedToken = await prisma.embedToken.findUnique({
      where: { token },
    });

    if (!embedToken) {
      return NextResponse.json(
        { error: 'Invalid embed token' },
        { status: 403 }
      );
    }

    // Check token belongs to this document
    if (embedToken.documentId !== id) {
      return NextResponse.json(
        { error: 'Token does not match this diagram' },
        { status: 403 }
      );
    }

    // Check if revoked
    if (embedToken.revokedAt) {
      return NextResponse.json(
        { error: 'Embed token has been revoked' },
        { status: 403 }
      );
    }

    // Check expiry
    if (embedToken.expiresAt && embedToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Embed token has expired' },
        { status: 403 }
      );
    }

    // Token is valid — return the data
    return NextResponse.json(
      {
        id: document.id,
        title: document.title,
        width: document.width,
        height: document.height,
        tags: document.tags,
        data: document.data,
        author: document.user?.username || null,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
        embedUrl: buildEmbedUrl(document.user?.username, document.id),
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
          'ETag': etag,
          'Last-Modified': document.updatedAt.toUTCString(),
        },
      }
    );
  } catch (error) {
    console.error('Error fetching embed data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildEmbedUrl(username: string | null | undefined, documentId: string): string | null {
  if (!username) return null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/${username}/${documentId}`;
}
