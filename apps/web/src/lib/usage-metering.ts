import { prisma } from './prisma';

/**
 * Subscription tiers with their usage limits
 * -1 means unlimited for any limit field
 */
interface TierLimits {
  ai_generation: number;
  private_diagrams: number;
  max_canvas_width: number;
  max_canvas_height: number;
  custom_design_systems: number;
}

interface TierConfig {
  id: string;
  name: string;
  limits: TierLimits;
}

export const SUBSCRIPTION_TIERS: Record<string, TierConfig> & {
  free: TierConfig;
  pro: TierConfig;
  team: TierConfig;
} = {
  free: {
    id: 'free',
    name: 'Free',
    limits: {
      ai_generation: 5,
      private_diagrams: 0,
      max_canvas_width: 120,
      max_canvas_height: 60,
      custom_design_systems: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    limits: {
      ai_generation: 100,
      private_diagrams: -1, // -1 means unlimited
      max_canvas_width: 256,
      max_canvas_height: 256,
      custom_design_systems: -1,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    limits: {
      ai_generation: 500, // Pooled across team
      private_diagrams: -1,
      max_canvas_width: 256,
      max_canvas_height: 256,
      custom_design_systems: -1,
    },
  },
};

export type SubscriptionTierId = 'free' | 'pro' | 'team';
export type FeatureType = keyof TierLimits;

/**
 * Get the current billing period boundaries
 */
export function getCurrentBillingPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get user's subscription tier
 * Defaults to 'free' if no active subscription
 */
export async function getUserTier(userId: string): Promise<SubscriptionTierId> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  // Map Stripe product IDs to tiers
  // These should match your actual Stripe product IDs
  const productTierMap: Record<string, SubscriptionTierId> = {
    // Update these with your actual Stripe product IDs
    prod_pro: 'pro',
    prod_team: 'team',
  };

  return productTierMap[subscription.stripeProductId] ?? 'free';
}

/**
 * Get usage count for a specific feature in the current billing period
 */
export async function getUsageCount(
  userId: string,
  feature: FeatureType
): Promise<number> {
  const { start, end } = getCurrentBillingPeriod();

  const records = await prisma.usageRecord.findMany({
    where: {
      userId,
      feature,
      periodStart: { gte: start },
      periodEnd: { lte: end },
    },
  });

  return records.reduce((sum: number, record: { count: number }) => sum + record.count, 0);
}

/**
 * Check if user has exceeded their limit for a feature
 */
export async function checkUsageLimit(
  userId: string,
  feature: FeatureType
): Promise<{ allowed: boolean; current: number; limit: number; tier: SubscriptionTierId }> {
  const tier = await getUserTier(userId);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const limit = tierConfig.limits[feature];
  const current = await getUsageCount(userId, feature);

  // -1 means unlimited
  const allowed = limit === -1 || current < limit;

  return {
    allowed,
    current,
    limit: limit === -1 ? Infinity : limit,
    tier,
  };
}

/**
 * Record a usage event
 * Returns true if recording was successful, false if limit exceeded
 */
export async function recordUsage(
  userId: string,
  feature: FeatureType,
  count: number = 1,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; usage: { current: number; limit: number } }> {
  // Check limit before recording
  const limitCheck = await checkUsageLimit(userId, feature);

  if (!limitCheck.allowed) {
    return {
      success: false,
      usage: {
        current: limitCheck.current,
        limit: limitCheck.limit,
      },
    };
  }

  const { start, end } = getCurrentBillingPeriod();

  await prisma.usageRecord.create({
    data: {
      userId,
      feature,
      count,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      periodStart: start,
      periodEnd: end,
    },
  });

  return {
    success: true,
    usage: {
      current: limitCheck.current + count,
      limit: limitCheck.limit,
    },
  };
}

/**
 * Get comprehensive usage stats for a user
 */
export async function getUserUsageStats(userId: string) {
  const tier = await getUserTier(userId);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const { start, end } = getCurrentBillingPeriod();

  const features: FeatureType[] = Object.keys(tierConfig.limits) as FeatureType[];
  const stats = await Promise.all(
    features.map(async (feature) => {
      const current = await getUsageCount(userId, feature);
      const limit = tierConfig.limits[feature];

      return {
        feature,
        current,
        limit: limit === -1 ? Infinity : limit,
        percentage: limit === -1 ? 0 : (current / limit) * 100,
        exceeded: limit !== -1 && current >= limit,
      };
    })
  );

  return {
    tier,
    period: { start, end },
    features: stats,
  };
}

/**
 * Clean up old usage records (older than 12 months)
 * This should be run periodically as a cron job
 */
export async function cleanupOldUsageRecords(): Promise<number> {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const result = await prisma.usageRecord.deleteMany({
    where: {
      periodEnd: { lt: twelveMonthsAgo },
    },
  });

  return result.count;
}
