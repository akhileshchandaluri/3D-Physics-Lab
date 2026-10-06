import { G } from './materials'

export interface ExtensionInput {
  massKg: number
  lengthM: number
  diameterM: number
  youngsModulusPa: number
  /** Gauge length frozen at Start, metres. Creep is zero until this is set. */
  referenceLengthM: number
  beta: number
  viscousK: number
  elongationAtBreak: number
  creepTimeSec: number
}

export interface CreepReading {
  timeSec: number
  l0Cm: number
  ltCm: number
}

export function crossSectionArea(diameterM: number): number {
  return (Math.PI * diameterM * diameterM) / 4
}

export function stressPa(massKg: number, diameterM: number): number {
  if (massKg <= 0 || diameterM <= 0) return 0
  return (massKg * G) / crossSectionArea(diameterM)
}

/** Largest mass that stays at or under the yield stress. */
export function maxSafeMassKg(diameterM: number, yieldStressPa: number): number {
  if (diameterM <= 0 || yieldStressPa <= 0) return 0
  return (yieldStressPa * crossSectionArea(diameterM)) / G
}

export function wouldYield(massKg: number, diameterM: number, yieldStressPa: number): boolean {
  if (massKg <= 0) return false
  return stressPa(massKg, diameterM) > yieldStressPa
}

/** Instant elastic extension, metres. Zero when the wire is unloaded. */
export function elasticExtensionM(
  massKg: number,
  lengthM: number,
  diameterM: number,
  youngsModulusPa: number,
): number {
  if (massKg <= 0 || lengthM <= 0 || diameterM <= 0 || youngsModulusPa <= 0) return 0
  const force = massKg * G
  return (force * lengthM) / (crossSectionArea(diameterM) * youngsModulusPa)
}

/** Loaded lab time at which the creep strain reaches elongation at break. */
export const RUPTURE_LAB_SEC = 30 * 60

/**
 * Creep strain Δl / l₀.
 * Andrade's law until 70 percent of the half hour, then a rise that
 * reaches elongationAtBreak at 30 minutes.
 */
export function creepStrain(
  timeSec: number,
  beta: number,
  viscousK: number,
  elongationAtBreak: number,
): number {
  if (timeSec <= 0 || elongationAtBreak <= 0) return 0
  const andrade = (t: number) => beta * Math.cbrt(t) + viscousK * t
  const tSwitch = 0.7 * RUPTURE_LAB_SEC
  if (timeSec <= tSwitch) return andrade(timeSec)
  const eSwitch = andrade(tSwitch)
  const u = Math.min(1, (timeSec - tSwitch) / (RUPTURE_LAB_SEC - tSwitch))
  const smooth = u * u * (3 - 2 * u)
  return eSwitch + (elongationAtBreak - eSwitch) * smooth
}

/**
 * Creep extension after Start, centimetres.
 * Δl = l₀ times the creep strain, capped at the elongation at break.
 */
export function creepDeltaCm(
  l0Cm: number,
  beta: number,
  viscousK: number,
  creepTimeSec: number,
  elongationAtBreak: number,
): number {
  if (l0Cm <= 0 || creepTimeSec <= 0) return 0
  return l0Cm * Math.min(creepStrain(creepTimeSec, beta, viscousK, elongationAtBreak), elongationAtBreak)
}

export function totalExtensionM(input: ExtensionInput): number {
  const elastic = elasticExtensionM(input.massKg, input.lengthM, input.diameterM, input.youngsModulusPa)
  const creepM =
    creepDeltaCm(
      input.referenceLengthM * 100,
      input.beta,
      input.viscousK,
      input.creepTimeSec,
      input.elongationAtBreak,
    ) / 100
  return elastic + creepM
}

export function wireShouldBreak(
  creepTimeSec: number,
  beta: number,
  viscousK: number,
  elongationAtBreak: number,
  massKg: number,
  diameterM: number,
  ultimatePa: number,
): boolean {
  if (massKg > 0 && diameterM > 0 && stressPa(massKg, diameterM) > ultimatePa) return true
  return creepStrain(creepTimeSec, beta, viscousK, elongationAtBreak) >= elongationAtBreak - 1e-9
}

export function readingFromLengths(timeSec: number, l0Cm: number, ltCm: number): {
  deltaCm: number
  deltaOverL0: number
  deltaOverLt: number
  tCubeRoot: number
} {
  const deltaCm = ltCm - l0Cm
  return {
    deltaCm,
    deltaOverL0: l0Cm > 0 ? deltaCm / l0Cm : 0,
    deltaOverLt: ltCm > 0 ? deltaCm / ltCm : 0,
    tCubeRoot: timeSec > 0 ? Math.cbrt(timeSec) : 0,
  }
}

/**
 * Least-squares slope. Needs four readings after t = 0 that span at least
 * a factor of about two in time.
 */
export function fitSlope(
  points: readonly CreepReading[],
  xOf: (point: CreepReading) => number,
  yOf: (point: CreepReading) => number,
): number | null {
  const andradeEnd = 0.7 * RUPTURE_LAB_SEC
  const usable = points.filter(
    (point) => point.timeSec > 0 && point.timeSec <= andradeEnd && point.l0Cm > 0 && point.ltCm > 0,
  )
  if (usable.length < 4) return null
  const logs = usable.map((point) => Math.log10(point.timeSec))
  if (Math.max(...logs) - Math.min(...logs) < 0.3) return null

  const xs = usable.map(xOf)
  const ys = usable.map(yOf)
  return leastSquaresSlope(xs, ys)
}

export function fitTransientBeta(points: readonly CreepReading[]): number | null {
  return fitSlope(
    points,
    (point) => Math.cbrt(point.timeSec),
    (point) => readingFromLengths(point.timeSec, point.l0Cm, point.ltCm).deltaOverL0,
  )
}

export function fitViscousK(points: readonly CreepReading[]): number | null {
  return fitSlope(
    points,
    (point) => point.timeSec,
    (point) => readingFromLengths(point.timeSec, point.l0Cm, point.ltCm).deltaOverLt,
  )
}

function leastSquaresSlope(xs: number[], ys: number[]): number | null {
  const n = xs.length
  let sumX = 0
  let sumY = 0
  let sumXX = 0
  let sumXY = 0
  for (let i = 0; i < n; i++) {
    sumX += xs[i]
    sumY += ys[i]
    sumXX += xs[i] * xs[i]
    sumXY += xs[i] * ys[i]
  }
  const denom = n * sumXX - sumX * sumX
  if (denom <= 1e-18) return null
  return (n * sumXY - sumX * sumY) / denom
}
