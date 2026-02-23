import { NextRequest, NextResponse } from 'next/server';
import { recordUsage, type FeatureType } from '@/lib/usage-metering';

export const dynamic = 'force-dynamic';

/**
 * POST /api/usage/record
 * Record a usage event for a user
 * 
 * Body: {
 *   userId: string;
 *   feature: FeatureType;
 *   count?: number;
 *   metadata?: Record<string, unknown>;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, feature, count = 1, metadata } = body;

    if (!userId || !feature) {
      return NextResponse.json(
        { error: 'userId and feature are required' },
        { status: 400 }
      );
    }

    await recordUsage(
      userId,
      feature as FeatureType,
      count
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording usage:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}
