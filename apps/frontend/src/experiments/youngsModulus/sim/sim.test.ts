import { describe, it, expect } from 'vitest';
import {
  createInitialSimState,
  generateBendingReading,
  splitMicroscopeReading,
} from './simState';
import { isYoungsModulusSavedState } from './types';

describe("Young's Modulus Simulation and State Tests", () => {
  it('creates a valid default initial simulation state', () => {
    const state = createInitialSimState();
    expect(state.version).toBe(1);
    expect(state.materialKey).toBe('steel');
    expect(state.supportDistanceM).toBe(0.7);
    expect(state.overhangM).toBe(0.15);
    expect(state.breadthTrials.length).toBeGreaterThanOrEqual(3);
    expect(state.thicknessTrials.length).toBeGreaterThanOrEqual(3);
    expect(state.exaggerationFactor).toBe(20);
    expect(isYoungsModulusSavedState(state)).toBe(true);
  });

  it('preserves existing saved state on reload', () => {
    const sampleState = {
      version: 1 as const,
      materialKey: 'brass' as const,
      lengthM: 1.0,
      supportDistanceM: 0.68,
      overhangM: 0.16,
      breadthM: 0.0249,
      thicknessM: 0.00301,
      breadthTrials: [24.9, 24.9, 24.9],
      thicknessTrials: [3.01, 3.01, 3.01],
      readings: [],
      currentMassKg: 0.3,
      exaggerationFactor: 25,
      revealedTrueValue: true,
      seed: 98765,
    };
    const loaded = createInitialSimState(sampleState);
    expect(loaded.materialKey).toBe('brass');
    expect(loaded.supportDistanceM).toBe(0.68);
    expect(loaded.revealedTrueValue).toBe(true);
    expect(isYoungsModulusSavedState(loaded)).toBe(true);
  });

  it('guarantees state JSON size is well under 20 KB limit', () => {
    const state = createInitialSimState();
    // Simulate 10 readings
    for (let m = 0.1; m <= 0.5; m += 0.05) {
      state.readings.push(
        generateBendingReading(
          m,
          state.materialKey,
          state.supportDistanceM,
          state.overhangM,
          state.breadthM,
          state.thicknessM,
          state.seed
        )
      );
    }
    const jsonString = JSON.stringify(state);
    const byteSize = new TextEncoder().encode(jsonString).length;
    expect(byteSize).toBeLessThan(20480); // < 20 KB
    expect(byteSize).toBeLessThan(2500); // typically < 2.5 KB
  });

  it('generates reproducible observations for the same seed', () => {
    const reading1 = generateBendingReading(0.5, 'steel', 0.7, 0.15, 0.025, 0.003, 12345);
    const reading2 = generateBendingReading(0.5, 'steel', 0.7, 0.15, 0.025, 0.003, 12345);

    expect(reading1.loadingReadingMm).toBe(reading2.loadingReadingMm);
    expect(reading1.unloadingReadingMm).toBe(reading2.unloadingReadingMm);
    expect(reading1.meanElevationMm).toBe(reading2.meanElevationMm);
    expect(reading1.meanElevationMm).toBeCloseTo(4.01, 1);
  });

  it('correctly splits travelling microscope reading into main scale and vernier divisions', () => {
    // 4.35 mm -> 4 mm main scale, 35 vernier divisions (LC = 0.01 mm)
    const split = splitMicroscopeReading(4.35);
    expect(split.mainScaleMm).toBe(4);
    expect(split.vernierDiv).toBe(35);
    expect(split.totalMm).toBe(4.35);

    // 0.08 mm -> 0 mm main scale, 8 vernier divisions
    const splitSmall = splitMicroscopeReading(0.08);
    expect(splitSmall.mainScaleMm).toBe(0);
    expect(splitSmall.vernierDiv).toBe(8);
    expect(splitSmall.totalMm).toBe(0.08);
  });

  it('validates state type guard with isYoungsModulusSavedState', () => {
    expect(isYoungsModulusSavedState(null)).toBe(false);
    expect(isYoungsModulusSavedState({})).toBe(false);
    expect(isYoungsModulusSavedState({ materialKey: 'invalid' })).toBe(false);

    const validState = createInitialSimState();
    expect(isYoungsModulusSavedState(validState)).toBe(true);
  });

  it('safely sweeps physics across min and max slider parameters without NaN/Infinity', () => {
    const materials = ['steel', 'brass', 'aluminium', 'wood'] as const;
    const masses = [0.05, 0.1, 0.3, 0.5, 1.0];
    const lengths = [0.5, 0.7, 0.8];
    const overhangs = [0.1, 0.15, 0.2];
    const breadths = [0.02, 0.025, 0.03];
    const thicknesses = [0.002, 0.003, 0.005];

    for (const mat of materials) {
      for (const m of masses) {
        for (const l of lengths) {
          for (const a of overhangs) {
            for (const b of breadths) {
              for (const d of thicknesses) {
                const reading = generateBendingReading(m, mat, l, a, b, d, 42);
                expect(Number.isFinite(reading.loadingReadingMm)).toBe(true);
                expect(Number.isFinite(reading.unloadingReadingMm)).toBe(true);
                expect(Number.isFinite(reading.meanElevationMm)).toBe(true);
                expect(Number.isFinite(reading.eOverMMmPerKg)).toBe(true);
                expect(Number.isFinite(reading.stressMpa)).toBe(true);
                expect(reading.meanElevationMm).toBeGreaterThan(0);
              }
            }
          }
        }
      }
    }
  });
});
