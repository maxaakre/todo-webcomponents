import { describe, expect, it } from 'vitest';
import { contrastRatio, toRgb } from './contrast.js';

describe('contrast helper', () => {
  it('reads rgb(), hex, and what color-mix() resolves to (color(srgb …), oklab(…))', () => {
    expect(toRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(toRgb('rgb(0, 128, 255)')).toEqual([0, 128, 255]);
    const mixed = toRgb('color-mix(in srgb, #000000 50%, #ffffff)');
    mixed.forEach((c) => expect(Math.abs(c - 128)).toBeLessThanOrEqual(1));
    expect(toRgb('oklab(0.628 0.225 0.126)').map((c) => Math.round(c / 10))).toEqual([26, 0, 0]); // ≈ red
  });

  it('gives the WCAG ratios for known pairs', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });
});
