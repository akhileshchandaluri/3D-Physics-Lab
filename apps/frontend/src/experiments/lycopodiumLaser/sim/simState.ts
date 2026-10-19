import {
  DARK_RING_K,
  darkRingRadius,
  particleDiameterFromRadius,
  SAMPLE_DIAMETERS,
  WAVELENGTH_PRESETS,
  DISTANCE_BOUNDS_M,
} from '../physics/lycopodium';
import { mulberry32, gaussianNoise } from '../../../lib/stats';
import type { LycopodiumSavedState, RingReading, SampleKey } from './types';

/**
 * Creates initial state for the Lycopodium Laser experiment.
 */
export function createInitialSimState(
  initialState?: unknown
): LycopodiumSavedState {
  if (initialState && typeof initialState === 'object') {
    const s = initialState as Partial<LycopodiumSavedState>;
    if (
      typeof s.wavelengthM === 'number' &&
      typeof s.distanceM === 'number' &&
      (s.sampleKey === 'A' || s.sampleKey === 'B' || s.sampleKey === 'C') &&
      typeof s.seed === 'number' &&
      Array.isArray(s.readings)
    ) {
      return {
        version: 1,
        wavelengthM: s.wavelengthM,
        distanceM: s.distanceM,
        sampleKey: s.sampleKey,
        seed: s.seed,
        readings: s.readings,
        revealedTrueValue: Boolean(s.revealedTrueValue),
        rulerPositionMm: s.rulerPositionMm ?? 0,
      };
    }
  }

  return {
    version: 1,
    wavelengthM: WAVELENGTH_PRESETS.RED, // 650 nm default
    distanceM: DISTANCE_BOUNDS_M.DEFAULT, // 1.0 m default
    sampleKey: 'B', // Powder B default (32 um)
    seed: Math.floor(Math.random() * 1000000) + 1,
    readings: [],
    revealedTrueValue: false,
    rulerPositionMm: 0,
  };
}

/**
 * Generates an observation for dark ring n with seeded Gaussian measurement noise (sigma = 0.3 mm).
 *
 * @param orderN Ring order (1-indexed: 1..5)
 * @param wavelengthM Laser wavelength in meters
 * @param distanceM Screen distance in meters
 * @param sampleKey Sample identifier ('A', 'B', or 'C')
 * @param seed Pseudo-random generator seed
 * @returns Complete observation reading
 */
export function generateRingReading(
  orderN: number,
  wavelengthM: number,
  distanceM: number,
  sampleKey: SampleKey,
  seed: number
): RingReading {
  const trueDiameterM = SAMPLE_DIAMETERS[sampleKey];
  const trueRadiusM = darkRingRadius(orderN, wavelengthM, distanceM, trueDiameterM);
  const trueDiameterMm = trueRadiusM * 2000;

  // Deterministic noise for this specific order and seed
  const ringRng = mulberry32((seed + orderN * 7919) >>> 0);
  const noiseMm = gaussianNoise(ringRng, 0.3); // sigma = 0.3 mm

  const diameterMm = Math.max(0.2, Number((trueDiameterMm + noiseMm).toFixed(2)));
  const radiusMm = Number((diameterMm / 2).toFixed(2));
  const radiusM = radiusMm * 1e-3;

  const kn = DARK_RING_K[orderN - 1];
  const sinTheta = Number((radiusM / Math.hypot(radiusM, distanceM)).toFixed(5));

  const estimatedDiameterM = particleDiameterFromRadius(
    orderN,
    radiusM,
    distanceM,
    wavelengthM
  );
  const dUm = Number((estimatedDiameterM * 1e6).toFixed(2));

  return {
    n: orderN,
    kn,
    diameterMm,
    radiusMm,
    sinTheta,
    dUm,
  };
}
