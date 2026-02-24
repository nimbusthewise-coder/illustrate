import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsv,
  hsvToRgb,
  hexToHsv,
  hsvToHex,
  isValidHex,
  normalizeHex,
  getContrastColor,
} from './colorUtils';

describe('colorUtils', () => {
  describe('hexToRgb', () => {
    it('converts hex to RGB', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('handles hex without # prefix', () => {
      expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('converts RGB to hex', () => {
      expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
      expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
      expect(rgbToHex({ r: 0, g: 255, b: 0 })).toBe('#00ff00');
      expect(rgbToHex({ r: 0, g: 0, b: 255 })).toBe('#0000ff');
    });
  });

  describe('rgbToHsv and hsvToRgb', () => {
    it('converts RGB to HSV and back', () => {
      const testColors = [
        { r: 255, g: 0, b: 0 }, // Red
        { r: 0, g: 255, b: 0 }, // Green
        { r: 0, g: 0, b: 255 }, // Blue
        { r: 255, g: 255, b: 255 }, // White
        { r: 0, g: 0, b: 0 }, // Black
      ];

      testColors.forEach((rgb) => {
        const hsv = rgbToHsv(rgb);
        const convertedRgb = hsvToRgb(hsv);
        expect(convertedRgb.r).toBeCloseTo(rgb.r, 0);
        expect(convertedRgb.g).toBeCloseTo(rgb.g, 0);
        expect(convertedRgb.b).toBeCloseTo(rgb.b, 0);
      });
    });
  });

  describe('hexToHsv and hsvToHex', () => {
    it('converts hex to HSV and back', () => {
      const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffffff', '#000000'];

      testColors.forEach((hex) => {
        const hsv = hexToHsv(hex);
        const convertedHex = hsvToHex(hsv);
        expect(convertedHex.toLowerCase()).toBe(hex.toLowerCase());
      });
    });
  });

  describe('isValidHex', () => {
    it('validates hex color format', () => {
      expect(isValidHex('#000000')).toBe(true);
      expect(isValidHex('#FFFFFF')).toBe(true);
      expect(isValidHex('#ff0000')).toBe(true);
      expect(isValidHex('#abc123')).toBe(true);
    });

    it('rejects invalid hex formats', () => {
      expect(isValidHex('000000')).toBe(false); // Missing #
      expect(isValidHex('#fff')).toBe(false); // Too short
      expect(isValidHex('#gggggg')).toBe(false); // Invalid characters
      expect(isValidHex('#00000')).toBe(false); // Too short
      expect(isValidHex('#0000000')).toBe(false); // Too long
    });
  });

  describe('normalizeHex', () => {
    it('normalizes hex colors', () => {
      expect(normalizeHex('000000')).toBe('#000000');
      expect(normalizeHex('#ffffff')).toBe('#FFFFFF');
      expect(normalizeHex('  #ff0000  ')).toBe('#FF0000');
    });
  });

  describe('getContrastColor', () => {
    it('returns black for light backgrounds', () => {
      expect(getContrastColor('#ffffff')).toBe('#000000');
      expect(getContrastColor('#ffff00')).toBe('#000000');
    });

    it('returns white for dark backgrounds', () => {
      expect(getContrastColor('#000000')).toBe('#ffffff');
      expect(getContrastColor('#0000ff')).toBe('#ffffff');
    });
  });
});
