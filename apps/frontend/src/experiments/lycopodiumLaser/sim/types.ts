/**
 * Simulation and persistence types for the Lycopodium Laser experiment.
 */

export type SampleKey = 'A' | 'B' | 'C';

/**
 * A measured dark ring observation recorded into the observation table.
 */
export interface RingReading {
  n: number;
  kn: number;
  diameterMm: number;
  radiusMm: number;
  sinTheta: number;
  dUm: number;
}

/**
 * Persisted experiment state for saving and sharing.
 */
export interface LycopodiumSavedState {
  version: 1;
  wavelengthM: number;
  distanceM: number;
  sampleKey: SampleKey;
  seed: number;
  readings: RingReading[];
  revealedTrueValue: boolean;
  rulerPositionMm?: number;
}

/**
 * Type guard for validating restored state.
 */
export function isLycopodiumSavedState(val: unknown): val is LycopodiumSavedState {
  if (!val || typeof val !== 'object') return false;
  const s = val as Partial<LycopodiumSavedState>;
  return (
    typeof s.wavelengthM === 'number' &&
    Number.isFinite(s.wavelengthM) &&
    s.wavelengthM > 0 &&
    typeof s.distanceM === 'number' &&
    Number.isFinite(s.distanceM) &&
    s.distanceM > 0 &&
    (s.sampleKey === 'A' || s.sampleKey === 'B' || s.sampleKey === 'C') &&
    typeof s.seed === 'number' &&
    Number.isFinite(s.seed) &&
    Array.isArray(s.readings) &&
    typeof s.revealedTrueValue === 'boolean'
  );
}
