/**
 * Tests for tier enforcement system
 */

import { describe, it, expect } from 'vitest';
import { getUpgradeMessage } from './tier-enforcement';

describe('Tier Enforcement', () => {
  describe('getUpgradeMessage', () => {
    it('should return correct message for private_diagrams', () => {
      const message = getUpgradeMessage('private_diagrams', 'free');
      expect(message).toBe('Upgrade to Pro to create private diagrams.');
    });

    it('should return correct message for ai_generation on free tier', () => {
      const message = getUpgradeMessage('ai_generation', 'free');
      expect(message).toContain('5 AI generations');
      expect(message).toContain('Upgrade to Pro');
    });

    it('should return correct message for ai_generation on pro tier', () => {
      const message = getUpgradeMessage('ai_generation', 'pro');
      expect(message).toContain('100 AI generations');
      expect(message).toContain('Upgrade to Team');
    });

    it('should return correct message for canvas size', () => {
      const message = getUpgradeMessage('max_canvas_width', 'free');
      expect(message).toContain('Upgrade to Pro or Team');
      expect(message).toContain('larger canvas sizes');
    });

    it('should return correct message for custom design systems', () => {
      const message = getUpgradeMessage('custom_design_systems', 'free');
      expect(message).toBe('Upgrade to Pro for unlimited custom design systems.');
    });
  });
});
