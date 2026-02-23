/**
 * UpgradePrompt component
 * 
 * Displays an upgrade prompt when users hit tier limits
 */

import Link from 'next/link';

export interface UpgradePromptProps {
  title?: string;
  message: string;
  tier: 'free' | 'pro' | 'team';
  variant?: 'banner' | 'modal' | 'inline';
}

export function UpgradePrompt({
  title = 'Upgrade Required',
  message,
  tier,
  variant = 'inline',
}: UpgradePromptProps) {
  const targetTier = tier === 'free' ? 'Pro' : 'Team';

  const styles = {
    banner: 'w-full bg-warning/15 text-warning border-warning p-4 rounded-lg border',
    modal: 'bg-card text-card-foreground border border-border rounded-xl p-6 shadow-lg',
    inline: 'bg-muted text-foreground border border-border rounded-lg p-4',
  };

  return (
    <div className={styles[variant]}>
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        
        <div className="flex gap-2">
          <Link
            href="/pricing"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade to {targetTier}
          </Link>
          <Link
            href="/pricing"
            className="border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact upgrade button for inline use
 */
export function UpgradeButton({
  tier,
  size = 'default',
}: {
  tier: 'free' | 'pro' | 'team';
  size?: 'small' | 'default';
}) {
  const targetTier = tier === 'free' ? 'Pro' : 'Team';
  const sizeClasses = {
    small: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
  };

  return (
    <Link
      href="/pricing"
      className={`bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity inline-block ${sizeClasses[size]}`}
    >
      Upgrade to {targetTier}
    </Link>
  );
}
