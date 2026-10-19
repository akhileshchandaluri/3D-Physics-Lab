/**
 * Analytical physical equations for Young's Modulus by Uniform Bending Method.
 * All computations use standard SI units (meters, kilograms, seconds, Pascals)
 * and provide JSDoc documentation with mathematical formulas.
 */

/**
 * Standard acceleration due to gravity in m/s^2.
 */
export const ACCELERATION_GRAVITY = 9.81;

/**
 * Material specifications with true Young's modulus and yield strengths.
 */
export interface MaterialSpec {
  name: string;
  youngsModulusPa: number; // True Young's modulus Y in Pa
  yieldStrengthPa: number; // Yield strength in Pa
  defaultThicknessM: number; // Default thickness d in meters
  color: string; // Three.js material color
}

export type MaterialKey = 'steel' | 'brass' | 'aluminium' | 'wood';

export const MATERIALS: Record<MaterialKey, MaterialSpec> = {
  steel: {
    name: 'Steel',
    youngsModulusPa: 200e9, // 200 GPa
    yieldStrengthPa: 250e6, // 250 MPa
    defaultThicknessM: 0.003, // 3 mm
    color: '#94a3b8',
  },
  brass: {
    name: 'Brass',
    youngsModulusPa: 100e9, // 100 GPa
    yieldStrengthPa: 200e6, // 200 MPa
    defaultThicknessM: 0.003, // 3 mm
    color: '#eab308',
  },
  aluminium: {
    name: 'Aluminium',
    youngsModulusPa: 70e9, // 70 GPa
    yieldStrengthPa: 150e6, // 150 MPa
    defaultThicknessM: 0.003, // 3 mm
    color: '#cbd5e1',
  },
  wood: {
    name: 'Wood (Teak)',
    youngsModulusPa: 12e9, // 12 GPa
    yieldStrengthPa: 40e6, // 40 MPa
    defaultThicknessM: 0.008, // 8 mm (keeps elevation in measurable range)
    color: '#a16207',
  },
} as const;

/**
 * Standard geometric defaults for uniform bending apparatus in SI units.
 */
export const BEAM_GEOMETRY_DEFAULTS = {
  TOTAL_LENGTH_M: 1.0,
  SUPPORT_DISTANCE_L_M: 0.7, // Knife edge distance l = 0.70 m
  OVERHANG_A_M: 0.15, // Overhang distance a = 0.15 m
  BREADTH_B_M: 0.025, // Breadth b = 25 mm
  THICKNESS_D_M: 0.003, // Thickness d = 3 mm
  MASS_MIN_KG: 0.1, // 100 g
  MASS_MAX_KG: 0.5, // 500 g
  MASS_STEP_KG: 0.1, // 100 g steps
} as const;

/**
 * Calculates the second moment of area (area moment of inertia) I of a rectangular cross-section.
 * Formula: I = \frac{b d^3}{12}
 *
 * @param breadthM Breadth b in meters
 * @param thicknessM Thickness d in meters
 * @returns Area moment of inertia I in m^4
 */
export function areaMomentOfInertia(breadthM: number, thicknessM: number): number {
  if (breadthM <= 0 || thicknessM <= 0) return 0;
  return (breadthM * Math.pow(thicknessM, 3)) / 12.0;
}

/**
 * Calculates the constant bending moment between the two knife edges.
 * Formula: \tau = M g a
 *
 * @param massKg Suspended mass M at each overhang in kg
 * @param overhangM Distance a from knife edge to mass hanger in meters
 * @param g Acceleration due to gravity in m/s^2 (default 9.81)
 * @returns Bending moment in N*m
 */
export function bendingMoment(
  massKg: number,
  overhangM: number,
  g: number = ACCELERATION_GRAVITY
): number {
  if (massKg <= 0 || overhangM <= 0) return 0;
  return massKg * g * overhangM;
}

/**
 * Calculates the radius of curvature R of the bent beam between knife edges.
 * Formula: R = \frac{Y I}{M g a} = \frac{Y b d^3}{12 M g a}
 *
 * @param youngsModulusPa Young's modulus Y in Pa
 * @param breadthM Breadth b in meters
 * @param thicknessM Thickness d in meters
 * @param massKg Suspended mass M in kg
 * @param overhangM Overhang distance a in meters
 * @param g Acceleration due to gravity in m/s^2
 * @returns Radius of curvature R in meters (Infinity if mass is 0)
 */
export function radiusOfCurvature(
  youngsModulusPa: number,
  breadthM: number,
  thicknessM: number,
  massKg: number,
  overhangM: number,
  g: number = ACCELERATION_GRAVITY
): number {
  const tau = bendingMoment(massKg, overhangM, g);
  if (tau <= 0) return Infinity;
  const i = areaMomentOfInertia(breadthM, thicknessM);
  return (youngsModulusPa * i) / tau;
}

/**
 * Computes theoretical elevation (central rise) e of the beam between knife edges.
 *
 * Formulas:
 * e = \frac{l^2}{8 R} = \frac{3 M g a l^2}{2 b d^3 Y}
 *
 * @param massKg Suspended mass M at each overhang in kg
 * @param overhangM Overhang distance a in meters
 * @param supportDistanceM Knife-edge span distance l in meters
 * @param breadthM Beam breadth b in meters
 * @param thicknessM Beam thickness d in meters
 * @param youngsModulusPa Young's modulus Y in Pa
 * @param g Acceleration due to gravity in m/s^2
 * @returns Elevation e in meters
 */
