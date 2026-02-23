'use client';

import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';

export function SubscriptionBadge() {
  const { plan, loading, subscription } = useSubscription();

  if (loading) {
    return null;
  }

  const getPlanColor = () => {
    switch (plan) {
      case 'PRO':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'TEAM':
        return 'bg-success/15 text-success border-success/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPlanLabel = () => {
    if (plan === 'FREE') return 'Free';
    if (subscription?.status !== 'active') {
      return `${plan} (${subscription?.status})`;
    }
    return plan;
  };

  return (
    <Link
      href="/billing"
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getPlanColor()} hover:opacity-80 transition-opacity`}
    >
      {getPlanLabel()}
      {plan === 'FREE' && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      )}
    </Link>
  );
}
