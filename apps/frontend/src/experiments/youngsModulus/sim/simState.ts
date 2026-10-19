import {
  MATERIALS,
  BEAM_GEOMETRY_DEFAULTS,
  centerElevation,
  maxBendingStress,
  type MaterialKey,
} from '../physics/bending';
import { mulberry32, gaussianNoise, mean } from '../../../lib/stats';
import type {
  YoungsModulusSavedState,
  BendingReading,
  TravellingMicroscopeReading,
} from './types';

/**
 * Creates initial simulation state for Young's Modulus experiment.
 */
export function createInitialSimState(
  initialState?: unknown
): YoungsModulusSavedState {
  if (initialState && typeof initialState === 'object') {
    const s = initialState as Partial<YoungsModulusSavedState>;
    if (
      (s.materialKey === 'steel' ||
        s.materialKey === 'brass' ||
        s.materialKey === 'aluminium' ||
        s.materialKey === 'wood') &&
      typeof s.supportDistanceM === 'number' &&
      typeof s.overhangM === 'number' &&
      typeof s.breadthM === 'number' &&
      typeof s.thicknessM === 'number' &&
      Array.isArray(s.readings) &&
      typeof s.seed === 'number'
    ) {
      return {
        version: 1,
        materialKey: s.materialKey,
        lengthM: s.lengthM ?? BEAM_GEOMETRY_DEFAULTS.TOTAL_LENGTH_M,
        supportDistanceM: s.supportDistanceM,
        overhangM: s.overhangM,
        breadthM: s.breadthM,
        thicknessM: s.thicknessM,
        breadthTrials: s.breadthTrials ?? [25.02, 24.98, 25.0],
        thicknessTrials: s.thicknessTrials ?? [3.01, 2.99, 3.0],
        readings: s.readings,
        currentMassKg: s.currentMassKg ?? 0.1,
        exaggerationFactor: s.exaggerationFactor ?? 20,
        revealedTrueValue: Boolean(s.revealedTrueValue),
        seed: s.seed,
      };
    }
  }

  const seed = Math.floor(Math.random() * 1000000) + 1;
  const initialMaterial: MaterialKey = 'steel';
  const defaultThickness = MATERIALS[initialMaterial].defaultThicknessM;

  // Generate initial dimension trials with seeded noise
  const rng = mulberry32(seed);
  const breadthTrials = [
    Number((25.0 + gaussianNoise(rng, 0.02)).toFixed(2)),
    Number((25.0 + gaussianNoise(rng, 0.02)).toFixed(2)),
    Number((25.0 + gaussianNoise(rng, 0.02)).toFixed(2)),
  ];

  const nominalD = defaultThickness * 1000;
  const thicknessTrials = [
    Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
    Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
    Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
  ];

  return {
    version: 1,
    materialKey: initialMaterial,
    lengthM: BEAM_GEOMETRY_DEFAULTS.TOTAL_LENGTH_M,
    supportDistanceM: BEAM_GEOMETRY_DEFAULTS.SUPPORT_DISTANCE_L_M,
    overhangM: BEAM_GEOMETRY_DEFAULTS.OVERHANG_A_M,
    breadthM: Number((mean(breadthTrials) * 1e-3).toFixed(5)),
    thicknessM: Number((mean(thicknessTrials) * 1e-3).toFixed(5)),
    breadthTrials,
    thicknessTrials,
    readings: [],
    currentMassKg: 0.1,
    exaggerationFactor: 20, // default 20x exaggeration
    revealedTrueValue: false,
    seed,
  };
}

/**
 * Generates an observation for mass M with seeded noise at the travelling microscope least count (0.01 mm).
 */
export function generateBendingReading(
  massKg: number,
  materialKey: MaterialKey,
  supportDistanceM: number,
  overhangM: number,
  breadthM: number,
  thicknessM: number,
  seed: number
): BendingReading {
  const trueY = MATERIALS[materialKey].youngsModulusPa;
  const theoreticalElevationM = centerElevation(
    massKg,
    overhangM,
    supportDistanceM,
    breadthM,
    thicknessM,
    trueY
  );
  const theoreticalElevationMm = theoreticalElevationM * 1000;

  // Seeded noise for loading and unloading readings (Least count = 0.01 mm)
  const rngLoad = mulberry32((seed + Math.round(massKg * 1000) * 41 + 17) >>> 0);
  const rngUnload = mulberry32((seed + Math.round(massKg * 1000) * 83 + 97) >>> 0);

  const noiseLoadMm = gaussianNoise(rngLoad, 0.01);
  const noiseUnloadMm = gaussianNoise(rngUnload, 0.01);

  const loadingReadingMm = Number(
    Math.max(0, theoreticalElevationMm + noiseLoadMm).toFixed(2)
  );
  const unloadingReadingMm = Number(
    Math.max(0, theoreticalElevationMm + noiseUnloadMm).toFixed(2)
  );
  const meanElevationMm = Number(
    ((loadingReadingMm + unloadingReadingMm) / 2.0).toFixed(2)
  );
  const eOverMMmPerKg = Number((meanElevationMm / massKg).toFixed(2));

  const stressPa = maxBendingStress(massKg, overhangM, breadthM, thicknessM);
  const stressMpa = Number((stressPa / 1e6).toFixed(1));

  return {
    massKg,
    loadingReadingMm,
    unloadingReadingMm,
    meanElevationMm,
    eOverMMmPerKg,
    stressMpa,
  };
}

/**
 * Decomposes travelling microscope total elevation into main scale (mm) and vernier divisions.
 * Least count LC = 0.01 mm (100 divisions = 1 mm).
 */
export function splitMicroscopeReading(
  totalMm: number
): TravellingMicroscopeReading {
  const clampedTotal = Math.max(0, totalMm);
  const mainScaleMm = Math.floor(clampedTotal);
  const frac = clampedTotal - mainScaleMm;
  const vernierDiv = Math.min(99, Math.max(0, Math.round(frac / 0.01)));
  return {
    mainScaleMm,
    vernierDiv,
    totalMm: Number((mainScaleMm + vernierDiv * 0.01).toFixed(2)),
  };
}
