// Usage Metering (simplified stubs for Phase 6)
export {
  recordUsage,
  checkUsageLimit,
  getUserUsageStats,
  type FeatureType,
} from './usage-metering';

// Tier Enforcement (F067)
export {
  enforcePrivateDocumentCreation,
  enforceCanvasSize,
  enforceDesignSystemCreation,
  enforceDocumentOperation,
  getUserFeatureAccess,
  getUpgradeMessage,
  type EnforcementResult,
} from './tier-enforcement';

export { prisma } from './prisma';
export * from './themes';
export * from './export';
export * from './auth';
export * from './auth-utils';
