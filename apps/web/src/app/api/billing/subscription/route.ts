import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserPlan } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Determine plan tier from price ID
    const plan = getUserPlan(user.stripePriceId || undefined);

    // Return subscription data
    return NextResponse.json({
      subscription: {
        tier: plan,
        status: user.subscription?.status || 'active',
        currentPeriodEnd: user.stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
