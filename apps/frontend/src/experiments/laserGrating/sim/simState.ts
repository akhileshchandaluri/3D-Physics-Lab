import {
  GRATING_LINES_PER_MM_PRESETS,
  WAVELENGTH_PRESETS,
  DISTANCE_BOUNDS_M,
  diffractionSinTheta,
  spotPositionM,
  wavelengthFromSpot,
  gratingElementD,
} from '../physics/grating';
import { mulberry32, gaussianNoise } from '../../../lib/stats';
import type {
  LaserGratingSavedState,
  OrderReading,
  AveragedOrderReading,
} from './types';

/**
 * Creates initial state for the Laser Diffraction Grating experiment.
 */
export function createInitialSimState(
  initialState?: unknown
): LaserGratingSavedState {
  if (initialState && typeof initialState === 'object') {
    const s = initialState as Partial<LaserGratingSavedState>;
    if (
      typeof s.linesPerMm === 'number' &&
      typeof s.distanceM === 'number' &&
      (s.mode === 'unknown' || s.mode === 'known') &&
      typeof s.trueWavelengthM === 'number' &&
      typeof s.seed === 'number' &&
      Array.isArray(s.readings)
    ) {
      return {
        version: 1,
        linesPerMm: s.linesPerMm,
        distanceM: s.distanceM,
        mode: s.mode,
        trueWavelengthM: s.trueWavelengthM,
        selectedWavelengthM: s.selectedWavelengthM ?? s.trueWavelengthM,
        seed: s.seed,
        readings: s.readings,
        revealedTrueValue: Boolean(s.revealedTrueValue),
        rulerPositionMm: s.rulerPositionMm ?? 0,
      };
    }
  }

  return {
    version: 1,
    linesPerMm: GRATING_LINES_PER_MM_PRESETS[1], // 300 lines/mm default
    distanceM: DISTANCE_BOUNDS_M.DEFAULT, // 0.5 m default
    mode: 'unknown',
    trueWavelengthM: WAVELENGTH_PRESETS.RED_DIODE, // 650 nm default
    selectedWavelengthM: WAVELENGTH_PRESETS.RED_DIODE,
    seed: Math.floor(Math.random() * 1000000) + 1,
    readings: [],
    revealedTrueValue: false,
    rulerPositionMm: 0,
  };
}

/**
 * Generates an observation for diffraction order n with seeded Gaussian noise (sigma = 0.5 mm).
 *
 * @param orderN Diffraction order integer (e.g. -3..3)
 * @param wavelengthM Laser wavelength in meters
 * @param linesPerMm Grating line density in lines per mm
 * @param distanceM Screen distance in meters
 * @param seed PRNG seed
 * @returns OrderReading if order exists, or null if evanescent / off-screen
 */
export function generateOrderReading(
  orderN: number,
  wavelengthM: number,
  linesPerMm: number,
  distanceM: number,
  seed: number
): OrderReading | null {
  const sinCheck = diffractionSinTheta(orderN, wavelengthM, linesPerMm);
  if (!sinCheck.exists) {
    return null;
  }

  const spot = spotPositionM(orderN, wavelengthM, linesPerMm, distanceM);
  if (!spot.exists) {
    return null;
  }

  // Central maximum n = 0 has 0 displacement without angle
  if (orderN === 0) {
    return {
      n: 0,
      xMm: 0,
      thetaDeg: 0,
      sinTheta: 0,
      lambdaNm: 0,
    };
  }

  // Deterministic noise for this specific order n and seed
  const ringRng = mulberry32(
    (seed + Math.abs(orderN) * 9887 + (orderN < 0 ? 503 : 0)) >>> 0
  );
  const noiseMm = gaussianNoise(ringRng, 0.5); // sigma = 0.5 mm

  const trueXMm = spot.xM * 1000;
  const xMm = Number((trueXMm + noiseMm).toFixed(1));
  const xM = xMm * 1e-3;

  const thetaRad = Math.atan(xM / distanceM);
  const thetaDeg = Number(((thetaRad * 180) / Math.PI).toFixed(3));
  const sinTheta = Number((xM / Math.hypot(xM, distanceM)).toFixed(5));

  const lambdaM = wavelengthFromSpot(orderN, xM, linesPerMm, distanceM);
  const lambdaNm = Number((lambdaM * 1e9).toFixed(1));

  return {
    n: orderN,
    xMm,
    thetaDeg,
    sinTheta,
    lambdaNm,
  };
}

/**
 * Computes symmetric averages combining +n and -n readings for each order.
 *
 * @param readings Recorded order readings
 * @param linesPerMm Grating line density in lines per mm
 * @returns Array of averaged order readings
 */
export function computeAveragedOrders(
  readings: OrderReading[],
  linesPerMm: number
): AveragedOrderReading[] {
  const d = gratingElementD(linesPerMm);
  const averaged: AveragedOrderReading[] = [];

  for (let n = 1; n <= 3; n++) {
    const pos = readings.find((r) => r.n === n);
    const neg = readings.find((r) => r.n === -n);

    if (pos && neg) {
      const xAvgMm = Number(((Math.abs(pos.xMm) + Math.abs(neg.xMm)) / 2).toFixed(2));
      const sinThetaAvg = Number(
        ((Math.abs(pos.sinTheta) + Math.abs(neg.sinTheta)) / 2).toFixed(5)
      );
      const lambdaM = (d * sinThetaAvg) / n;
      const lambdaNm = Number((lambdaM * 1e9).toFixed(1));

      averaged.push({
        orderAbs: n,
        xAvgMm,
        sinThetaAvg,
        lambdaNm,
      });
    } else if (pos) {
      averaged.push({
        orderAbs: n,
        xAvgMm: Math.abs(pos.xMm),
        sinThetaAvg: Math.abs(pos.sinTheta),
        lambdaNm: pos.lambdaNm,
      });
    } else if (neg) {
      averaged.push({
        orderAbs: n,
        xAvgMm: Math.abs(neg.xMm),
        sinThetaAvg: Math.abs(neg.sinTheta),
        lambdaNm: neg.lambdaNm,
      });
    }
  }

  return averaged;
}
