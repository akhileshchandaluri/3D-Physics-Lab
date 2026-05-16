import { SimulationRequest, SimulationFrame, RegressionLine } from '../types/simulation';

// ─── Material constants ───────────────────────────────────────────────────────
//
// Each material encodes fundamental creep coefficients:
//   a  – primary (logarithmic) creep amplitude
//   b  – secondary (linear) creep rate coefficient       [cm·s⁻¹ per gram]
//   c  – tertiary exponential pre-factor
//   d  – tertiary growth exponent                        [s⁻¹]
//   ruptureStrain – Δl/l₀ at which wire snaps
//   t3Constant & t3Exponent - determine onset of tertiary creep via t3 = K / (mass^n)
//
// The full elongation model is:
//
//   Δl(t) = a·ln(1+t) + b·t + c·(exp(d·(t−t₃)) − 1) · H(t−t₃)
//
// All coefficients are scaled by loadMass so heavier loads deform more.
// ─────────────────────────────────────────────────────────────────────────────

interface MaterialProps {
  /** Primary creep logarithmic amplitude  (cm / gram) */
  a: number;
  /** Secondary creep linear rate          (cm / (gram·s)) */
  b: number;
  /** Tertiary exponential pre-factor      (cm / gram) */
  c: number;
  /** Tertiary growth rate                 (1/s) */
  d: number;
  /** Δl/l₀ rupture strain */
  ruptureStrain: number;
  /** Constant K for t3 = K / (mass^n) */
  t3Constant: number;
  /** Exponent n for t3 calculation */
  t3Exponent: number;
}

