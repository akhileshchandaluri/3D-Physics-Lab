/**
 * Statistical analysis and random noise utilities for Physim labs.
 * Pure TypeScript functions with SI unit handling and mathematical guarantees.
 */

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  slopeStdErr: number;
}

/**
 * Calculates the arithmetic mean of an array of numbers.
 * Formula: \bar{x} = \frac{1}{N} \sum_{i=1}^N x_i
 *
 * @param values Array of numerical values
 * @returns Arithmetic mean of values, or 0 if array is empty
 */
export function mean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Calculates the sample standard deviation (Bessel's correction, N-1).
 * Formula: s = \sqrt{\frac{1}{N - 1} \sum_{i=1}^N (x_i - \bar{x})^2}
 *
 * @param values Array of numerical values
 * @returns Sample standard deviation, or 0 if array has fewer than 2 elements
 */
export function sampleStdDev(values: number[]): number {
  if (!values || values.length < 2) return 0;
  const avg = mean(values);
  const varianceSum = values.reduce((acc, v) => acc + (v - avg) ** 2, 0);
  return Math.sqrt(varianceSum / (values.length - 1));
}

/**
 * Computes ordinary least squares (OLS) linear regression: y = m * x + c.
 *
 * Formulas:
 * Slope (m): m = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2} = \frac{S_{xy}}{S_{xx}}
 * Intercept (c): c = \bar{y} - m \bar{x}
 * Coefficient of Determination (r^2): r^2 = \frac{S_{xy}^2}{S_{xx} S_{yy}}
 * Residual Standard Error (s_{yx}): s_{yx} = \sqrt{\frac{\sum (y_i - (m x_i + c))^2}{N - 2}}
 * Slope Standard Error (SE_m): SE_m = \frac{s_{yx}}{\sqrt{S_{xx}}}
 *
 * @param xs Independent variable values
 * @param ys Dependent variable values
 * @returns Regression parameters: slope, intercept, r2, and slopeStdErr
 */
export function linearRegression(xs: number[], ys: number[]): LinearRegressionResult {
  const n = Math.min(xs?.length ?? 0, ys?.length ?? 0);
  if (n < 2) {
    return { slope: 0, intercept: 0, r2: 0, slopeStdErr: 0 };
  }

  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
  }
  const meanX = sumX / n;
  const meanY = sumY / n;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  if (sxx === 0) {
    return { slope: 0, intercept: meanY, r2: 0, slopeStdErr: 0 };
  }

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;

  let r2 = 0;
  if (syy === 0) {
    // If all y values are identical and slope is 0, fit is exact
    r2 = 1;
  } else {
    r2 = Math.min(1, Math.max(0, (sxy * sxy) / (sxx * syy)));
  }

  let slopeStdErr = 0;
  if (n > 2) {
    let ssRes = 0;
    for (let i = 0; i < n; i++) {
      const yFit = slope * xs[i] + intercept;
      const res = ys[i] - yFit;
      ssRes += res * res;
    }
    const residualVariance = ssRes / (n - 2);
    slopeStdErr = Math.sqrt(Math.max(0, residualVariance / sxx));
  }

  return { slope, intercept, r2, slopeStdErr };
}

/**
 * Calculates absolute percent error between measured and true physical quantities.
 * Formula: \delta = \left| \frac{\text{measured} - \text{trueVal}}{\text{trueVal}} \right| \times 100\%
 *
 * @param measured Experimentally determined value
 * @param trueVal True/accepted reference value
 * @returns Percent error (positive percentage)
 */
export function percentError(measured: number, trueVal: number): number {
  if (trueVal === 0) {
    return measured === 0 ? 0 : Math.abs(measured) * 100;
  }
  return Math.abs((measured - trueVal) / trueVal) * 100;
}

/**
 * Mulberry32 32-bit PRNG (Pseudo-Random Number Generator).
 * Produces deterministic, repeatable pseudo-random numbers in [0, 1).
 *
 * Mathematical recurrence:
 * a = (a + \text{0x6D2B79F5}) \pmod{2^{32}}
 * t = (a \oplus (a \gg 15)) \times (1 \mid a)
 * t = t \oplus (t + (t \oplus (t \gg 7)) \times (61 \mid t))
 * r = ((t \oplus (t \gg 14)) \gg 0) / 2^{32}
 *
 * @param seed Unsigned integer initial seed
 * @returns Function yielding a pseudorandom number in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates zero-mean Gaussian (normal) measurement noise using Box-Muller transform.
 * Formula: Z = \sqrt{-2 \ln(u_1)} \cos(2\pi u_2), \quad \text{Noise} = Z \times \sigma
 *
 * @param rng Uniform PRNG yielding values in [0, 1)
 * @param sigma Standard deviation of measurement noise
 * @returns Normally distributed random noise sample with standard deviation sigma
 */
export function gaussianNoise(rng: () => number, sigma: number): number {
  if (sigma === 0) return 0;
  const u1 = Math.max(rng(), 1e-15);
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * sigma;
}
