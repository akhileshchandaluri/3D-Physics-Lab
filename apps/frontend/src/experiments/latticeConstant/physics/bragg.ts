/**
 * Bragg Diffraction Physics Engine for Cubic Crystals (Rock Salt FCC structure).
 *
 * Formulas:
 * 1. Bragg's Law:
 *    2 * d_hkl * sin(theta) = lambda
 *    d_hkl = a / sqrt(h^2 + k^2 + l^2)
 *    a = lambda * sqrt(h^2 + k^2 + l^2) / (2 * sin(theta))
 *
 * 2. FCC Selection Rules:
 *    Reflections allowed only when h, k, l are all odd or all even.
 *    Forbidden when h, k, l are mixed parity.
 *
 * 3. Structure Factor for Rock Salt (two-ion basis: cation at (0,0,0), anion at (1/2,1/2,1/2)):
 *    All odd:  |F| = 4 * |f_cation - f_anion|
 *    All even: |F| = 4 * |f_cation + f_anion|
 *    Atomic scattering factor: f(Z, s) = Z * exp(-B * s^2)
 *    where s = sin(theta) / lambda (in A^-1), B = 1.0 A^2
 *
 * 4. Lorentz-Polarization Factor:
 *    L_p = (1 + cos^2(2*theta)) / (sin^2(theta) * cos(theta))
 *
 * 5. Intensity:
 *    I_hkl = multiplicity * |F|^2 * L_p
 *    Peak shape: Gaussian with FWHM = 0.15 deg in 2theta
 */

import { mulberry32, gaussianNoise } from '../../../lib/stats';

export interface XRaySource {
  id: string;
  name: string;
  wavelengthA: number; // Angstroms (A)
}

export const XRAY_SOURCES: Record<string, XRaySource> = {
  'cu-ka': {
    id: 'cu-ka',
    name: 'Cu K-alpha (λ = 1.5406 Å)',
    wavelengthA: 1.5406,
  },
  'mo-ka': {
    id: 'mo-ka',
    name: 'Mo K-alpha (λ = 0.7107 Å)',
    wavelengthA: 0.7107,
  },
};

export interface CrystalData {
  id: string;
  name: string;
  trueLatticeConstantA: number; // Angstroms (A)
  cationName: string;
  cationSymbol: string;
  cationZ: number; // Electrons
  anionName: string;
  anionSymbol: string;
  anionZ: number; // Electrons
  cationColor: string;
  anionColor: string;
}

export const CRYSTALS: Record<string, CrystalData> = {
  nacl: {
    id: 'nacl',
    name: 'Sodium Chloride (NaCl)',
    trueLatticeConstantA: 5.64,
    cationName: 'Sodium (Na+)',
    cationSymbol: 'Na+',
    cationZ: 10,
    anionName: 'Chloride (Cl-)',
    anionSymbol: 'Cl-',
    anionZ: 18,
    cationColor: '#93c5fd', // Soft blue
    anionColor: '#86efac', // Soft green
  },
  kcl: {
    id: 'kcl',
    name: 'Potassium Chloride (KCl)',
    trueLatticeConstantA: 6.293,
    cationName: 'Potassium (K+)',
    cationSymbol: 'K+',
    cationZ: 18,
    anionName: 'Chloride (Cl-)',
    anionSymbol: 'Cl-',
    anionZ: 18,
    cationColor: '#c084fc', // Purple
    anionColor: '#86efac',
  },
  lif: {
    id: 'lif',
    name: 'Lithium Fluoride (LiF)',
    trueLatticeConstantA: 4.026,
    cationName: 'Lithium (Li+)',
    cationSymbol: 'Li+',
    cationZ: 2,
    anionName: 'Fluoride (F-)',
    anionSymbol: 'F-',
    anionZ: 10,
    cationColor: '#fca5a5', // Light red
    anionColor: '#fdba74', // Orange
  },
};

