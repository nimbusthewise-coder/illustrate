import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

export type PlanType = 'FREE' | 'PRO' | 'TEAM';

export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: {
      publicDiagrams: 'unlimited' as const,
      privateDiagrams: 0,
      canvasSize: '120×60',
      embedURLs: true,
      asciiExport: true,
      svgExport: true,
      customDesignSystems: 1,
      aiGenerations: 5,
    },
  },
  PRO: {
    name: 'Pro',
    price: 8,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    features: {
      publicDiagrams: 'unlimited' as const,
      privateDiagrams: 'unlimited' as const,
      canvasSize: '256×256',
      embedURLs: true,
      asciiExport: true,
      svgExport: true,
      customDesignSystems: 'unlimited' as const,
      aiGenerations: 100,
      apiAccess: true,
      prioritySupport: true,
    },
  },
  TEAM: {
    name: 'Team',
    price: 12,
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    features: {
      publicDiagrams: 'unlimited' as const,
      privateDiagrams: 'unlimited' as const,
      canvasSize: '256×256',
      embedURLs: true,
      asciiExport: true,
      svgExport: true,
      customDesignSystems: 'unlimited' as const,
      aiGenerations: 500,
      apiAccess: true,
      prioritySupport: true,
      sharedTeamLibrary: true,
      teamMembers: true,
      sso: true,
      auditLog: true,
    },
  },
};

export function getUserPlan(stripePriceId?: string): PlanType {
  if (!stripePriceId) return 'FREE';
  if (stripePriceId === STRIPE_PLANS.PRO.stripePriceId) return 'PRO';
  if (stripePriceId === STRIPE_PLANS.TEAM.stripePriceId) return 'TEAM';
  return 'FREE';
}
