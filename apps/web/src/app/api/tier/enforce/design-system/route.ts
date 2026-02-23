import { NextRequest, NextResponse } from 'next/server';
import { enforceDesignSystemCreation } from '@/lib/tier-enforcement';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tier/enforce/design-system?userId={userId}
 * Check if user can create another design system
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

    const result = await enforceDesignSystemCreation(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking design system permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
