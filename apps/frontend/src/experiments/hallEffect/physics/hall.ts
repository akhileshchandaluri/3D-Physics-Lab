/**
 * Hall Effect Physics Engine (SI units throughout).
 *
 * Formulas:
 * 1. Hall Coefficient:
 *    R_H = 1 / (n * q) [m^3 / C]
 *    where q = -1.602177e-19 C for electrons (n-type), +1.602177e-19 C for holes (p-type).
 *
 * 2. Hall Voltage:
 *    V_H = (R_H * I * B) / t [V]
 *    where I is current (A), B is magnetic field (T), t is slab thickness (m).
 *
 * 3. Offset Voltage & Field Reversal:
 *    V(+B) = V_H + V_0
 *    V(-B) = -V_H + V_0
 *    V_H = (V(+B) - V(-B)) / 2
 *    V_0 = (V(+B) + V(-B)) / 2
 *
 * 4. Carrier Density & Mobility:
 *    n = 1 / (|R_H| * e)
 *    mu = |R_H| * sigma
 *    sigma = (I * L) / (V_c * w * t)
 *
 * 5. Electromagnet Field with Soft Saturation:
 *    B = k * I_m (linear k = 0.25 T/A up to 0.45 T, soft hyperbolic tangent saturation above 0.45 T)
 */

import { gaussianNoise, mulberry32 } from '../../../lib/stats';

export const ELEMENTARY_CHARGE = 1.602177e-19; // Coulomb

export interface SemiconductorSample {
  id: string;
  name: string;
  type: 'n-type' | 'p-type';
  material: string;
  carrierDensityM3: number; // m^-3
  mobilityM2Vs: number; // m^2 / (V * s)
  offsetVoltageV: number; // V (misalignment voltage V_0)
  color: string;
}

export const SAMPLES: Record<string, SemiconductorSample> = {
  'n-germanium': {
    id: 'n-germanium',
    name: 'n-type Germanium (Ge:Sb)',
    type: 'n-type',
    material: 'Germanium',
    carrierDensityM3: 2.0e21,
    mobilityM2Vs: 0.39,
    offsetVoltageV: 0.0003, // 0.3 mV
    color: '#8d1b2e',
  },
  'p-germanium': {
    id: 'p-germanium',
    name: 'p-type Germanium (Ge:In)',
    type: 'p-type',
    material: 'Germanium',
    carrierDensityM3: 1.0e21,
    mobilityM2Vs: 0.19,
    offsetVoltageV: 0.0002, // 0.2 mV
    color: '#d97706',
  },
};

/**
 * Electromagnet field calculation with smooth soft saturation.
 * B = k * I_m up to 0.45 T, then smoothly approaches B_sat = 0.55 T.
 *
 * @param magnetCurrentA Current flowing through magnet coils (A, typical 0..2.5 A)
 * @returns Magnetic field B in Tesla (T)
 */
export function calculateMagneticField(magnetCurrentA: number): number {
  const k = 0.25; // T / A
  const bLinear = k * Math.max(0, magnetCurrentA);
  const bThreshold = 0.45; // T
  const bSatDelta = 0.10; // T saturation margin (approaches 0.55 T)

  if (bLinear <= bThreshold) {
    return bLinear;
  }
  // Smooth C1 transition above 0.45 T
  const excess = bLinear - bThreshold;
  return bThreshold + bSatDelta * Math.tanh(excess / bSatDelta);
}

/**
 * Hall coefficient R_H in m^3 / C.
 * Negative for n-type (electrons), positive for p-type (holes).
 *
 * @param carrierDensityM3 Carrier density n or p in m^-3
 * @param type 'n-type' or 'p-type'
 * @returns R_H in m^3 / C
 */
export function hallCoefficient(carrierDensityM3: number, type: 'n-type' | 'p-type'): number {
  if (carrierDensityM3 <= 0) return 0;
  const magnitude = 1.0 / (carrierDensityM3 * ELEMENTARY_CHARGE);
  return type === 'n-type' ? -magnitude : magnitude;
}

/**
 * Theoretical Hall voltage V_H across slab of thickness t.
 *
 * V_H = (R_H * I * B) / t
 *
 * @param rh Hall coefficient (m^3 / C)
 * @param currentA Specimen current (A)
 * @param fieldT Magnetic field (T, signed)
 * @param thicknessM Slab thickness along B (m)
 * @returns Hall voltage in Volts (V)
 */
