import type { MaterialKey } from '../physics/bending';

/**
 * Single load mass measurement in uniform bending experiment.
 */
export interface BendingReading {
  massKg: number;
  loadingReadingMm: number;
  unloadingReadingMm: number;
  meanElevationMm: number;
  eOverMMmPerKg: number;
  stressMpa: number;
}

/**
 * Caliper/Screw gauge trial observation for dimensions b and d.
 */
export interface DimensionReading {
  trial: number;
  breadthMm: number;
  thicknessMm: number;
}

/**
 * Travelling microscope reading with main scale and vernier breakdown.
 */
export interface TravellingMicroscopeReading {
  mainScaleMm: number; // e.g. 14 mm
  vernierDiv: number; // e.g. 52 divisions (LC = 0.01 mm => 0.52 mm)
  totalMm: number; // 14.52 mm
}

/**
 * Persisted state structure adhering to < 20 KB limit.
 */
export interface YoungsModulusSavedState {
  version: 1;
  materialKey: MaterialKey;
  lengthM: number;
  supportDistanceM: number;
  overhangM: number;
  breadthM: number;
  thicknessM: number;
  breadthTrials: number[];
  thicknessTrials: number[];
  readings: BendingReading[];
  currentMassKg: number;
  exaggerationFactor: number;
  revealedTrueValue: boolean;
  seed: number;
}

/**
 * Type guard validating loaded state format.
 */
export function isYoungsModulusSavedState(
  val: unknown
): val is YoungsModulusSavedState {
  if (!val || typeof val !== 'object') return false;
  const s = val as Partial<YoungsModulusSavedState>;
  return (
    (s.materialKey === 'steel' ||
      s.materialKey === 'brass' ||
      s.materialKey === 'aluminium' ||
      s.materialKey === 'wood') &&
    typeof s.supportDistanceM === 'number' &&
    Number.isFinite(s.supportDistanceM) &&
    typeof s.overhangM === 'number' &&
    Number.isFinite(s.overhangM) &&
    typeof s.breadthM === 'number' &&
    Number.isFinite(s.breadthM) &&
    typeof s.thicknessM === 'number' &&
    Number.isFinite(s.thicknessM) &&
    Array.isArray(s.readings) &&
    Array.isArray(s.breadthTrials) &&
    Array.isArray(s.thicknessTrials) &&
    typeof s.seed === 'number' &&
    Number.isFinite(s.seed) &&
    typeof s.revealedTrueValue === 'boolean'
  );
}
