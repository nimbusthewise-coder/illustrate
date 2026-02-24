import { describe, it, expect } from 'vitest';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  ZOOM_STEP,
  clampZoom,
  roundZoom,
  incrementZoom,
  decrementZoom,
  resetZoom,
  formatZoom,
  applyWheelZoom,
} from './zoom';

describe('zoom utilities', () => {
  describe('clampZoom', () => {
    it('should clamp values below MIN_ZOOM', () => {
      expect(clampZoom(0.05)).toBe(MIN_ZOOM);
      expect(clampZoom(-1)).toBe(MIN_ZOOM);
    });

    it('should clamp values above MAX_ZOOM', () => {
      expect(clampZoom(10)).toBe(MAX_ZOOM);
      expect(clampZoom(100)).toBe(MAX_ZOOM);
    });

    it('should not modify values within range', () => {
      expect(clampZoom(1.0)).toBe(1.0);
      expect(clampZoom(2.5)).toBe(2.5);
      expect(clampZoom(0.5)).toBe(0.5);
    });
  });

  describe('roundZoom', () => {
    it('should round to nearest ZOOM_STEP', () => {
      expect(roundZoom(1.13)).toBe(1.25);
      expect(roundZoom(1.12)).toBe(1.0);
      expect(roundZoom(0.63)).toBe(0.75);
    });

    it('should handle exact multiples', () => {
      expect(roundZoom(1.0)).toBe(1.0);
      expect(roundZoom(1.5)).toBe(1.5);
      expect(roundZoom(2.0)).toBe(2.0);
    });
  });

  describe('incrementZoom', () => {
    it('should increase zoom by ZOOM_STEP', () => {
      expect(incrementZoom(1.0)).toBe(1.25);
      expect(incrementZoom(1.5)).toBe(1.75);
    });

    it('should not exceed MAX_ZOOM', () => {
      expect(incrementZoom(7.9)).toBe(MAX_ZOOM);
      expect(incrementZoom(MAX_ZOOM)).toBe(MAX_ZOOM);
    });

    it('should round the result', () => {
      expect(incrementZoom(1.13)).toBe(1.5);
    });
  });

  describe('decrementZoom', () => {
    it('should decrease zoom by ZOOM_STEP', () => {
      expect(decrementZoom(1.0)).toBe(0.75);
      expect(decrementZoom(2.0)).toBe(1.75);
    });

    it('should not go below MIN_ZOOM', () => {
      expect(decrementZoom(0.2)).toBe(MIN_ZOOM);
      expect(decrementZoom(MIN_ZOOM)).toBe(MIN_ZOOM);
    });

    it('should round the result', () => {
      expect(decrementZoom(1.13)).toBe(0.75);
    });
  });

  describe('resetZoom', () => {
    it('should return DEFAULT_ZOOM', () => {
      expect(resetZoom()).toBe(DEFAULT_ZOOM);
      expect(resetZoom()).toBe(1.0);
    });
  });

  describe('formatZoom', () => {
    it('should format as percentage', () => {
      expect(formatZoom(1.0)).toBe('100%');
      expect(formatZoom(0.5)).toBe('50%');
      expect(formatZoom(2.0)).toBe('200%');
    });

    it('should round to nearest integer', () => {
      expect(formatZoom(1.234)).toBe('123%');
      expect(formatZoom(0.667)).toBe('67%');
    });
  });

  describe('applyWheelZoom', () => {
    it('should zoom in when deltaY is negative', () => {
      const result = applyWheelZoom(1.0, -100);
      expect(result).toBeGreaterThan(1.0);
    });

    it('should zoom out when deltaY is positive', () => {
      const result = applyWheelZoom(1.0, 100);
      expect(result).toBeLessThan(1.0);
    });

    it('should respect zoom bounds', () => {
      expect(applyWheelZoom(MAX_ZOOM, -1000)).toBe(MAX_ZOOM);
      expect(applyWheelZoom(MIN_ZOOM, 1000)).toBe(MIN_ZOOM);
    });

    it('should use custom sensitivity', () => {
      const result1 = applyWheelZoom(1.0, -100, 0.001);
      const result2 = applyWheelZoom(1.0, -100, 0.002);
      expect(result2).toBeGreaterThan(result1);
    });
  });
});
