import { recordUsage, checkUsageLimit, type FeatureType } from './usage-metering';

/**
 * Wrapper for AI generation usage recording with proper error handling
 */
export async function recordAiGeneration(
  userId: string,
  metadata?: {
    prompt?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    designSystem?: string;
  }
) {
  return recordUsage(userId, 'ai_generation', 1, metadata);
}

/**
 * Check if user can generate AI content
 */
export async function canGenerateAi(userId: string): Promise<boolean> {
  const check = await checkUsageLimit(userId, 'ai_generation');
  return check.allowed;
}

/**
 * Check if user can create private diagrams
 */
export async function canCreatePrivate(userId: string): Promise<boolean> {
  const check = await checkUsageLimit(userId, 'private_diagrams');
  return check.allowed;
}

/**
 * Validate canvas size against user's tier limits
 */
export async function validateCanvasSize(
  userId: string,
  width: number,
  height: number
): Promise<{ valid: boolean; reason?: string }> {
  const tier = await import('./usage-metering').then(m => m.getUserTier(userId));
  const tierConfig = await import('./usage-metering').then(m => m.SUBSCRIPTION_TIERS[tier]);

  if (width > tierConfig.limits.max_canvas_width) {
    return {
      valid: false,
      reason: `Canvas width ${width} exceeds ${tier} tier limit of ${tierConfig.limits.max_canvas_width}`,
    };
  }

  if (height > tierConfig.limits.max_canvas_height) {
    return {
      valid: false,
      reason: `Canvas height ${height} exceeds ${tier} tier limit of ${tierConfig.limits.max_canvas_height}`,
    };
  }

  return { valid: true };
}

/**
 * Error class for usage limit exceeded
 */
export class UsageLimitError extends Error {
  constructor(
    public feature: FeatureType,
    public current: number,
    public limit: number
  ) {
    super(`Usage limit exceeded for ${feature}: ${current}/${limit}`);
    this.name = 'UsageLimitError';
  }
}

/**
 * Wrapper that throws on limit exceeded
 */
export async function recordUsageOrThrow(
  userId: string,
  feature: FeatureType,
  count: number = 1,
  metadata?: Record<string, unknown>
): Promise<void> {
  const result = await recordUsage(userId, feature, count, metadata);
  
  if (!result.success) {
    throw new UsageLimitError(feature, result.usage.current, result.usage.limit);
  }
}
