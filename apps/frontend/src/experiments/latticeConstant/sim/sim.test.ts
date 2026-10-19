import { describe, it, expect } from 'vitest';
import { INITIAL_LATTICE_STATE, isLatticeSavedState } from './simState';

describe('Lattice Constant State Guard', () => {
  it('accepts valid state', () => {
    expect(isLatticeSavedState(INITIAL_LATTICE_STATE)).toBe(true);
  });

  it('rejects invalid state missing fields', () => {
    expect(isLatticeSavedState({ crystalKey: 'nacl' })).toBe(false);
  });

  it('rejects non-object', () => {
    expect(isLatticeSavedState(null)).toBe(false);
    expect(isLatticeSavedState('bad')).toBe(false);
    expect(isLatticeSavedState(123)).toBe(false);
  });

  it('safely sweeps physics across min and max parameters without NaN/Infinity', async () => {
    const {
      CRYSTALS,
      XRAY_SOURCES,
      ALLOWED_REFLECTIONS,
      calculateBraggPeaks,
      generateDiffractionPattern,
      latticeConstantFromPeak,
      structureFactor,
      lorentzPolarizationFactor,
    } = await import('../physics/bragg');

    for (const crystalKey of Object.keys(CRYSTALS)) {
      const crystal = CRYSTALS[crystalKey];
      for (const sourceKey of Object.keys(XRAY_SOURCES)) {
        const source = XRAY_SOURCES[sourceKey];

        const pattern = generateDiffractionPattern(crystalKey, sourceKey, 42);
        expect(pattern.length).toBeGreaterThan(0);
        for (const pt of pattern) {
          expect(Number.isFinite(pt.twoTheta)).toBe(true);
          expect(Number.isFinite(pt.intensity)).toBe(true);
          expect(pt.intensity).toBeGreaterThanOrEqual(0);
        }

        const peaks = calculateBraggPeaks(crystalKey, sourceKey);
        expect(peaks.length).toBeGreaterThan(0);
        for (const peak of peaks) {
          expect(Number.isFinite(peak.twoThetaDeg)).toBe(true);
          expect(Number.isFinite(peak.relativeIntensity)).toBe(true);
          expect(peak.relativeIntensity).toBeGreaterThanOrEqual(0);

          const recoveredA = latticeConstantFromPeak(
            peak.twoThetaDeg,
            peak.h,
            peak.k,
            peak.l,
            source.wavelengthA
          );
          expect(Number.isFinite(recoveredA)).toBe(true);
          expect(recoveredA).toBeCloseTo(crystal.trueLatticeConstantA, 2);
        }

        for (const refl of ALLOWED_REFLECTIONS) {
          const sinTheta = (source.wavelengthA * Math.sqrt(refl.h2k2l2)) / (2.0 * crystal.trueLatticeConstantA);
          if (sinTheta < 1.0) {
            const thetaRad = Math.asin(sinTheta);
            const F = structureFactor(
              refl.h,
              refl.k,
              refl.l,
              sinTheta,
              source.wavelengthA,
              crystal.cationZ,
              crystal.anionZ
            );
            expect(Number.isFinite(F)).toBe(true);

            const lp = lorentzPolarizationFactor(thetaRad);
            expect(Number.isFinite(lp)).toBe(true);
            expect(lp).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
