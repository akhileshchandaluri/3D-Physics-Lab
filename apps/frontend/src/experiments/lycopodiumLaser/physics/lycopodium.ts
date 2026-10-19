/**
 * Physical constants and exact analytical formulas for Lycopodium Powder Laser Diffraction.
 * All functions operate in SI units (meters, radians, seconds) and include JSDoc formulas.
 */

/**
 * Positive zeros of the Bessel function J_1(x) divided by pi:
 * k_n = x_n / pi for the first 5 dark rings.
 * Values: [1.2197, 2.2331, 3.2383, 4.2411, 5.2428]
 */
export const DARK_RING_K: readonly number[] = [1.2197, 2.2331, 3.2383, 4.2411, 5.2428] as const;

/**
 * Standard laser wavelength presets in meters.
 * Red: 650 nm, Green: 532 nm.
 */
export const WAVELENGTH_PRESETS = {
  RED: 650e-9,
  GREEN: 532e-9,
} as const;

/**
 * Screen distance bounds in meters.
 */
export const DISTANCE_BOUNDS_M = {
  MIN: 0.5,
  MAX: 3.0,
  DEFAULT: 1.0,
} as const;

/**
 * Reference hidden particle diameters for Lycopodium samples A, B, and C (in meters).
 */
export const SAMPLE_DIAMETERS: Record<'A' | 'B' | 'C', number> = {
  A: 22e-6, // 22 um
  B: 32e-6, // 32 um
  C: 45e-6, // 45 um
} as const;

/**
 * Computes Bessel function of the first kind of order 1, J_1(x).
 * Uses rational/polynomial approximation from Abramowitz & Stegun (9.4.4, 9.4.6).
 *
 * Formula:
 * For |x| <= 3, y = (x / 3)^2:
 * J_1(x) = x * [0.5 + y * (-0.56249985 + y * (0.21093573 + y * (-0.03954289 + y * (0.00443319 + y * (-0.00031761 + y * 0.00001109)))))]
 *
 * For |x| > 3, y = 3 / |x|, theta_1 = |x| - 3 * pi / 4:
 * f_1(|x|) = 0.79788456 + y * (-0.00000077 + y * (-0.00552740 + y * (0.00009512 + y * (0.00137237 + y * (-0.00072805 + y * 0.00014476))))))
 * g_1(|x|) = y * (0.04166397 + y * (-0.00003954 + y * (-0.00262573 + y * (-0.00054125 + y * (-0.00029333 + y * 0.00013558))))))
 * J_1(x) = sign(x) * (|x|)^(-1/2) * [ f_1(|x|) * cos(theta_1) - g_1(|x|) * sin(theta_1) ]
 *
 * @param x Input dimensionless argument
 * @returns J_1(x)
 */
