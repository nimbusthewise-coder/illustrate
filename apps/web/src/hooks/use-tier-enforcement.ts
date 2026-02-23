/**
 * React hooks for tier enforcement
 */

import { useState, useEffect } from 'react';

export type TierLimits = {
  tier: 'free' | 'pro' | 'team';
  features: {
    privateDocuments: boolean;
    maxCanvasSize: { width: number; height: number };
    customDesignSystems: number | 'unlimited';
    aiGenerationsPerMonth: number | 'unlimited';
  };
};

export type EnforcementCheck = {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  loading: boolean;
};

/**
 * Hook to get user's tier limits
 */
export function useTierLimits(userId: string | undefined) {
  const [limits, setLimits] = useState<TierLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLimits(null);
      setLoading(false);
      return;
    }

    const fetchLimits = async () => {
      try {
        const response = await fetch(`/api/tier/limits?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setLimits(data);
        }
      } catch (error) {
        console.error('Error fetching tier limits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [userId]);

  return { limits, loading };
}

/**
 * Hook to check if user can create private documents
 */
export function useCanCreatePrivate(userId: string | undefined): EnforcementCheck {
  const [check, setCheck] = useState<EnforcementCheck>({
    allowed: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setCheck({ allowed: false, loading: false });
      return;
    }

    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/tier/enforce/private-document?userId=${userId}`);
        const data = await response.json();
        setCheck({
          allowed: data.allowed,
          reason: data.reason,
          upgradeRequired: data.upgradeRequired,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking private document permission:', error);
        setCheck({ allowed: false, loading: false });
      }
    };

    checkPermission();
  }, [userId]);

  return check;
}

/**
 * Hook to check if user can create a canvas of given size
 */
export function useCanvasSize(userId: string | undefined, width: number, height: number): EnforcementCheck {
  const [check, setCheck] = useState<EnforcementCheck>({
    allowed: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setCheck({ allowed: false, loading: false });
      return;
    }

    const checkSize = async () => {
      try {
        const response = await fetch(
          `/api/tier/enforce/canvas-size?userId=${userId}&width=${width}&height=${height}`
        );
        const data = await response.json();
        setCheck({
          allowed: data.allowed,
          reason: data.reason,
          upgradeRequired: data.upgradeRequired,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking canvas size:', error);
        setCheck({ allowed: false, loading: false });
      }
    };

    checkSize();
  }, [userId, width, height]);

  return check;
}

/**
 * Hook to check if user can create another design system
 */
export function useCanCreateDesignSystem(userId: string | undefined): EnforcementCheck {
  const [check, setCheck] = useState<EnforcementCheck>({
    allowed: false,
    loading: true,
  });

  useEffect(() => {
    if (!userId) {
      setCheck({ allowed: false, loading: false });
      return;
    }

    const checkPermission = async () => {
      try {
        const response = await fetch(`/api/tier/enforce/design-system?userId=${userId}`);
        const data = await response.json();
        setCheck({
          allowed: data.allowed,
          reason: data.reason,
          upgradeRequired: data.upgradeRequired,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking design system permission:', error);
        setCheck({ allowed: false, loading: false });
      }
    };

    checkPermission();
  }, [userId]);

  return check;
}
