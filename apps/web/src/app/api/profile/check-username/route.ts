import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-utils';

/**
 * GET /api/profile/check-username?username=example
 * Check if a username is available
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { available: false, reason: 'Username must be 3-30 characters' },
        { status: 200 }
      );
    }

    if (!/^[a-z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { available: false, reason: 'Username can only contain lowercase letters, numbers, hyphens, and underscores' },
        { status: 200 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    // If user is logged in, allow their own username
    const currentUser = await getCurrentUser();
    if (currentUser && existingUser?.id === currentUser.id) {
      return NextResponse.json({ available: true });
    }

    return NextResponse.json({
      available: !existingUser,
      reason: existingUser ? 'Username already taken' : undefined,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
