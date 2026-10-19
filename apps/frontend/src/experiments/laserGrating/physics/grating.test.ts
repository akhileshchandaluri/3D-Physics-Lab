import { describe, it, expect } from 'vitest';
import {
  gratingElementD,
  diffractionSinTheta,
  diffractionAngleRad,
  spotPositionM,
  wavelengthFromSpot,
  wavelengthFromRegression,
  singleSlitIntensity,
  clampDistanceM,
  DISTANCE_BOUNDS_M,
} from './grating';

describe('grating.ts physics engine', () => {
  describe('gratingElementD', () => {
    it('calculates grating spacing d in meters correctly', () => {
      // 300 lines/mm => d = 1e-3 / 300 = 3.333333e-6 m
      expect(gratingElementD(300)).toBeCloseTo(3.333333e-6, 9);
      // 600 lines/mm => d = 1.666667e-6 m
      expect(gratingElementD(600)).toBeCloseTo(1.666667e-6, 9);
      // 100 lines/mm => d = 1e-5 m
      expect(gratingElementD(100)).toBeCloseTo(1e-5, 9);
    });
  });

  describe('test benchmark values from project rules (tolerance 0.5%)', () => {
    it('validates N=300 lines/mm, lambda=650 nm values: sin=0.195, theta=11.245 deg, x1=99.4 mm for D=0.5m', () => {
      const N = 300;
      const lambda = 650e-9;
      const D = 0.5;

      // Order 1
      const res1 = diffractionSinTheta(1, lambda, N);
      expect(res1.exists).toBe(true);
      expect(res1.sinTheta).toBeCloseTo(0.195, 4);

      const angleRes1 = diffractionAngleRad(1, lambda, N);
      const thetaDeg = (angleRes1.thetaRad * 180) / Math.PI;
      expect(thetaDeg).toBeCloseTo(11.245, 2);

      const spotRes1 = spotPositionM(1, lambda, N, D);
      const x1Mm = spotRes1.xM * 1000;
      // D * 0.19885 = 0.5 * 0.19885 = 0.099425 m = 99.4 mm
      expect(x1Mm).toBeCloseTo(99.4, 1);
      const pctErr = (Math.abs(x1Mm - 99.4) / 99.4) * 100;
      expect(pctErr).toBeLessThan(0.5);

      // Order 2
      const res2 = diffractionSinTheta(2, lambda, N);
      expect(res2.exists).toBe(true);
      expect(res2.sinTheta).toBeCloseTo(0.39, 3);

      // Order 3
      const res3 = diffractionSinTheta(3, lambda, N);
      expect(res3.exists).toBe(true);
      expect(res3.sinTheta).toBeCloseTo(0.585, 3);
    });

    it('validates N=600 lines/mm, lambda=650 nm: sin1=0.39, and order 3 does not exist', () => {
      const N = 600;
      const lambda = 650e-9;

      // Order 1
      const res1 = diffractionSinTheta(1, lambda, N);
      expect(res1.exists).toBe(true);
      expect(res1.sinTheta).toBeCloseTo(0.39, 3);

      // Order 2
      const res2 = diffractionSinTheta(2, lambda, N);
      expect(res2.exists).toBe(true);
      expect(res2.sinTheta).toBeCloseTo(0.78, 3);

      // Order 3: 3 * 0.39 = 1.17 > 1
      const res3 = diffractionSinTheta(3, lambda, N);
      expect(res3.exists).toBe(false);

      const spotRes3 = spotPositionM(3, lambda, N, 0.5);
      expect(spotRes3.exists).toBe(false);
    });
  });

  describe('round-trip precision test (within 0.1%)', () => {
    it('generates spot positions from known lambda and recovers lambda within 0.1%', () => {
      const knownLambda = 532e-9; // 532 nm Green
      const N = 300;
      const D = 0.8;

      // Check orders 1, 2, 3
      for (const n of [1, 2, 3]) {
        const spot = spotPositionM(n, knownLambda, N, D);
        expect(spot.exists).toBe(true);

        const recoveredLambda = wavelengthFromSpot(n, spot.xM, N, D);
        const errorPercent = (Math.abs(recoveredLambda - knownLambda) / knownLambda) * 100;

        expect(errorPercent).toBeLessThan(0.1);
      }
    });

    it('recovers wavelength from linear regression slope within 0.1%', () => {
      const knownLambda = 633e-9; // 633 nm He-Ne
      const N = 300;
      const d = gratingElementD(N);

      // Theoretical slope of sin(theta_n) vs n is lambda / d
      const theoreticalSlope = knownLambda / d;
      const recoveredLambda = wavelengthFromRegression(theoreticalSlope, N);

      const errorPercent = (Math.abs(recoveredLambda - knownLambda) / knownLambda) * 100;
      expect(errorPercent).toBeLessThan(0.01);
    });
  });

  describe('singleSlitIntensity envelope', () => {
    it('yields central intensity 1.0 at theta = 0', () => {
      const i0 = singleSlitIntensity(0, 300, 650e-9);
      expect(i0).toBeCloseTo(1.0, 5);
    });

    it('decreases symmetrically for higher diffraction angles', () => {
      const i1 = singleSlitIntensity(0.1, 300, 650e-9);
      const iNeg1 = singleSlitIntensity(-0.1, 300, 650e-9);
      expect(i1).toBeLessThan(1.0);
      expect(i1).toBeCloseTo(iNeg1, 6);
    });
  });

  describe('clampDistanceM', () => {
    it('clamps below minimum 0.3 m', () => {
      const res = clampDistanceM(0.1);
      expect(res.clamped).toBe(DISTANCE_BOUNDS_M.MIN);
      expect(res.wasClamped).toBe(true);
    });

    it('clamps above maximum 2.0 m', () => {
      const res = clampDistanceM(3.5);
      expect(res.clamped).toBe(DISTANCE_BOUNDS_M.MAX);
      expect(res.wasClamped).toBe(true);
    });

    it('preserves valid distance in range', () => {
      const res = clampDistanceM(1.2);
      expect(res.clamped).toBe(1.2);
      expect(res.wasClamped).toBe(false);
    });
  });
});
