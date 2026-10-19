import { describe, it, expect } from 'vitest';
import {
  mean,
  sampleStdDev,
  linearRegression,
  percentError,
  mulberry32,
  gaussianNoise,
} from './stats';

describe('stats.ts utility functions', () => {
  describe('mean', () => {
    it('calculates the arithmetic mean correctly', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
      expect(mean([10, 20])).toBe(15);
      expect(mean([-5, 5])).toBe(0);
    });

    it('returns 0 for empty arrays', () => {
      expect(mean([])).toBe(0);
    });

    it('handles single elements', () => {
      expect(mean([42])).toBe(42);
    });
  });

  describe('sampleStdDev', () => {
    it('calculates sample standard deviation with Bessel correction (N-1)', () => {
      // Data: [2, 4, 4, 4, 5, 5, 7, 9], N = 8, mean = 5
      // Differences: -3, -1, -1, -1, 0, 0, +2, +4
      // Squared diffs: 9, 1, 1, 1, 0, 0, 4, 16 -> sum = 32
      // Variance = 32 / 7 = 4.57142857...
      // StdDev = sqrt(32 / 7) ≈ 2.1380899...
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const s = sampleStdDev(data);
      expect(s).toBeCloseTo(Math.sqrt(32 / 7), 6);
    });

    it('returns 0 for fewer than 2 elements', () => {
      expect(sampleStdDev([])).toBe(0);
      expect(sampleStdDev([10])).toBe(0);
    });
  });

  describe('linearRegression', () => {
    it('computes exact slope and intercept for a perfect line y = 2x + 1', () => {
      const xs = [1, 2, 3, 4, 5];
      const ys = [3, 5, 7, 9, 11];
      const res = linearRegression(xs, ys);

      expect(res.slope).toBeCloseTo(2, 6);
      expect(res.intercept).toBeCloseTo(1, 6);
      expect(res.r2).toBeCloseTo(1, 6);
      expect(res.slopeStdErr).toBeCloseTo(0, 6);
    });

    it('handles known noisy linear dataset', () => {
      // xs = [1, 2, 3, 4, 5]
      // ys = [2.1, 3.9, 6.2, 8.0, 10.1]
      const xs = [1, 2, 3, 4, 5];
      const ys = [2.1, 3.9, 6.2, 8.0, 10.1];
      const res = linearRegression(xs, ys);

      expect(res.slope).toBeCloseTo(2.0, 1);
      expect(res.intercept).toBeCloseTo(0.06, 1);
      expect(res.r2).toBeGreaterThan(0.99);
      expect(res.slopeStdErr).toBeGreaterThan(0);
    });

    it('returns safe zeros for empty or single-point input', () => {
      expect(linearRegression([], [])).toEqual({
        slope: 0,
        intercept: 0,
        r2: 0,
        slopeStdErr: 0,
      });
      expect(linearRegression([1], [2])).toEqual({
        slope: 0,
        intercept: 0,
        r2: 0,
        slopeStdErr: 0,
      });
    });

    it('handles identical x coordinates without dividing by zero', () => {
      const res = linearRegression([2, 2, 2], [1, 2, 3]);
      expect(res.slope).toBe(0);
      expect(res.intercept).toBe(2);
      expect(res.r2).toBe(0);
      expect(res.slopeStdErr).toBe(0);
    });
  });

  describe('percentError', () => {
    it('computes absolute percentage error accurately', () => {
      expect(percentError(98, 100)).toBeCloseTo(2.0, 4);
      expect(percentError(105, 100)).toBeCloseTo(5.0, 4);
      expect(percentError(100, 100)).toBe(0);
    });

    it('handles true value of zero safely', () => {
      expect(percentError(0, 0)).toBe(0);
      expect(percentError(5, 0)).toBe(500);
    });
  });

  describe('mulberry32', () => {
    it('produces deterministic and repeatable random sequences for the same seed', () => {
      const rng1 = mulberry32(123456);
      const seq1 = [rng1(), rng1(), rng1(), rng1()];

      const rng2 = mulberry32(123456);
      const seq2 = [rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
      expect(seq1.every((v) => v >= 0 && v < 1)).toBe(true);
    });

    it('produces different sequences for different seeds', () => {
      const rng1 = mulberry32(42);
      const rng2 = mulberry32(43);

      expect(rng1()).not.toBe(rng2());
    });
  });

  describe('gaussianNoise', () => {
    it('returns 0 when sigma is 0', () => {
      const rng = mulberry32(1);
      expect(gaussianNoise(rng, 0)).toBe(0);
    });

    it('generates zero-mean Gaussian distribution with expected sigma', () => {
      const rng = mulberry32(999);
      const sigma = 2.5;
      const samples: number[] = [];
      const N = 5000;

      for (let i = 0; i < N; i++) {
        samples.push(gaussianNoise(rng, sigma));
      }

      const sampleMean = mean(samples);
      const sampleDev = sampleStdDev(samples);

      // Mean should be near 0 (within 3 standard errors of the mean: 2.5 / sqrt(5000) ≈ 0.035)
      expect(Math.abs(sampleMean)).toBeLessThan(0.15);
      // Sample standard deviation should be close to sigma (2.5)
      expect(sampleDev).toBeCloseTo(sigma, 0);
    });
  });
});
