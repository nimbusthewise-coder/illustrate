import { useEffect, useState } from 'react';

export interface FeatureUsage {
  feature: string;
  current: number;
  limit: number;
  percentage: number;
  exceeded: boolean;
}

export interface UsageStats {
  tier: 'FREE' | 'PRO' | 'TEAM';
  features: FeatureUsage[];
  period: {
    start: string;
    end: string;
  };
}

export function useUsageStats(userId: string) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(`/api/usage/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError(new Error('Failed to fetch stats'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return { stats, isLoading, error };
}

export function useFeatureLimit(userId?: string, feature?: string) {
  const [limitCheck, setLimitCheck] = useState<{
    allowed: boolean;
    current: number;
    limit: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !feature) {
      setIsLoading(false);
      return;
    }

    async function checkLimit() {
      try {
        const response = await fetch(`/api/usage/check?userId=${userId}&feature=${feature}`);
        if (response.ok) {
          const data = await response.json();
          setLimitCheck(data);
        }
      } catch (error) {
        console.error('Error checking feature limit:', error);
      } finally {
        setIsLoading(false);
      }
    }

    checkLimit();
  }, [userId, feature]);

  return { limitCheck, isLoading };
}
