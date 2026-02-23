import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { renderDocumentToASCII } from '@/lib/ascii-render';

export const dynamic = 'force-dynamic';

/**
 * GET /api/embed/{id}/txt
 *
 * Returns plain ASCII text rendering of the diagram.
 * No HTML wrapper, suitable for curl.
 * Content-Type: text/plain; charset=utf-8
 *
 * Public diagrams: accessible without auth.
 * Private diagrams: require ?token= query param with valid embed token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token');

    // Find the document
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return new NextResponse('Diagram not found\n', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Access control
    if (!document.isPublic) {
      if (!token) {
        return new NextResponse(
          'This diagram is private. Provide a valid embed token as ?token=...\n',
          {
            status: 403,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          },
        );
      }

      // Validate embed token
      const embedToken = await prisma.embedToken.findUnique({
        where: { token },
      });

      if (!embedToken || embedToken.documentId !== id) {
        return new NextResponse('Invalid embed token\n', {
          status: 403,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      if (embedToken.revokedAt) {
        return new NextResponse('Embed token has been revoked\n', {
          status: 403,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      if (embedToken.expiresAt && embedToken.expiresAt < new Date()) {
        return new NextResponse('Embed token has expired\n', {
          status: 403,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    }

    // Render document data to plain ASCII
    const ascii = renderDocumentToASCII(document.data, document.width, document.height);

    const cacheControl = document.isPublic
      ? 'public, s-maxage=60, stale-while-revalidate=300'
      : 'private, s-maxage=60, stale-while-revalidate=300';

    return new NextResponse(ascii + '\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': cacheControl,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error rendering ASCII text:', error);
    return new NextResponse('Internal server error\n', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