export function hallVoltage(
  rh: number,
  currentA: number,
  fieldT: number,
  thicknessM: number
): number {
  if (thicknessM <= 0) return 0;
  return (rh * currentA * fieldT) / thicknessM;
}

/**
 * Longitudinal voltage V_c across length L.
 * V_c = (I * L) / (sigma * w * t)
 * where sigma = n * e * mu
 */
export function longitudinalVoltage(
  currentA: number,
  carrierDensityM3: number,
  mobilityM2Vs: number,
  lengthM: number,
  widthM: number,
  thicknessM: number
): number {
  const sigma = carrierDensityM3 * ELEMENTARY_CHARGE * mobilityM2Vs;
  const crossSection = widthM * thicknessM;
  if (crossSection <= 0 || sigma <= 0) return 0;
  return (currentA * lengthM) / (sigma * crossSection);
}

/**
 * Conductivity sigma from measured longitudinal voltage V_c.
 * sigma = (I * L) / (V_c * w * t)
 */
export function conductivityFromVoltage(
  currentA: number,
  voltageVc: number,
  lengthM: number,
  widthM: number,
  thicknessM: number
): number {
  const crossSection = widthM * thicknessM;
  if (crossSection <= 0 || voltageVc <= 0) return 0;
  return (currentA * lengthM) / (voltageVc * crossSection);
}

/**
 * Carrier density n from Hall coefficient magnitude:
 * n = 1 / (|R_H| * e)
 */
export function carrierDensityFromRh(rhMagnitude: number): number {
  if (rhMagnitude <= 0) return 0;
  return 1.0 / (rhMagnitude * ELEMENTARY_CHARGE);
}

/**
 * Carrier mobility mu from Hall coefficient and conductivity:
 * mu = |R_H| * sigma
 */
export function mobilityFromRhAndSigma(rhMagnitude: number, sigma: number): number {
  return rhMagnitude * sigma;
}

/**
 * Simulated Hall reading with misalignment offset V_0 and Gaussian measurement noise.
 */
export interface HallReading {
  [key: string]: unknown;
  step: number;
  currentMa: number;
  magnetCurrentA: number;
  fieldT: number;
  voltagePositiveBMv: number;
  voltageNegativeBMv: number;
  hallVoltageMv: number; // (V(+B) - V(-B)) / 2
  offsetVoltageMv: number; // (V(+B) + V(-B)) / 2
  rhM3PerC: number;
}

/**
 * Generates a full Hall reading for +B and -B with seeded noise (sigma = 0.05 mV).
 */
export function generateHallReading(
  step: number,
  currentA: number,
  magnetCurrentA: number,
  sampleKey: string,
  thicknessM: number = 0.0005,
  seed: number = 42,
  includeNoise: boolean = true
): HallReading {
  const sample = SAMPLES[sampleKey] || SAMPLES['n-germanium'];
  const bMag = calculateMagneticField(magnetCurrentA);
  const rh = hallCoefficient(sample.carrierDensityM3, sample.type);

  const vHPos = hallVoltage(rh, currentA, bMag, thicknessM);
  const vHNeg = hallVoltage(rh, currentA, -bMag, thicknessM);

  const rng = mulberry32(seed + step * 31);
  const noiseSigma = includeNoise ? 0.05e-3 : 0; // 0.05 mV noise
  const noisePos = gaussianNoise(rng, noiseSigma);
  const noiseNeg = gaussianNoise(rng, noiseSigma);

  const vPos = vHPos + sample.offsetVoltageV + noisePos;
  const vNeg = vHNeg + sample.offsetVoltageV + noiseNeg;

  const vHMv = Number((((vPos - vNeg) / 2.0) * 1e3).toFixed(3));
  const v0Mv = Number((((vPos + vNeg) / 2.0) * 1e3).toFixed(3));
  const vPosMv = Number((vPos * 1e3).toFixed(3));
  const vNegMv = Number((vNeg * 1e3).toFixed(3));

  const rhCalc =
    currentA > 0 && bMag > 0
      ? ((vHMv * 1e-3) * thicknessM) / (currentA * bMag)
      : rh;

  return {
    step,
    currentMa: Number((currentA * 1e3).toFixed(1)),
    magnetCurrentA: Number(magnetCurrentA.toFixed(2)),
    fieldT: Number(bMag.toFixed(3)),
    voltagePositiveBMv: vPosMv,
    voltageNegativeBMv: vNegMv,
    hallVoltageMv: vHMv,
    offsetVoltageMv: v0Mv,
    rhM3PerC: rhCalc,
  };
}
