/**
 * Physical equations and analytical models for Diffraction Grating Laser experiment.
 * All computations use standard SI units (meters, radians, seconds) with JSDoc formulas.
 */

/**
 * Standard diffraction grating line densities in lines per mm.
 */
export const GRATING_LINES_PER_MM_PRESETS = [100, 300, 600] as const;

/**
 * Standard laser wavelength presets in meters.
 * 532 nm (Green), 633 nm (He-Ne Red/Orange), 650 nm (Diode Red).
 */
export const WAVELENGTH_PRESETS = {
  GREEN: 532e-9,
  RED_HENE: 633e-9,
  RED_DIODE: 650e-9,
} as const;

/**
 * Bounds for distance D between diffraction grating and screen in meters.
 */
export const DISTANCE_BOUNDS_M = {
  MIN: 0.3,
  MAX: 2.0,
  DEFAULT: 0.5,
} as const;

/**
 * Maximum physical screen half-width in meters (+/- 1.2 m from optical axis).
 */
export const SCREEN_HALF_WIDTH_M = 1.2;

/**
 * Calculates the grating element (slit spacing) d in meters.
 * Formula: d = \frac{1}{N} = \frac{10^{-3}}{N_{\text{lines/mm}}} \text{ meters}
 *
 * @param linesPerMm Grating line density in lines per mm
 * @returns Grating spacing d in meters
 */
export function gratingElementD(linesPerMm: number): number {
  if (linesPerMm <= 0) return 0;
  return 1e-3 / linesPerMm;
}

/**
 * Computes sin(theta_n) for order n from the grating equation.
 * Formula: d \sin(\theta_n) = n \lambda \implies \sin(\theta_n) = \frac{n \lambda}{d}
 *
 * @param orderN Diffraction order integer (e.g. -3, -2, -1, 0, 1, 2, 3)
 * @param wavelengthM Laser wavelength in meters
 * @param linesPerMm Grating line density in lines per mm
 * @returns Result object with sinTheta and whether the order physically exists (|sinTheta| <= 1)
 */
export function diffractionSinTheta(
  orderN: number,
  wavelengthM: number,
  linesPerMm: number
): { sinTheta: number; exists: boolean } {
  if (linesPerMm <= 0 || wavelengthM <= 0) {
    return { sinTheta: 0, exists: false };
  }
  const d = gratingElementD(linesPerMm);
  const sinTheta = (orderN * wavelengthM) / d;
  const exists = Math.abs(sinTheta) <= 1.0;
  return { sinTheta, exists };
}

/**
 * Computes diffraction angle theta_n in radians.
 * Formula: \theta_n = \arcsin\left(\frac{n \lambda}{d}\right)
 *
 * @param orderN Diffraction order integer
 * @param wavelengthM Laser wavelength in meters
 * @param linesPerMm Grating line density in lines per mm
 * @returns Angle theta in radians, or 0 if order does not physically exist
 */
export function diffractionAngleRad(
  orderN: number,
  wavelengthM: number,
  linesPerMm: number
): { thetaRad: number; exists: boolean } {
  const { sinTheta, exists } = diffractionSinTheta(orderN, wavelengthM, linesPerMm);
  if (!exists) {
    return { thetaRad: 0, exists: false };
  }
  return { thetaRad: Math.asin(sinTheta), exists: true };
}

/**
 * Computes lateral spot displacement x_n on a planar screen at distance D.
 * Formula: x_n = D \tan(\theta_n)
 *
 * @param orderN Diffraction order integer
 * @param wavelengthM Laser wavelength in meters
 * @param linesPerMm Grating line density in lines per mm
 * @param distanceM Screen distance in meters
 * @returns Object with displacement xM (meters), physical existence flag, and screen visibility flag
 */
export function spotPositionM(
  orderN: number,
  wavelengthM: number,
  linesPerMm: number,
  distanceM: number
): { xM: number; exists: boolean; isOnScreen: boolean } {
  const { thetaRad, exists } = diffractionAngleRad(orderN, wavelengthM, linesPerMm);
  if (!exists || distanceM <= 0) {
    return { xM: 0, exists: false, isOnScreen: false };
  }
  const xM = distanceM * Math.tan(thetaRad);
  const isOnScreen = Math.abs(xM) <= SCREEN_HALF_WIDTH_M;
  return { xM, exists: true, isOnScreen };
}

