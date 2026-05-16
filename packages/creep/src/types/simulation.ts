import { z } from 'zod';

// ─── Request ────────────────────────────────────────────────────────────────

export const SimulationRequestSchema = z.object({
  /** Initial wire length in centimetres (e.g. 50) */
  initialLength: z.number().positive(),

  /** Suspended load mass in grams (e.g. 100–500 g) */
  loadMass: z.number().positive(),

  /** Total experiment duration in minutes */
  totalDurationMinutes: z.number().positive(),

  /** Observation interval in minutes (default 3 min) */
  intervalMinutes: z.number().positive().default(3),

  /** Wire material – governs material constants */
  materialType: z.enum(['lead', 'copper', 'aluminum']).default('lead'),

  /**
   * Optional Gaussian noise level applied to Δl as a fraction of Δl.
   * 0 = perfectly smooth, 0.02 = 2 % noise (realistic lab scatter).
   * Default: 0.015
   */
  noiseLevel: z.number().min(0).max(0.2).default(0.015),
});

export type SimulationRequest = z.infer<typeof SimulationRequestSchema>;

// ─── Per-step data frame ─────────────────────────────────────────────────────

export interface SimulationFrame {
  /** t in minutes */
  timeMinutes: number;
  /** t in seconds */
  timeSeconds: number;
  /** t^(1/3) – x-axis for Graph 1 */
  timeOneThird: number;
  /** Δl in cm */
  elongation: number;
  /** l_t = l₀ + Δl  (cm) */
  instantaneousLength: number;
  /** Δl / l₀  (dimensionless) – y-axis for Graph 1 */
  deltaLOverL0: number;
  /** Δl / l_t  (dimensionless) – y-axis for Graph 2 */
  deltaLOverLt: number;
  /** Which creep stage dominated at this step */
  creepStage: 'primary' | 'secondary' | 'tertiary';
  /** Wire has ruptured */
  snapped: boolean;
}

// ─── Regression line ─────────────────────────────────────────────────────────

export interface RegressionLine {
  slope: number;
  intercept: number;
  /** Index range [start, end] into history[] used for fitting */
  fitRangeIndices: [number, number];
  /** R² goodness-of-fit */
  rSquared: number;
}

// ─── Full response ────────────────────────────────────────────────────────────

export interface SimulationResponse {
  material: string;
  initialLength: number;
  loadMass: number;
  /**
   * β – transient creep constant  [s^(-1/3)]
   * Slope of (Δl/l₀) vs t^(1/3) in the primary region.
   */
  beta: number;
  /**
   * k – viscous creep constant  [s^(-1)]
   * Slope of (Δl/l_t) vs t in the secondary region.
   */
  k: number;
  graph1Regression: RegressionLine;
  graph2Regression: RegressionLine;
  history: SimulationFrame[];
}