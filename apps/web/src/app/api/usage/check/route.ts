import { NextRequest, NextResponse } from 'next/server';
import { checkUsageLimit, type FeatureType } from '@/lib/usage-metering';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usage/check?userId={userId}&feature={feature}
 * Check if a user can use a specific feature (within limits)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const feature = searchParams.get('feature');

    if (!userId || !feature) {
      return NextResponse.json(
        { error: 'userId and feature are required' },
        { status: 400 }
      );
    }

    const limitCheck = await checkUsageLimit(userId, feature as FeatureType);

    return NextResponse.json(limitCheck);
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return NextResponse.json(
      { error: 'Failed to check usage limit' },
      { status: 500 }
    );
  }
}
