import { describe, it, expect } from 'vitest';
import {
  besselJ1,
  airyIntensity,
  darkRingRadius,
  particleDiameterFromRadius,
  particleDiameterFromRegression,
  clampDistanceM,
  DARK_RING_K,
  DISTANCE_BOUNDS_M,
} from './lycopodium';

describe('lycopodium.ts physics engine', () => {
  describe('besselJ1 numerical approximation', () => {
    it('evaluates J_1(0) to 0', () => {
      expect(besselJ1(0)).toBe(0);
    });

    it('approximates the first zero J_1(3.8317) ~ 0 accurately', () => {
      // First zero of J_1 is approximately 3.831706
      const val = besselJ1(3.831706);
      expect(Math.abs(val)).toBeLessThan(1e-4);
    });

    it('approximates the second zero J_1(7.0156) ~ 0 accurately', () => {
      // Second zero of J_1 is approximately 7.015587
      const val = besselJ1(7.015587);
      expect(Math.abs(val)).toBeLessThan(1e-4);
    });

    it('matches known maximum near x = 1.84118 (peak ~ 0.581865)', () => {
      const peakVal = besselJ1(1.84118);
      expect(peakVal).toBeCloseTo(0.581865, 3);
    });

    it('satisfies odd symmetry J_1(-x) = -J_1(x)', () => {
      const valPositive = besselJ1(2.5);
      const valNegative = besselJ1(-2.5);
      expect(valNegative).toBeCloseTo(-valPositive, 8);
    });
  });

  describe('airyIntensity', () => {
    it('returns normalized maximum intensity 1.0 at theta = 0', () => {
      const i0 = airyIntensity(0, 32e-6, 650e-9);
      expect(i0).toBeCloseTo(1.0, 5);
    });

    it('drops to approximately 0 at the first dark ring angle', () => {
      const sinTheta1 = (DARK_RING_K[0] * 650e-9) / 32e-6;
      const theta1 = Math.asin(sinTheta1);
      const intensity = airyIntensity(theta1, 32e-6, 650e-9);
      expect(intensity).toBeLessThan(0.0001);
    });
  });

  describe('test benchmark values from project rules', () => {
    it('computes r_1 ~ 24.78 mm for lambda=650nm, d=32um, D=1m (tolerance 0.5%)', () => {
      const lambda = 650e-9;
      const d = 32e-6;
      const D = 1.0;
      const k1 = DARK_RING_K[0]; // 1.2197

      const sinTheta1 = (k1 * lambda) / d;
      expect(sinTheta1).toBeCloseTo(0.024776, 5);

      const r1 = darkRingRadius(1, lambda, D, d); // in meters
      const r1Mm = r1 * 1000;

      // Rule tolerance 0.5%: 24.78 mm +/- 0.12 mm
      expect(r1Mm).toBeCloseTo(24.78, 1);
      const percentDiff = (Math.abs(r1Mm - 24.78) / 24.78) * 100;
      expect(percentDiff).toBeLessThan(0.5);
    });

    it('inverts radius back to particle diameter accurately', () => {
      const lambda = 650e-9;
      const dTrue = 32e-6;
      const D = 1.0;

      const r1 = darkRingRadius(1, lambda, D, dTrue);
      const dEst = particleDiameterFromRadius(1, r1, D, lambda);

      expect(dEst).toBeCloseTo(dTrue, 8);
    });

    it('estimates particle diameter from regression slope accurately', () => {
      const lambda = 650e-9;
      const dTrue = 32e-6;
      const D = 1.0;

      // slope = D * lambda / d
      const theoreticalSlope = (D * lambda) / dTrue;
      const dEst = particleDiameterFromRegression(theoreticalSlope, D, lambda);

      expect(dEst).toBeCloseTo(dTrue, 8);
    });
  });

  describe('validation.csv benchmark test cases (inline verification)', () => {
    // Columns: lambda_nm, D_m, d_um, n, expected_r_mm
    const validationCases = [
      { lambda_nm: 650, D_m: 1.0, d_um: 32, n: 1, expected_r_mm: 24.78 },
      { lambda_nm: 650, D_m: 1.0, d_um: 32, n: 2, expected_r_mm: 45.41 },
      { lambda_nm: 650, D_m: 1.0, d_um: 32, n: 3, expected_r_mm: 65.92 },
      { lambda_nm: 532, D_m: 1.0, d_um: 32, n: 1, expected_r_mm: 20.28 },
      { lambda_nm: 650, D_m: 2.0, d_um: 22, n: 1, expected_r_mm: 72.12 },
      { lambda_nm: 532, D_m: 1.5, d_um: 45, n: 2, expected_r_mm: 39.61 },
    ];

    it.each(validationCases)(
      'validates row with lambda=$lambda_nm nm, D=$D_m m, d=$d_um um, n=$n -> expected r=$expected_r_mm mm',
      ({ lambda_nm, D_m, d_um, n, expected_r_mm }) => {
        const lambdaM = lambda_nm * 1e-9;
        const dM = d_um * 1e-6;
        const rM = darkRingRadius(n, lambdaM, D_m, dM);
        const rMm = rM * 1000;

        expect(rMm).toBeCloseTo(expected_r_mm, 1);
      }
    );
  });

  describe('clampDistanceM', () => {
    it('clamps below minimum 0.5m', () => {
      const res = clampDistanceM(0.2);
      expect(res.clamped).toBe(DISTANCE_BOUNDS_M.MIN);
      expect(res.wasClamped).toBe(true);
    });

    it('clamps above maximum 3.0m', () => {
      const res = clampDistanceM(4.5);
      expect(res.clamped).toBe(DISTANCE_BOUNDS_M.MAX);
      expect(res.wasClamped).toBe(true);
    });

    it('preserves valid distance within bounds', () => {
      const res = clampDistanceM(1.8);
      expect(res.clamped).toBe(1.8);
      expect(res.wasClamped).toBe(false);
    });

    it('handles NaN gracefully', () => {
      const res = clampDistanceM(NaN);
      expect(res.clamped).toBe(DISTANCE_BOUNDS_M.DEFAULT);
      expect(res.wasClamped).toBe(true);
    });
  });
});
