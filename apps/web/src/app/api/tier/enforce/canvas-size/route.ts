import { NextRequest, NextResponse } from 'next/server';
import { enforceCanvasSize } from '@/lib/tier-enforcement';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tier/enforce/canvas-size?userId={userId}&width={width}&height={height}
 * Check if user can create a canvas of given dimensions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const widthStr = searchParams.get('width');
    const heightStr = searchParams.get('height');

    if (!userId || !widthStr || !heightStr) {
      return NextResponse.json(
        { error: 'userId, width, and height are required' },
        { status: 400 }
      );
    }

    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    if (isNaN(width) || isNaN(height)) {
      return NextResponse.json(
        { error: 'width and height must be valid numbers' },
        { status: 400 }
      );
    }

    const result = await enforceCanvasSize(userId, width, height);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking canvas size:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
