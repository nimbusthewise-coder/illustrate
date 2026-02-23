import { NextRequest, NextResponse } from 'next/server';
import { getUserFeatureAccess } from '@/lib/tier-enforcement';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tier/limits?userId={userId}
 * Get user's tier limits and feature access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const access = await getUserFeatureAccess(userId);

    return NextResponse.json(access);
  } catch (error) {
    console.error('Error fetching tier limits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