export function centerElevation(
  massKg: number,
  overhangM: number,
  supportDistanceM: number,
  breadthM: number,
  thicknessM: number,
  youngsModulusPa: number,
  g: number = ACCELERATION_GRAVITY
): number {
  if (
    massKg <= 0 ||
    overhangM <= 0 ||
    supportDistanceM <= 0 ||
    breadthM <= 0 ||
    thicknessM <= 0 ||
    youngsModulusPa <= 0
  ) {
    return 0;
  }

  const numerator = 3.0 * massKg * g * overhangM * Math.pow(supportDistanceM, 2);
  const denominator = 2.0 * breadthM * Math.pow(thicknessM, 3) * youngsModulusPa;

  return numerator / denominator;
}

/**
 * Calculates Young's modulus Y from experimental parameters and measured elevation e.
 *
 * Formula:
 * Y = \frac{3 M g a l^2}{2 b d^3 e}
 *
 * @param massKg Suspended mass M in kg
 * @param overhangM Overhang distance a in meters
 * @param supportDistanceM Distance l between knife edges in meters
 * @param breadthM Breadth b in meters
 * @param thicknessM Thickness d in meters
 * @param elevationM Measured center elevation e in meters
 * @param g Acceleration due to gravity in m/s^2
 * @returns Young's modulus Y in Pa
 */
export function youngsModulusFromElevation(
  massKg: number,
  overhangM: number,
  supportDistanceM: number,
  breadthM: number,
  thicknessM: number,
  elevationM: number,
  g: number = ACCELERATION_GRAVITY
): number {
  if (
    massKg <= 0 ||
    overhangM <= 0 ||
    supportDistanceM <= 0 ||
    breadthM <= 0 ||
    thicknessM <= 0 ||
    elevationM <= 0
  ) {
    return 0;
  }

  const numerator = 3.0 * massKg * g * overhangM * Math.pow(supportDistanceM, 2);
  const denominator = 2.0 * breadthM * Math.pow(thicknessM, 3) * elevationM;

  return numerator / denominator;
}

/**
 * Calculates Young's modulus Y from the linear regression slope s = e / M.
 *
 * Formula:
 * s = \frac{e}{M} = \frac{3 g a l^2}{2 b d^3 Y} \implies Y = \frac{3 g a l^2}{2 b d^3 s}
 *
 * @param slopeMPerKg Regression slope s (meters per kg)
 * @param overhangM Overhang distance a in meters
 * @param supportDistanceM Distance l between knife edges in meters
 * @param breadthM Breadth b in meters
 * @param thicknessM Thickness d in meters
 * @param g Acceleration due to gravity in m/s^2
 * @returns Young's modulus Y in Pa
 */
export function youngsModulusFromSlope(
  slopeMPerKg: number,
  overhangM: number,
  supportDistanceM: number,
  breadthM: number,
  thicknessM: number,
  g: number = ACCELERATION_GRAVITY
): number {
  if (
    slopeMPerKg <= 0 ||
    overhangM <= 0 ||
    supportDistanceM <= 0 ||
    breadthM <= 0 ||
    thicknessM <= 0
  ) {
    return 0;
  }

  const numerator = 3.0 * g * overhangM * Math.pow(supportDistanceM, 2);
  const denominator = 2.0 * breadthM * Math.pow(thicknessM, 3) * slopeMPerKg;

  return numerator / denominator;
}

/**
 * Calculates maximum bending stress sigma in the outer fibres of the beam.
 * Formula: \sigma = \frac{\tau \cdot (d / 2)}{I} = \frac{6 M g a}{b d^2}
 *
 * @param massKg Suspended mass M in kg
 * @param overhangM Overhang distance a in meters
 * @param breadthM Breadth b in meters
 * @param thicknessM Thickness d in meters
 * @param g Acceleration due to gravity in m/s^2
 * @returns Maximum bending stress sigma in Pascals
 */
export function maxBendingStress(
  massKg: number,
  overhangM: number,
  breadthM: number,
  thicknessM: number,
  g: number = ACCELERATION_GRAVITY
): number {
  if (massKg <= 0 || overhangM <= 0 || breadthM <= 0 || thicknessM <= 0) return 0;
  return (6.0 * massKg * g * overhangM) / (breadthM * thicknessM * thicknessM);
}

/**
 * Clamps mass M to valid load hanger limits [0.1 kg, 0.5 kg].
 *
 * @param massKg Input mass in kg
 * @returns Clamped mass in kg and clamp flag
 */
export function clampMassKg(massKg: number): { clamped: number; wasClamped: boolean } {
  if (Number.isNaN(massKg) || !Number.isFinite(massKg)) {
    return { clamped: BEAM_GEOMETRY_DEFAULTS.MASS_MIN_KG, wasClamped: true };
  }
  if (massKg < BEAM_GEOMETRY_DEFAULTS.MASS_MIN_KG) {
    return { clamped: BEAM_GEOMETRY_DEFAULTS.MASS_MIN_KG, wasClamped: true };
  }
  if (massKg > BEAM_GEOMETRY_DEFAULTS.MASS_MAX_KG) {
    return { clamped: BEAM_GEOMETRY_DEFAULTS.MASS_MAX_KG, wasClamped: true };
  }
  return { clamped: massKg, wasClamped: false };
}
