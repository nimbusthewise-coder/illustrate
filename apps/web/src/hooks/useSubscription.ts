import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPlan, type PlanType, STRIPE_PLANS } from '@/lib/stripe';

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  stripePriceId: string;
}

export function useSubscription() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanType>('FREE');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscription();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setPlan('FREE');
    }
  }, [status]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/billing/subscription');

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);

        if (data.subscription) {
          setPlan(getUserPlan(data.subscription.stripePriceId));
        } else {
          setPlan('FREE');
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setPlan('FREE');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: keyof typeof STRIPE_PLANS.PRO.features): boolean => {
    const planFeatures = STRIPE_PLANS[plan].features;
    return feature in planFeatures && Boolean(planFeatures[feature as keyof typeof planFeatures]);
  };

  const canAccessFeature = (feature: keyof typeof STRIPE_PLANS.PRO.features): boolean => {
    if (plan === 'FREE') {
      return feature in STRIPE_PLANS.FREE.features;
    }
    return hasFeature(feature);
  };

  const getFeatureLimit = (
    feature: keyof typeof STRIPE_PLANS.PRO.features
  ): any => {
    const planFeatures = STRIPE_PLANS[plan].features;
    return planFeatures[feature as keyof typeof planFeatures];
  };

  return {
    subscription,
    plan,
    loading,
    isActive: subscription?.status === 'active',
    isPro: plan === 'PRO',
    isTeam: plan === 'TEAM',
    isFree: plan === 'FREE',
    hasFeature,
    canAccessFeature,
    getFeatureLimit,
    refetch: fetchSubscription,
  };
}
