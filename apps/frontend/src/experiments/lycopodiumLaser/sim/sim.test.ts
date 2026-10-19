import { describe, it, expect } from 'vitest';
import { isLycopodiumSavedState, type LycopodiumSavedState } from './types';
import {
  besselJ1,
  airyIntensity,
  darkRingRadius,
  particleDiameterFromRadius,
  particleDiameterFromRegression,
} from '../physics/lycopodium';

describe('Lycopodium Laser Saved State Guard & Min/Max Sweep', () => {
  const validState: LycopodiumSavedState = {
    version: 1,
    wavelengthM: 650e-9,
    distanceM: 1.0,
    sampleKey: 'A',
    seed: 42,
    readings: [
      {
        n: 1,
        kn: 1.2197,
        diameterMm: 49.56,
        radiusMm: 24.78,
        sinTheta: 0.02477,
        dUm: 32.0,
      },
    ],
    revealedTrueValue: false,
  };

  it('validates state with isLycopodiumSavedState', () => {
    // 1 valid state
    expect(isLycopodiumSavedState(validState)).toBe(true);

    // 2 invalid states
    expect(isLycopodiumSavedState(null)).toBe(false);
    expect(
      isLycopodiumSavedState({
        wavelengthM: -1,
        sampleKey: 'INVALID',
      })
    ).toBe(false);
  });

  it('safely sweeps physics across min and max slider parameters without NaN/Infinity', () => {
    const wavelengths = [532e-9, 632.8e-9, 650e-9];
    const distances = [0.5, 1.0, 2.0, 3.0];
    const diameters = [15e-6, 32e-6, 50e-6];
    const rings = [1, 2, 3, 4];

    for (const lambda of wavelengths) {
      for (const D of distances) {
        for (const d of diameters) {
          for (const n of rings) {
            const r = darkRingRadius(n, lambda, D, d);
            expect(Number.isFinite(r)).toBe(true);
            expect(r).toBeGreaterThan(0);

            const recoveredD = particleDiameterFromRadius(n, r, D, lambda);
            expect(Number.isFinite(recoveredD)).toBe(true);
            expect(recoveredD).toBeGreaterThan(0);

            const slope = (D * lambda) / d;
            const regD = particleDiameterFromRegression(slope, D, lambda);
            expect(Number.isFinite(regD)).toBe(true);
            expect(regD).toBeGreaterThan(0);

            const theta = Math.asin(r / Math.sqrt(r * r + D * D));
            const intensity = airyIntensity(theta, d, lambda);
            expect(Number.isFinite(intensity)).toBe(true);
            expect(intensity).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }

    // Bessel edge values
    expect(Number.isFinite(besselJ1(0))).toBe(true);
    expect(Number.isFinite(besselJ1(100))).toBe(true);
    expect(Number.isFinite(besselJ1(-100))).toBe(true);
  });
});
