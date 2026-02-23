/**
 * TierLimitsDisplay component
 * 
 * Shows the user's current tier limits and usage
 */

'use client';

import { useTierLimits } from '@/hooks/use-tier-enforcement';
import { useUsageStats } from '@/hooks/use-usage-metering';
import { TierBadge } from './TierBadge';
import { UpgradeButton } from './UpgradePrompt';

export interface TierLimitsDisplayProps {
  userId: string;
}

export function TierLimitsDisplay({ userId }: TierLimitsDisplayProps) {
  const { limits, loading: limitsLoading } = useTierLimits(userId);
  const { stats, isLoading: statsLoading } = useUsageStats(userId);

  if (limitsLoading || statsLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!limits) {
    return null;
  }

  const aiUsage = stats?.features.find(f => f.feature === 'ai_generation');

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Plan</h3>
        <TierBadge tier={limits.tier} />
      </div>

      <div className="space-y-4">
        {/* Private Documents */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Private Diagrams</span>
            <span className="text-sm text-muted-foreground">
              {limits.features.privateDocuments ? 'Unlimited' : 'Not Available'}
            </span>
          </div>
          {!limits.features.privateDocuments && (
            <p className="text-xs text-muted-foreground">
              Public diagrams only on Free tier
            </p>
          )}
        </div>

        {/* Canvas Size */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Max Canvas Size</span>
            <span className="text-sm text-muted-foreground">
              {limits.features.maxCanvasSize.width}×{limits.features.maxCanvasSize.height}
            </span>
          </div>
        </div>

        {/* AI Generations */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">AI Generations/Month</span>
            <span className="text-sm text-muted-foreground">
              {aiUsage
                ? `${aiUsage.current}/${limits.features.aiGenerationsPerMonth === 'unlimited' ? '∞' : limits.features.aiGenerationsPerMonth}`
                : limits.features.aiGenerationsPerMonth === 'unlimited'
                ? 'Unlimited'
                : limits.features.aiGenerationsPerMonth}
            </span>
          </div>
          {aiUsage && limits.features.aiGenerationsPerMonth !== 'unlimited' && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  aiUsage.percentage > 90
                    ? 'bg-error'
                    : aiUsage.percentage > 70
                    ? 'bg-warning'
                    : 'bg-success'
                }`}
                style={{ width: `${Math.min(aiUsage.percentage, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Custom Design Systems */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Custom Design Systems</span>
            <span className="text-sm text-muted-foreground">
              {limits.features.customDesignSystems === 'unlimited'
                ? 'Unlimited'
                : limits.features.customDesignSystems}
            </span>
          </div>
        </div>

        {/* Upgrade CTA for free users */}
        {limits.tier === 'free' && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Upgrade to unlock unlimited private diagrams, larger canvases, and more AI generations.
            </p>
            <UpgradeButton tier="free" />
          </div>
        )}
      </div>
    </div>
  );
}