/**
 * Calculates laser wavelength lambda from measured spot position x_n on screen at distance D.
 *
 * Formulas:
 * \theta_n = \arctan(x_n / D)
 * \sin(\theta_n) = \frac{x_n}{\sqrt{x_n^2 + D^2}}
 * \lambda = \frac{d \sin(\theta_n)}{n}
 *
 * @param orderN Diffraction order (non-zero)
 * @param xM Spot position on screen in meters
 * @param linesPerMm Grating line density in lines per mm
 * @param distanceM Screen distance in meters
 * @returns Wavelength lambda in meters
 */
export function wavelengthFromSpot(
  orderN: number,
  xM: number,
  linesPerMm: number,
  distanceM: number
): number {
  if (orderN === 0 || linesPerMm <= 0 || distanceM <= 0) return 0;
  const d = gratingElementD(linesPerMm);
  const sinTheta = xM / Math.hypot(xM, distanceM);
  return (d * sinTheta) / orderN;
}

/**
 * Calculates laser wavelength from the linear regression slope of sin(theta_n) vs order n.
 *
 * Formulas:
 * \sin(\theta_n) = \frac{\lambda}{d} n
 * \text{slope} = \frac{\lambda}{d} \implies \lambda = \text{slope} \times d
 *
 * @param slope Slope of sin(theta_n) vs n
 * @param linesPerMm Grating line density in lines per mm
 * @returns Wavelength lambda in meters
 */
export function wavelengthFromRegression(
  slope: number,
  linesPerMm: number
): number {
  if (slope <= 0 || linesPerMm <= 0) return 0;
  const d = gratingElementD(linesPerMm);
  return slope * d;
}

/**
 * Evaluates single-slit diffraction intensity envelope for slit width a = d / 3.
 *
 * Formula:
 * I(\theta) = I_0 \left[ \frac{\sin(\beta)}{\beta} \right]^2, \text{ where } \beta = \frac{\pi a \sin(\theta)}{\lambda}
 *
 * @param thetaRad Diffraction angle in radians
 * @param linesPerMm Grating line density in lines per mm
 * @param wavelengthM Laser wavelength in meters
 * @returns Relative intensity in range [0, 1]
 */
export function singleSlitIntensity(
  thetaRad: number,
  linesPerMm: number,
  wavelengthM: number
): number {
  if (linesPerMm <= 0 || wavelengthM <= 0) return 1.0;
  const d = gratingElementD(linesPerMm);
  const a = d / 3.0; // standard grating slit width ratio a = d / 3
  const sinTheta = Math.sin(thetaRad);
  const beta = (Math.PI * a * sinTheta) / wavelengthM;

  if (Math.abs(beta) < 1e-6) {
    return 1.0 - (beta * beta) / 3.0;
  }
  const ratio = Math.sin(beta) / beta;
  return ratio * ratio;
}

/**
 * Clamps screen distance D to realistic laboratory bounds [0.3 m, 2.0 m].
 *
 * @param distanceM Input distance in meters
 * @returns Clamped distance and clamp flag
 */
export function clampDistanceM(distanceM: number): {
  clamped: number;
  wasClamped: boolean;
} {
  if (Number.isNaN(distanceM) || !Number.isFinite(distanceM)) {
    return { clamped: DISTANCE_BOUNDS_M.DEFAULT, wasClamped: true };
  }
  if (distanceM < DISTANCE_BOUNDS_M.MIN) {
    return { clamped: DISTANCE_BOUNDS_M.MIN, wasClamped: true };
  }
  if (distanceM > DISTANCE_BOUNDS_M.MAX) {
    return { clamped: DISTANCE_BOUNDS_M.MAX, wasClamped: true };
  }
  return { clamped: distanceM, wasClamped: false };
}