export interface MillerIndex {
  h: number;
  k: number;
  l: number;
  h2k2l2: number;
  multiplicity: number;
}

export const ALLOWED_REFLECTIONS: MillerIndex[] = [
  { h: 1, k: 1, l: 1, h2k2l2: 3, multiplicity: 8 },
  { h: 2, k: 0, l: 0, h2k2l2: 4, multiplicity: 6 },
  { h: 2, k: 2, l: 0, h2k2l2: 8, multiplicity: 12 },
  { h: 3, k: 1, l: 1, h2k2l2: 11, multiplicity: 24 },
  { h: 2, k: 2, l: 2, h2k2l2: 12, multiplicity: 8 },
  { h: 4, k: 0, l: 0, h2k2l2: 16, multiplicity: 6 },
  { h: 3, k: 3, l: 1, h2k2l2: 19, multiplicity: 24 },
  { h: 4, k: 2, l: 0, h2k2l2: 20, multiplicity: 24 },
  { h: 4, k: 2, l: 2, h2k2l2: 24, multiplicity: 24 },
];

/**
 * Checks if (hkl) is allowed by FCC selection rules (all odd or all even).
 */
export function isAllowedFCC(h: number, k: number, l: number): boolean {
  const isOddH = Math.abs(h) % 2 === 1;
  const isOddK = Math.abs(k) % 2 === 1;
  const isOddL = Math.abs(l) % 2 === 1;

  const allOdd = isOddH && isOddK && isOddL;
  const allEven = !isOddH && !isOddK && !isOddL;
  return allOdd || allEven;
}

/**
 * Atomic scattering factor f(Z, s) = Z * exp(-B * s^2)
 * where s = sin(theta) / lambda (A^-1), B = 1.0 A^2.
 */
export function atomicScatteringFactor(z: number, s: number): number {
  const b = 1.0; // A^2 thermal Debye-Waller parameter
  return z * Math.exp(-b * s * s);
}

/**
 * Structure factor |F| for rock salt cubic lattice.
 */
export function structureFactor(
  h: number,
  k: number,
  l: number,
  sinTheta: number,
  wavelengthA: number,
  cationZ: number,
  anionZ: number
): number {
  if (!isAllowedFCC(h, k, l)) return 0;
  const s = sinTheta / wavelengthA;
  const fCation = atomicScatteringFactor(cationZ, s);
  const fAnion = atomicScatteringFactor(anionZ, s);

  const isAllOdd = Math.abs(h) % 2 === 1 && Math.abs(k) % 2 === 1 && Math.abs(l) % 2 === 1;
  if (isAllOdd) {
    return 4.0 * Math.abs(fCation - fAnion);
  } else {
    return 4.0 * Math.abs(fCation + fAnion);
  }
}

/**
 * Lorentz-polarization factor for unpolarized X-ray powder diffraction.
 */
export function lorentzPolarizationFactor(thetaRad: number): number {
  if (thetaRad <= 0 || thetaRad >= Math.PI / 2) return 0;
  const twoTheta = 2.0 * thetaRad;
  const numerator = 1.0 + Math.pow(Math.cos(twoTheta), 2);
  const denominator = Math.pow(Math.sin(thetaRad), 2) * Math.cos(thetaRad);
  return numerator / Math.max(1e-6, denominator);
}

export interface BraggPeak {
  h: number;
  k: number;
  l: number;
  h2k2l2: number;
  twoThetaDeg: number;
  thetaRad: number;
  dSpacingA: number;
  relativeIntensity: number;
}

/**
 * Computes all allowed Bragg peak positions and intensities within 2theta in [10, 90] degrees.
 */
