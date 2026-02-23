import { SUBSCRIPTION_TIERS } from '@/lib/usage-metering';

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type FeatureName = keyof typeof SUBSCRIPTION_TIERS.free.limits;

export interface UsageLimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  tier: SubscriptionTier;
}

export interface UsageStats {
  tier: SubscriptionTier;
  period: {
    start: Date;
    end: Date;
  };
  features: Array<{
    feature: FeatureName;
    current: number;
    limit: number;
    percentage: number;
    exceeded: boolean;
  }>;
}

export interface RecordUsageResult {
  success: boolean;
  usage: {
    current: number;
    limit: number;
  };
}
