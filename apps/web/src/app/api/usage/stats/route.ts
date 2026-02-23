import { NextRequest, NextResponse } from 'next/server';
import { getUserUsageStats } from '@/lib/usage-metering';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usage/stats?userId={userId}
 * Get comprehensive usage statistics for a user
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const stats = await getUserUsageStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