export function besselJ1(x: number): number {
  const ax = Math.abs(x);
  if (ax === 0) return 0;

  let ans = 0;
  if (ax < 8.0) {
    const y = x * x;
    const ans1 =
      x *
      (72362614232.0 +
        y *
          (-7895059235.0 +
            y *
              (242396853.1 +
                y * (-2972611.439 + y * (15704.4826 + y * -30.16036606)))));
    const ans2 =
      144725228442.0 +
      y *
        (2300535178.0 +
          y *
            (18583304.74 +
              y * (99447.43394 + y * (374.5188077 + y * 1.0))));
    ans = ans1 / ans2;
  } else {
    const z = 8.0 / ax;
    const y = z * z;
    const xx = ax - 2.356194491; // ax - 3 * pi / 4
    const ans1 =
      1.0 +
      y *
        (0.183105e-2 +
          y *
            (-0.3516396496e-4 +
              y * (0.2457520174e-5 + y * -0.240337019e-6)));
    const ans2 =
      0.04687499995 +
      y *
        (-0.2002690873e-3 +
          y *
            (0.8449199096e-5 +
              y * (-0.882289597e-6 + y * 0.105787412e-6)));
    ans =
      Math.sqrt(0.636619772 / ax) *
      (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
    if (x < 0) ans = -ans;
  }

  return ans;
}

/**
 * Calculates the normalized Airy diffraction intensity for a circular obstacle or aperture.
 *
 * Formula:
 * I(theta) = I_0 * [ (2 * J_1(x)) / x ]^2, where x = (pi * d * sin(theta)) / lambda
 * As x -> 0, I(theta) -> 1.0.
 *
 * @param theta Diffraction angle in radians
 * @param diameterM Particle diameter in meters
 * @param wavelengthM Laser wavelength in meters
 * @returns Normalized intensity in range [0, 1]
 */
export function airyIntensity(
  theta: number,
  diameterM: number,
  wavelengthM: number
): number {
  if (diameterM <= 0 || wavelengthM <= 0) return 0;
  const sinTheta = Math.sin(theta);
  const x = (Math.PI * diameterM * sinTheta) / wavelengthM;

  if (Math.abs(x) < 1e-7) {
    // Maclaurin series limit: [ 2 * J1(x) / x ]^2 = 1 - x^2 / 4 + ...
    return 1.0 - (x * x) / 4.0;
  }

  const j1 = besselJ1(x);
  const ratio = (2.0 * j1) / x;
  return ratio * ratio;
}

/**
 * Computes the theoretical radius of dark ring order n on a screen at distance D.
 *
 * Formulas:
 * sin(theta_n) = k_n * lambda / d
 * theta_n = arcsin(sin(theta_n))
 * r_n = D * tan(theta_n)
 *
 * @param orderN Ring order (1-indexed: 1, 2, 3, 4, 5)
 * @param wavelengthM Laser wavelength in meters
 * @param distanceM Screen distance in meters
 * @param diameterM Particle diameter in meters
 * @returns Ring radius on screen in meters
 */
export function darkRingRadius(
  orderN: number,
  wavelengthM: number,
  distanceM: number,
  diameterM: number
): number {
  if (orderN < 1 || orderN > DARK_RING_K.length) return 0;
  if (wavelengthM <= 0 || distanceM <= 0 || diameterM <= 0) return 0;

  const kn = DARK_RING_K[orderN - 1];
  const sinTheta = (kn * wavelengthM) / diameterM;
  if (sinTheta >= 1.0) {
    // Ring angle exceeds 90 degrees
    return Infinity;
  }

  const theta = Math.asin(sinTheta);
  return distanceM * Math.tan(theta);
}

/**
 * Estimates particle diameter from measured ring radius r_n on screen at distance D.
 *
 * Formula:
 * theta_n = arctan(r_n / D)
 * sin(theta_n) = sin(arctan(r_n / D)) = r_n / sqrt(r_n^2 + D^2)
 * d = k_n * lambda / sin(theta_n)
 *
 * @param orderN Ring order (1-indexed: 1..5)
 * @param radiusM Measured dark ring radius in meters
 * @param distanceM Screen distance in meters
 * @param wavelengthM Laser wavelength in meters
 * @returns Estimated particle diameter in meters
 */
export function particleDiameterFromRadius(
  orderN: number,
  radiusM: number,
  distanceM: number,
  wavelengthM: number
): number {
  if (orderN < 1 || orderN > DARK_RING_K.length) return 0;
  if (radiusM <= 0 || distanceM <= 0 || wavelengthM <= 0) return 0;

  const kn = DARK_RING_K[orderN - 1];
  const sinTheta = radiusM / Math.hypot(radiusM, distanceM);
  if (sinTheta <= 0) return 0;

  return (kn * wavelengthM) / sinTheta;
}

/**
 * Estimates particle diameter from the linear regression slope of r_n vs k_n.
 *
 * Formula:
 * r_n approx (D * lambda / d) * k_n
 * slope = D * lambda / d => d = (D * lambda) / slope
 *
 * @param slopeM Regression slope (meters per dimensionless k)
 * @param distanceM Screen distance in meters
 * @param wavelengthM Laser wavelength in meters
 * @returns Estimated particle diameter in meters
 */
export function particleDiameterFromRegression(
  slopeM: number,
  distanceM: number,
  wavelengthM: number
): number {
  if (slopeM <= 0 || distanceM <= 0 || wavelengthM <= 0) return 0;
  return (distanceM * wavelengthM) / slopeM;
}

/**
 * Clamps screen distance to realistic laboratory physical bounds.
 *
 * @param distanceM Input distance in meters
 * @returns Clamped distance in range [0.5, 3.0]
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
