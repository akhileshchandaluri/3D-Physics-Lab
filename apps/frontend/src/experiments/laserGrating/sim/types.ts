/**
 * Persistence contracts and data models for Diffraction Grating Laser experiment.
 */

export type GratingMode = 'unknown' | 'known';

/**
 * An individual measured diffraction order reading.
 */
export interface OrderReading {
  n: number;
  xMm: number;
  thetaDeg: number;
  sinTheta: number;
  lambdaNm: number;
}

/**
 * Averaged reading combining positive and negative orders (+/- n).
 */
export interface AveragedOrderReading {
  orderAbs: number;
  xAvgMm: number;
  sinThetaAvg: number;
  lambdaNm: number;
}

/**
 * Persisted state structure adhering to < 20 KB limit.
 */
export interface LaserGratingSavedState {
  version: 1;
  linesPerMm: number;
  distanceM: number;
  mode: GratingMode;
  trueWavelengthM: number;
  selectedWavelengthM: number;
  seed: number;
  readings: OrderReading[];
  revealedTrueValue: boolean;
  rulerPositionMm?: number;
}

/**
 * Type guard for validating restored state.
 */
export function isLaserGratingSavedState(
  val: unknown
): val is LaserGratingSavedState {
  if (!val || typeof val !== 'object') return false;
  const s = val as Partial<LaserGratingSavedState>;
  return (
    typeof s.linesPerMm === 'number' &&
    Number.isFinite(s.linesPerMm) &&
    typeof s.distanceM === 'number' &&
    Number.isFinite(s.distanceM) &&
    (s.mode === 'unknown' || s.mode === 'known') &&
    typeof s.trueWavelengthM === 'number' &&
    Number.isFinite(s.trueWavelengthM) &&
    typeof s.selectedWavelengthM === 'number' &&
    Number.isFinite(s.selectedWavelengthM) &&
    typeof s.seed === 'number' &&
    Number.isFinite(s.seed) &&
    Array.isArray(s.readings) &&
    typeof s.revealedTrueValue === 'boolean'
  );
}
