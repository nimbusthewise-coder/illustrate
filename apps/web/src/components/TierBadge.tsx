/**
 * TierBadge component
 * 
 * Displays a user's subscription tier
 */

export interface TierBadgeProps {
  tier: 'free' | 'pro' | 'team';
  size?: 'small' | 'default' | 'large';
  showLabel?: boolean;
}

export function TierBadge({ tier, size = 'default', showLabel = true }: TierBadgeProps) {
  const tierConfig = {
    free: {
      label: 'Free',
      color: 'bg-muted text-muted-foreground',
    },
    pro: {
      label: 'Pro',
      color: 'bg-primary text-primary-foreground',
    },
    team: {
      label: 'Team',
      color: 'bg-info text-info-foreground',
    },
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    default: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-1.5',
  };

  const config = tierConfig[tier];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${config.color} ${sizeClasses[size]}`}
    >
      {showLabel && config.label}
    </span>
  );
}

/**
 * Tier comparison display for pricing pages
 */
export function TierComparison() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Tier */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Free</h3>
          <TierBadge tier="free" size="small" />
        </div>
        <p className="text-3xl font-bold mb-2">$0</p>
        <p className="text-sm text-muted-foreground mb-6">Perfect for open source</p>
        
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Unlimited public diagrams</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Canvas up to 120×60</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>5 AI generations/month</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>1 custom design system</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-muted-foreground">✗</span>
            <span className="text-muted-foreground">No private diagrams</span>
          </li>
        </ul>
      </div>

      {/* Pro Tier */}
      <div className="border-2 border-primary rounded-xl p-6 bg-card relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
          Most Popular
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Pro</h3>
          <TierBadge tier="pro" size="small" />
        </div>
        <p className="text-3xl font-bold mb-2">$8</p>
        <p className="text-sm text-muted-foreground mb-6">For professional developers</p>
        
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Everything in Free</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Unlimited private diagrams</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Canvas up to 256×256</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>100 AI generations/month</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Unlimited design systems</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>API access</span>
          </li>
        </ul>
      </div>

      {/* Team Tier */}
      <div className="border border-border rounded-xl p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Team</h3>
          <TierBadge tier="team" size="small" />
        </div>
        <p className="text-3xl font-bold mb-2">$12</p>
        <p className="text-sm text-muted-foreground mb-6">per user/month</p>
        
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Everything in Pro</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Shared team library</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>500 AI generations/month (pooled)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Team management</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>SSO (Google/GitHub)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-success">✓</span>
            <span>Audit log</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