export function calculateBraggPeaks(
  crystalKey: string,
  sourceKey: string = 'cu-ka'
): BraggPeak[] {
  const crystal = CRYSTALS[crystalKey] || CRYSTALS['nacl'];
  const source = XRAY_SOURCES[sourceKey] || XRAY_SOURCES['cu-ka'];
  const a = crystal.trueLatticeConstantA;
  const lambda = source.wavelengthA;

  const peaks: BraggPeak[] = [];

  for (const refl of ALLOWED_REFLECTIONS) {
    const sinTheta = (lambda * Math.sqrt(refl.h2k2l2)) / (2.0 * a);
    if (sinTheta >= 0.99) continue; // Beyond physical diffraction limit

    const thetaRad = Math.asin(sinTheta);
    const twoThetaDeg = (thetaRad * 2.0 * 180.0) / Math.PI;

    if (twoThetaDeg < 10.0 || twoThetaDeg > 90.0) continue;

    const d = a / Math.sqrt(refl.h2k2l2);
    const fMag = structureFactor(
      refl.h,
      refl.k,
      refl.l,
      sinTheta,
      lambda,
      crystal.cationZ,
      crystal.anionZ
    );
    const lp = lorentzPolarizationFactor(thetaRad);
    const rawIntensity = refl.multiplicity * Math.pow(fMag, 2) * lp;

    peaks.push({
      h: refl.h,
      k: refl.k,
      l: refl.l,
      h2k2l2: refl.h2k2l2,
      twoThetaDeg: Number(twoThetaDeg.toFixed(2)),
      thetaRad,
      dSpacingA: Number(d.toFixed(3)),
      relativeIntensity: rawIntensity,
    });
  }

  // Normalize max intensity to 100
  const maxI = Math.max(...peaks.map((p) => p.relativeIntensity), 1.0);
  peaks.forEach((p) => {
    p.relativeIntensity = Number(((p.relativeIntensity / maxI) * 100.0).toFixed(1));
  });

  return peaks;
}

/**
 * Calculates continuous intensity spectrum I(2theta) from 10 to 90 degrees with step 0.1 deg.
 */
export function generateDiffractionPattern(
  crystalKey: string,
  sourceKey: string = 'cu-ka',
  seed: number = 42
): { twoTheta: number; intensity: number }[] {
  const peaks = calculateBraggPeaks(crystalKey, sourceKey);
  const pattern: { twoTheta: number; intensity: number }[] = [];
  const rng = mulberry32(seed);

  const fwhm = 0.15; // deg
  const sigma = fwhm / 2.35482; // Gaussian standard deviation

  for (let twoTheta = 10.0; twoTheta <= 90.0; twoTheta += 0.1) {
    const tt = Number(twoTheta.toFixed(1));
    let totalI = 2.0 + gaussianNoise(rng, 0.35); // Small flat background with seeded noise

    for (const peak of peaks) {
      const diff = tt - peak.twoThetaDeg;
      if (Math.abs(diff) < 1.0) {
        const g = Math.exp(-Math.pow(diff, 2) / (2.0 * Math.pow(sigma, 2)));
        totalI += peak.relativeIntensity * g;
      }
    }

    pattern.push({
      twoTheta: tt,
      intensity: Number(Math.max(0, totalI).toFixed(2)),
    });
  }

  return pattern;
}

/**
 * Lattice constant from Bragg peak 2theta:
 * a = lambda * sqrt(h^2 + k^2 + l^2) / (2 * sin(theta))
 */
export function latticeConstantFromPeak(
  twoThetaDeg: number,
  h: number,
  k: number,
  l: number,
  wavelengthA: number
): number {
  const thetaRad = ((twoThetaDeg / 2.0) * Math.PI) / 180.0;
  const sinTheta = Math.sin(thetaRad);
  if (sinTheta <= 0) return 0;
  const h2k2l2 = h * h + k * k + l * l;
  return (wavelengthA * Math.sqrt(h2k2l2)) / (2.0 * sinTheta);
}

export interface PickedPeakObservation {
  [key: string]: unknown;
  id: string;
  twoThetaDeg: number;
  thetaDeg: number;
  sinTheta: number;
  sin2Theta: number;
  h: number;
  k: number;
  l: number;
  h2k2l2: number;
  calculatedAA: number;
}
