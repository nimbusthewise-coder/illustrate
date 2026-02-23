import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents
 * List all documents for the authenticated user
 * 
 * Query parameters:
 * - search: Filter by title (case-insensitive)
 * - tags: Comma-separated list of tags to filter by
 * - sortBy: 'date' or 'name' (default: 'date')
 * - sortOrder: 'asc' or 'desc' (default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined;
    const sortBy = (searchParams.get('sortBy') || 'date') as 'date' | 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build where clause
    const where: {
      userId: string;
      AND?: Array<{
        OR?: Array<{
          title?: { contains: string; mode: 'insensitive' };
        }>;
        tags?: { hasSome: string[] };
      }>;
    } = { userId: user.id };

    // Add filters
    if (search || tags) {
      where.AND = [];
      
      if (search) {
        where.AND.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
      
      if (tags && tags.length > 0) {
        where.AND.push({
          tags: { hasSome: tags },
        });
      }
    }

    // Build orderBy clause
    const orderBy =
      sortBy === 'name'
        ? { title: sortOrder }
        : { updatedAt: sortOrder };

    // Fetch documents
    const documents = await prisma.document.findMany({
      where,
      orderBy,
      select: {
        id: true,
        title: true,
        width: true,
        height: true,
        tags: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}