const MATERIAL_PROPS: Record<string, MaterialProps> = {
  //
  // Lead - softest, snaps easily.
  // At 200g, t3 ~ 2500s. K = 2500 * 200^2 = 1e8
  //
  lead: {
    a: 3.0e-4,
    b: 1.6e-6,
    c: 2.0e-4,
    d: 3.0e-3,
    ruptureStrain: 0.15,
    t3Constant: 1e8,
    t3Exponent: 2.0,
  },

  //
  // Copper - strongest. Very high K, takes huge loads to snap.
  // At 200g, t3 ~ 50000s. K = 50000 * 200^2 = 2e9
  //
  copper: {
    a: 1.0e-4,
    b: 5.0e-7,
    c: 5.0e-5,
    d: 2.0e-3,
    ruptureStrain: 0.20,
    t3Constant: 2e9,
    t3Exponent: 2.0,
  },

  //
  // Aluminum - intermediate
  // At 200g, t3 ~ 15000s. K = 15000 * 200^2 = 6e8
  //
  aluminum: {
    a: 2.0e-4,
    b: 1.0e-6,
    c: 1.0e-4,
    d: 2.5e-3,
    ruptureStrain: 0.12,
    t3Constant: 6e8,
    t3Exponent: 2.0,
  },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Box-Muller Gaussian noise  (mean=0, σ=1).
 * Seeded via Math.random – good enough for lab simulation.
 */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Ordinary least-squares linear regression on paired arrays.
 * Returns slope, intercept, and R².
 */
function linearRegression(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number; rSquared: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0, rSquared: 0 };

  const sumX  = xs.reduce((a, b) => a + b, 0);
  const sumY  = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumX2 = xs.reduce((s, x) => s + x * x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R²
  const yMean = sumY / n;
  const ssTot = ys.reduce((s, y) => s + (y - yMean) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * xs[i] + intercept)) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

// ─── Simulation service ───────────────────────────────────────────────────────

export class SimulationService {
  /**
   * Generate a full creep simulation series.
   *
   * Returns:
   *   history        – ordered SimulationFrame array
   *   beta           – transient creep constant   [s^(-1/3)]
   *   k              – viscous creep constant     [s^(-1)]
   *   graph1Regression – OLS fit for Graph 1
   *   graph2Regression – OLS fit for Graph 2
   */
  public generateSeries(request: SimulationRequest): {
    history: SimulationFrame[];
    beta: number;
    k: number;
    graph1Regression: RegressionLine;
    graph2Regression: RegressionLine;
  } {
    const {
      initialLength,
      loadMass,
      totalDurationMinutes,
      intervalMinutes,
      materialType,
      noiseLevel,
    } = request;

    const mat = MATERIAL_PROPS[materialType] || MATERIAL_PROPS['lead'];

    // Scale material constants by load mass (heavier → more creep)
    const A = mat.a * loadMass;   // primary log amplitude   (cm)
    const B = mat.b * loadMass;   // secondary linear rate   (cm/s)
    const C = mat.c * loadMass;   // tertiary pre-factor     (cm)
    const D = mat.d;              // tertiary exponent       (1/s) – material property only

    const totalSeconds    = totalDurationMinutes * 60;
    const intervalSeconds = intervalMinutes * 60;
    const nSteps          = Math.floor(totalSeconds / intervalSeconds);
    
    // Calculate physical onset of tertiary creep based on applied load
    const t3 = mat.t3Constant / Math.pow(loadMass, mat.t3Exponent);

    const frames: SimulationFrame[] = [];
    let snapped = false;

    // ── t = 0 frame ──────────────────────────────────────────────────────────
    frames.push({
      timeMinutes:         0,
      timeSeconds:         0,
      timeOneThird:        0,
      elongation:          0,
      instantaneousLength: initialLength,
      deltaLOverL0:        0,
      deltaLOverLt:        0,
      creepStage:          'primary',
      snapped:             false,
    });

    // ── Time-stepped frames ──────────────────────────────────────────────────
    for (let step = 1; step <= nSteps; step++) {
      const t = step * intervalSeconds;

      if (snapped) {
        // After rupture, repeat the last ruptured frame with updated time
        const last = frames[frames.length - 1];
        frames.push({
          ...last,
          timeMinutes:  t / 60,
          timeSeconds:  t,
          timeOneThird: Math.cbrt(t),
        });
        continue;
      }

      // ── Elongation model: Δl(t) = A·ln(1+t) + B·t + C·(exp(D·(t−t₃))−1)·H(t>t₃)
      const deltaLPrimary   = A * Math.log(1 + t);
      const deltaLSecondary = B * t;
      const deltaLTertiary  = t > t3
        ? C * (Math.exp(D * (t - t3)) - 1)
        : 0;

      let deltaL = deltaLPrimary + deltaLSecondary + deltaLTertiary;

      // Apply Gaussian noise scaled by current Δl (σ = noiseLevel · Δl)
      if (noiseLevel > 0 && deltaL > 0) {
        deltaL += noiseLevel * deltaL * gaussianRandom();
        deltaL = Math.max(deltaL, 0); // keep monotonic in expectation
      }

      // Determine creep stage for this frame
      const stage: SimulationFrame['creepStage'] =
        t > t3
          ? 'tertiary'
          : deltaLSecondary > deltaLPrimary
            ? 'secondary'
            : 'primary';

      const lt          = initialLength + deltaL;
      const deltaLOverL0 = deltaL / initialLength;
      const deltaLOverLt = deltaL / lt;

      snapped = deltaLOverL0 >= mat.ruptureStrain;

      frames.push({
        timeMinutes:         t / 60,
        timeSeconds:         t,
        timeOneThird:        Math.cbrt(t),
        elongation:          deltaL,
        instantaneousLength: lt,
        deltaLOverL0,
        deltaLOverLt,
        creepStage:          stage,
        snapped,
      });
    }

    // ── Graph 1 regression: Δl/l₀ vs t^(1/3) in PRIMARY region ─────────────
    //
    // Primary region: frames tagged 'primary' (excluding t=0 to avoid log(1)=0 artefact)
    const g1Indices = frames
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.creepStage === 'primary' && f.timeSeconds > 0);

    const g1Start = g1Indices.length > 0 ? g1Indices[0].i : 1;
    const g1End   = g1Indices.length > 0 ? g1Indices[g1Indices.length - 1].i : Math.floor(nSteps * 0.40);

    const g1xs = frames.slice(g1Start, g1End + 1).map(f => f.timeOneThird);
    const g1ys = frames.slice(g1Start, g1End + 1).map(f => f.deltaLOverL0);
    const g1Reg = linearRegression(g1xs, g1ys);

    const graph1Regression: RegressionLine = {
      slope:           g1Reg.slope,
      intercept:       g1Reg.intercept,
      fitRangeIndices: [g1Start, g1End],
      rSquared:        g1Reg.rSquared,
    };

    // ── Graph 2 regression: Δl/l_t vs t in SECONDARY region ─────────────────
    //
    // Secondary region: roughly 35%–70% of total duration (the linear plateau)
    const secStart = Math.floor(0.35 * nSteps);
    const secEnd   = Math.floor(0.68 * nSteps);

    // Clamp to available non-snapped range
    const safeSecEnd = Math.min(
      secEnd,
      frames.findIndex(f => f.snapped) > 0
        ? frames.findIndex(f => f.snapped) - 1
        : secEnd,
    );

    const g2xs = frames.slice(secStart, safeSecEnd + 1).map(f => f.timeSeconds);
    const g2ys = frames.slice(secStart, safeSecEnd + 1).map(f => f.deltaLOverLt);
    const g2Reg = linearRegression(g2xs, g2ys);

    const graph2Regression: RegressionLine = {
      slope:           g2Reg.slope,
      intercept:       g2Reg.intercept,
      fitRangeIndices: [secStart, safeSecEnd],
      rSquared:        g2Reg.rSquared,
    };

    return {
      history:          frames,
      beta:             graph1Regression.slope,   // β  [s^(-1/3)]
      k:                graph2Regression.slope,   // k  [s^(-1)]
      graph1Regression,
      graph2Regression,
    };
  }
}