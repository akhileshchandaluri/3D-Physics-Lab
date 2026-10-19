import { describe, it, expect } from 'vitest';
import {
  radiusOfCurvature,
  centerElevation,
  youngsModulusFromElevation,
  youngsModulusFromSlope,
  maxBendingStress,
  clampMassKg,
  MATERIALS,
  BEAM_GEOMETRY_DEFAULTS,
} from './bending';

describe('bending.ts physics engine', () => {
  describe('theoretical identity check: e = l^2 / (8 * R)', () => {
    it('verifies that centerElevation matches l^2 / (8 * R) identically', () => {
      const M = 0.4;
      const a = 0.15;
      const l = 0.70;
      const b = 0.025;
      const d = 0.003;
      const Y = 200e9; // Steel

      const eDirect = centerElevation(M, a, l, b, d, Y);
      const R = radiusOfCurvature(Y, b, d, M, a);
      const eFromR = (l * l) / (8.0 * R);

      // Must be mathematically identical
      expect(eDirect).toBeCloseTo(eFromR, 9);
    });
  });

  describe('test benchmark values from project rules (tolerance 0.5%)', () => {
    it('computes e ~ 4.0 mm (4.006 mm) for Steel, M=0.5kg, a=0.15m, l=0.70m, b=25mm, d=3mm', () => {
      const M = 0.5;
      const a = 0.15;
      const l = 0.70;
      const b = 0.025;
      const d = 0.003;
      const Y = 200e9; // Steel 200 GPa

      const eM = centerElevation(M, a, l, b, d, Y);
      const eMm = eM * 1000;

      // Rule tolerance 0.5%: 4.006 mm
      expect(eMm).toBeCloseTo(4.006, 2);
      const pctDiff = (Math.abs(eMm - 4.006) / 4.006) * 100;
      expect(pctDiff).toBeLessThan(0.5);
    });

    it('recovers Y = 200 GPa from the benchmark elevation within 0.1% (round-trip test)', () => {
      const M = 0.5;
      const a = 0.15;
      const l = 0.70;
      const b = 0.025;
      const d = 0.003;
      const knownY = 200e9;

      const eM = centerElevation(M, a, l, b, d, knownY);
      const recoveredY = youngsModulusFromElevation(M, a, l, b, d, eM);

      const errorPercent = (Math.abs(recoveredY - knownY) / knownY) * 100;
      expect(errorPercent).toBeLessThan(0.1);
      expect(recoveredY / 1e9).toBeCloseTo(200.0, 3);
    });

    it('recovers Youngs modulus from regression slope within 0.1%', () => {
      const a = 0.15;
      const l = 0.70;
      const b = 0.025;
      const d = 0.003;
      const knownY = 100e9; // Brass 100 GPa

      // Linear slope s = e / M
      const s = centerElevation(1.0, a, l, b, d, knownY);
      const recoveredY = youngsModulusFromSlope(s, a, l, b, d);

      const errorPercent = (Math.abs(recoveredY - knownY) / knownY) * 100;
      expect(errorPercent).toBeLessThan(0.01);
      expect(recoveredY / 1e9).toBeCloseTo(100.0, 3);
    });
  });

  describe('maximum bending stress and yield strength', () => {
    it('evaluates maximum bending stress sigma = 6 M g a / (b d^2)', () => {
      const M = 0.5;
      const a = 0.15;
      const b = 0.025;
      const d = 0.003;
      const g = 9.81;

      // sigma = (6 * 0.5 * 9.81 * 0.15) / (0.025 * 0.003^2)
      // Numerator: 4.4145
      // Denominator: 0.025 * 9e-6 = 2.25e-7
      // sigma = 4.4145 / 2.25e-7 = 19.62 MPa
      const sigma = maxBendingStress(M, a, b, d, g);
      const sigmaMpa = sigma / 1e6;

      expect(sigmaMpa).toBeCloseTo(19.62, 1);
      // Well within steel yield strength (250 MPa)
      expect(sigma).toBeLessThan(MATERIALS.steel.yieldStrengthPa);
    });
  });

  describe('material presets verification', () => {
    it('produces measurable elevations for all standard materials', () => {
      const M = 0.3; // 300 g
      const a = BEAM_GEOMETRY_DEFAULTS.OVERHANG_A_M;
      const l = BEAM_GEOMETRY_DEFAULTS.SUPPORT_DISTANCE_L_M;
      const b = BEAM_GEOMETRY_DEFAULTS.BREADTH_B_M;

      for (const mat of Object.values(MATERIALS)) {
        const d = mat.defaultThicknessM;
        const eM = centerElevation(M, a, l, b, d, mat.youngsModulusPa);
        const eMm = eM * 1000;

        // All materials should have elevation in realistic range 0.5 mm to 10 mm
        expect(eMm).toBeGreaterThan(0.5);
        expect(eMm).toBeLessThan(10.0);
      }
    });
  });

  describe('clampMassKg', () => {
    it('clamps masses below 0.1 kg and above 0.5 kg', () => {
      expect(clampMassKg(0.05).clamped).toBe(0.1);
      expect(clampMassKg(0.05).wasClamped).toBe(true);

      expect(clampMassKg(0.8).clamped).toBe(0.5);
      expect(clampMassKg(0.8).wasClamped).toBe(true);

      expect(clampMassKg(0.3).clamped).toBe(0.3);
      expect(clampMassKg(0.3).wasClamped).toBe(false);

      expect(clampMassKg(NaN).clamped).toBe(0.1);
      expect(clampMassKg(NaN).wasClamped).toBe(true);
    });
  });
});
