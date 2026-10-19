import { describe, it, expect } from 'vitest';
import { isLaserGratingSavedState, type LaserGratingSavedState } from './types';
import {
  gratingElementD,
  diffractionSinTheta,
  diffractionAngleRad,
  spotPositionM,
  wavelengthFromSpot,
  wavelengthFromRegression,
  singleSlitIntensity,
} from '../physics/grating';

describe('Laser Grating Saved State Guard & Min/Max Sweep', () => {
  const validState: LaserGratingSavedState = {
    version: 1,
    linesPerMm: 300,
    distanceM: 0.5,
    mode: 'unknown',
    trueWavelengthM: 650e-9,
    selectedWavelengthM: 650e-9,
    seed: 42,
    readings: [
      {
        n: 1,
        xMm: 99.4,
        thetaDeg: 11.25,
        sinTheta: 0.195,
        lambdaNm: 650,
      },
    ],
    revealedTrueValue: false,
  };

  it('validates state with isLaserGratingSavedState', () => {
    // 1 valid state
    expect(isLaserGratingSavedState(validState)).toBe(true);

    // 2 invalid states
    expect(isLaserGratingSavedState(null)).toBe(false);
    expect(
      isLaserGratingSavedState({
        linesPerMm: 'invalid',
        mode: 'wrong',
      })
    ).toBe(false);
  });

  it('safely sweeps physics across min and max slider parameters without NaN/Infinity', () => {
    const linesPerMmOptions = [100, 300, 600];
    const wavelengths = [532e-9, 632.8e-9, 650e-9];
    const distances = [0.2, 0.5, 1.0, 1.5, 2.0];
    const orders = [1, 2, 3];

    for (const N of linesPerMmOptions) {
      const d = gratingElementD(N);
      expect(Number.isFinite(d)).toBe(true);
      expect(d).toBeGreaterThan(0);

      for (const lambda of wavelengths) {
        for (const D of distances) {
          for (const n of orders) {
            const sinRes = diffractionSinTheta(n, lambda, N);
            if (sinRes.exists) {
              expect(Number.isFinite(sinRes.sinTheta)).toBe(true);
              expect(sinRes.sinTheta).toBeLessThanOrEqual(1.0);

              const angleRes = diffractionAngleRad(n, lambda, N);
              expect(Number.isFinite(angleRes.thetaRad)).toBe(true);

              const spotRes = spotPositionM(n, lambda, N, D);
              expect(Number.isFinite(spotRes.xM)).toBe(true);

              const recLambda = wavelengthFromSpot(n, spotRes.xM, D, N);
              expect(Number.isFinite(recLambda)).toBe(true);
              expect(recLambda).toBeGreaterThan(0);

              const regLambda = wavelengthFromRegression(sinRes.sinTheta / n, N);
              expect(Number.isFinite(regLambda)).toBe(true);
              expect(regLambda).toBeGreaterThan(0);
            }
          }
        }
      }
    }

    // Slit intensity edge checks
    expect(Number.isFinite(singleSlitIntensity(0, 10e-6, 650e-9))).toBe(true);
    expect(Number.isFinite(singleSlitIntensity(0.5, 10e-6, 650e-9))).toBe(true);
  });
});
