import { describe, it, expect } from 'vitest';
import { INITIAL_HALL_STATE, isHallSavedState } from './simState';

describe('Hall Effect Sim State & Guard', () => {
  it('accepts valid initial state', () => {
    expect(isHallSavedState(INITIAL_HALL_STATE)).toBe(true);
  });

  it('rejects invalid state missing fields', () => {
    expect(isHallSavedState({ currentA: 0.005 })).toBe(false);
  });

  it('rejects non-object or null state', () => {
    expect(isHallSavedState(null)).toBe(false);
    expect(isHallSavedState('string-state')).toBe(false);
    expect(isHallSavedState(12345)).toBe(false);
  });

  it('safely sweeps physics across min and max slider parameters without NaN/Infinity', async () => {
    const {
      hallVoltage,
      calculateMagneticField,
      hallCoefficient,
      carrierDensityFromRh,
      mobilityFromRhAndSigma,
      SAMPLES,
    } = await import('../physics/hall');

    const currents = [0.001, 0.005, 0.010]; // 1 mA to 10 mA
    const magnetCurrents = [0.0, 0.5, 1.0, 2.0, 2.5]; // 0 to 2.5 A
    const sampleKeys = ['n-germanium', 'p-germanium'];

    for (const key of sampleKeys) {
      const sample = SAMPLES[key];
      const rh = hallCoefficient(sample.carrierDensityM3, sample.type);
      for (const I of currents) {
        for (const Im of magnetCurrents) {
          const B = calculateMagneticField(Im);
          expect(Number.isFinite(B)).toBe(true);
          expect(B).toBeGreaterThanOrEqual(0);

          const Vh = hallVoltage(rh, I, B, 0.0005);
          expect(Number.isFinite(Vh)).toBe(true);

          if (B > 0 && I > 0) {
            const recoveredRh = (Vh * 0.0005) / (I * B);
            expect(Number.isFinite(recoveredRh)).toBe(true);

            const n = carrierDensityFromRh(Math.abs(recoveredRh));
            expect(Number.isFinite(n)).toBe(true);
            expect(n).toBeGreaterThan(0);

            const sigma = sample.carrierDensityM3 * 1.602177e-19 * sample.mobilityM2Vs;
            const mu = mobilityFromRhAndSigma(Math.abs(recoveredRh), sigma);
            expect(Number.isFinite(mu)).toBe(true);
            expect(mu).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
