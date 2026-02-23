/**
 * Tier Enforcement System
 * 
 * Enforces subscription tier limits across the application.
 * Works in conjunction with usage-metering.ts to block actions
 * when users exceed their tier limits.
 */

import { prisma } from './prisma';
import { getUserTier, SUBSCRIPTION_TIERS, type SubscriptionTierId, type FeatureType } from './usage-metering';
import { canCreatePrivate, validateCanvasSize } from './usage-helpers';

export type EnforcementResult = {
  allowed: boolean;
  reason?: string;
  tier: SubscriptionTierId;
  upgradeRequired?: boolean;
};

/**
 * Check if user can create a private document
 */
export async function enforcePrivateDocumentCreation(
  userId: string
): Promise<EnforcementResult> {
  const tier = await getUserTier(userId);
  const allowed = await canCreatePrivate(userId);

  if (!allowed) {
    return {
      allowed: false,
      reason: 'Private diagrams are not available on the Free tier. Upgrade to Pro to create private diagrams.',
      tier,
      upgradeRequired: true,
    };
  }

  return { allowed: true, tier };
}

/**
 * Check if user can create or resize a canvas to given dimensions
 */
export async function enforceCanvasSize(
  userId: string,
  width: number,
  height: number
): Promise<EnforcementResult> {
  const tier = await getUserTier(userId);
  const validation = await validateCanvasSize(userId, width, height);

  if (!validation.valid) {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    return {
      allowed: false,
      reason: validation.reason || `Canvas size ${width}×${height} exceeds your tier limit (${tierConfig.limits.max_canvas_width}×${tierConfig.limits.max_canvas_height})`,
      tier,
      upgradeRequired: tier === 'free',
    };
  }

  return { allowed: true, tier };
}

/**
 * Check if user can create another custom design system
 */
export async function enforceDesignSystemCreation(
  userId: string
): Promise<EnforcementResult> {
  const tier = await getUserTier(userId);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const limit = tierConfig.limits.custom_design_systems;

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, tier };
  }

  // Count user's existing custom design systems
  const count = await prisma.designSystem.count({
    where: { userId },
  });

  if (count >= limit) {
    return {
      allowed: false,
      reason: `You have reached the limit of ${limit} custom design system${limit === 1 ? '' : 's'} on the ${tierConfig.name} tier. Upgrade to create more.`,
      tier,
      upgradeRequired: true,
    };
  }

  return { allowed: true, tier };
}

/**
 * Get a list of features the user has access to
 */
export async function getUserFeatureAccess(userId: string): Promise<{
  tier: SubscriptionTierId;
  features: {
    privateDocuments: boolean;
    maxCanvasSize: { width: number; height: number };
    customDesignSystems: number | 'unlimited';
    aiGenerationsPerMonth: number | 'unlimited';
  };
}> {
  const tier = await getUserTier(userId);
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  return {
    tier,
    features: {
      privateDocuments: tierConfig.limits.private_diagrams !== 0,
      maxCanvasSize: {
        width: tierConfig.limits.max_canvas_width,
        height: tierConfig.limits.max_canvas_height,
      },
      customDesignSystems:
        tierConfig.limits.custom_design_systems === -1
          ? 'unlimited'
          : tierConfig.limits.custom_design_systems,
      aiGenerationsPerMonth:
        tierConfig.limits.ai_generation === -1
          ? 'unlimited'
          : tierConfig.limits.ai_generation,
    },
  };
}

/**
 * Get upgrade message for a specific feature
 */
export function getUpgradeMessage(feature: FeatureType, tier: SubscriptionTierId): string {
  const tierConfig = SUBSCRIPTION_TIERS[tier];

  const messages: Record<FeatureType, string> = {
    private_diagrams: 'Upgrade to Pro to create private diagrams.',
    ai_generation: `You've used all ${tierConfig.limits.ai_generation} AI generations this month. Upgrade to ${tier === 'free' ? 'Pro' : 'Team'} for more.`,
    max_canvas_width: `Upgrade to ${tier === 'free' ? 'Pro or Team' : 'unlimited'} for larger canvas sizes.`,
    max_canvas_height: `Upgrade to ${tier === 'free' ? 'Pro or Team' : 'unlimited'} for larger canvas sizes.`,
    custom_design_systems: `Upgrade to Pro for unlimited custom design systems.`,
  };

  return messages[feature] || `This feature is not available on your current plan.`;
}

/**
 * Check if a document operation is allowed
 */
export async function enforceDocumentOperation(
  userId: string,
  documentId: string,
  operation: 'read' | 'update' | 'delete'
): Promise<EnforcementResult> {
  const tier = await getUserTier(userId);

  // Get the document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    return {
      allowed: false,
      reason: 'Document not found',
      tier,
    };
  }

  // Check if user owns the document
  if (document.userId !== userId) {
    // For read operations, check if document is public
    if (operation === 'read' && document.isPublic) {
      return { allowed: true, tier };
    }

    return {
      allowed: false,
      reason: 'You do not have permission to access this document',
      tier,
    };
  }

  // User owns the document - allow all operations
  return { allowed: true, tier };
}

/**
 * Enforce badge/branding requirements for free tier embeds
 */
export async function enforceBadgeRequirement(userId: string): Promise<{
  requiresBadge: boolean;
  tier: SubscriptionTierId;
}> {
  const tier = await getUserTier(userId);
  return {
    requiresBadge: tier === 'free',
    tier,
  };
}
