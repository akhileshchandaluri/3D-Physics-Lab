import { describe, it, expect } from 'vitest';
import {
  isAllowedFCC,
  calculateBraggPeaks,
  latticeConstantFromPeak,
  structureFactor,
  CRYSTALS,
  XRAY_SOURCES,
} from './bragg';

describe('Bragg Diffraction Physics Engine', () => {
  it('enforces FCC selection rules: all odd or all even allowed, mixed forbidden', () => {
    // Forbidden
    expect(isAllowedFCC(1, 0, 0)).toBe(false);
    expect(isAllowedFCC(1, 1, 0)).toBe(false);
    expect(isAllowedFCC(2, 1, 0)).toBe(false);

    // Allowed
    expect(isAllowedFCC(1, 1, 1)).toBe(true);
    expect(isAllowedFCC(2, 0, 0)).toBe(true);
    expect(isAllowedFCC(2, 2, 0)).toBe(true);
    expect(isAllowedFCC(3, 1, 1)).toBe(true);
    expect(isAllowedFCC(2, 2, 2)).toBe(true);
  });

  it('matches NaCl Cu K-alpha test values: (200) at 31.70 deg, (220) at 45.45 deg, (111) at 27.40 deg', () => {
    const peaks = calculateBraggPeaks('nacl', 'cu-ka');

    const p111 = peaks.find((p) => p.h === 1 && p.k === 1 && p.l === 1);
    const p200 = peaks.find((p) => p.h === 2 && p.k === 0 && p.l === 0);
    const p220 = peaks.find((p) => p.h === 2 && p.k === 2 && p.l === 0);

    expect(p111).toBeDefined();
    expect(p200).toBeDefined();
    expect(p220).toBeDefined();

    // Tolerance 0.1% on 2theta angles
    expect(p111!.twoThetaDeg).toBeCloseTo(27.4, 1);
    expect(p200!.twoThetaDeg).toBeCloseTo(31.7, 1);
    expect(p220!.twoThetaDeg).toBeCloseTo(45.45, 1);
  });

  it('performs round trip recovery of lattice constant a = 5.640 A within 0.05%', () => {
    const nacl = CRYSTALS['nacl'];
    const cu = XRAY_SOURCES['cu-ka'];

    // At (200), 2theta = 31.70 deg
    const recoveredA = latticeConstantFromPeak(31.7, 2, 0, 0, cu.wavelengthA);
    const relDiff = Math.abs(recoveredA - nacl.trueLatticeConstantA) / nacl.trueLatticeConstantA;

    expect(relDiff).toBeLessThan(0.0005); // within 0.05%
  });

  it('verifies NaCl (111) is weak vs (200) is strong via rock-salt structure factor', () => {
    const nacl = CRYSTALS['nacl'];
    const cu = XRAY_SOURCES['cu-ka'];

    // (111): sinTheta approx 0.2366
    const f111 = structureFactor(1, 1, 1, 0.2366, cu.wavelengthA, nacl.cationZ, nacl.anionZ);
    // (200): sinTheta approx 0.2732
    const f200 = structureFactor(2, 0, 0, 0.2732, cu.wavelengthA, nacl.cationZ, nacl.anionZ);

    // |F(111)| = 4 * |f_Na - f_Cl| ~ 4 * (18 - 10) = 32
    // |F(200)| = 4 * |f_Na + f_Cl| ~ 4 * (18 + 10) = 112
    expect(f200).toBeGreaterThan(f111 * 2.5);
  });
});
