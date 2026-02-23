'use client';

import { useUsageStats } from '@/hooks/use-usage-metering';

interface UsageDisplayProps {
  userId: string;
  compact?: boolean;
}

export function UsageDisplay({ userId, compact = false }: UsageDisplayProps) {
  const { stats, isLoading, error } = useUsageStats(userId);

  if (isLoading) {
    return (
      <div className="bg-muted rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-border rounded w-24 mb-2"></div>
        <div className="h-8 bg-border rounded w-full"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-error/15 text-error rounded-lg p-4">
        <p className="text-sm">Failed to load usage stats</p>
      </div>
    );
  }

  const aiGeneration = stats.features.find(f => f.feature === 'ai_generation');

  if (compact && aiGeneration) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">AI generations:</span>
        <span className={aiGeneration.exceeded ? 'text-error' : 'text-foreground'}>
          {aiGeneration.current} / {aiGeneration.limit === Infinity ? '∞' : aiGeneration.limit}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Usage this month</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {String(stats.tier).toUpperCase()}
        </span>
      </div>

      <div className="space-y-3">
        {stats.features.map((feature) => {
          const percentage = Math.min(feature.percentage, 100);
          const isUnlimited = feature.limit === Infinity;
          
          return (
            <div key={feature.feature} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">
                  {feature.feature.replace(/_/g, ' ')}
                </span>
                <span className={feature.exceeded ? 'text-error font-medium' : 'text-foreground'}>
                  {feature.current} {isUnlimited ? '' : `/ ${feature.limit}`}
                  {isUnlimited && <span className="text-muted-foreground ml-1">(unlimited)</span>}
                </span>
              </div>
              {!isUnlimited && (
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      feature.exceeded
                        ? 'bg-error'
                        : percentage > 80
                        ? 'bg-warning'
                        : 'bg-success'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Resets on {new Date(stats.period.end).toLocaleDateString()}
      </p>
    </div>
  );
}
