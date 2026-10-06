export const G = 9.80665

export type MetalId = 'steel' | 'copper' | 'brass' | 'aluminium' | 'lead'

export interface Metal {
  id: MetalId
  name: string
  /** Young's modulus, pascals. */
  youngsModulusPa: number
  /** Tensile yield stress, pascals. */
  yieldStressPa: number
  /** Transient creep constant in Andrade's law, per s^(1/3). */
  beta: number
  /** Viscous creep constant in Andrade's law, per second. */
  viscousK: number
  /** Tensile strength, pascals. The wire snaps if the stress exceeds this. */
  ultimatePa: number
  /** Elongation at break, Δl / l₀. Lead at 20°C is 0.31. */
  elongationAtBreak: number
  color: string
}

export const METALS: readonly Metal[] = [
  {
    id: 'steel',
    name: 'Mild steel',
    youngsModulusPa: 205e9,
    yieldStressPa: 250e6,
    beta: 2e-6,
    viscousK: 1e-8,
    ultimatePa: 440e6,
    elongationAtBreak: 0.25,
    color: '#c5c9d0',
  },
  {
    id: 'copper',
    name: 'Copper',
    youngsModulusPa: 110e9,
    yieldStressPa: 33.3e6,
    beta: 8e-6,
    viscousK: 4e-8,
    ultimatePa: 210e6,
    elongationAtBreak: 0.6,
    color: '#b87333',
  },
  {
    id: 'brass',
    name: 'Brass',
    youngsModulusPa: 110e9,
    yieldStressPa: 145e6,
    beta: 1.2e-5,
    viscousK: 6e-8,
    ultimatePa: 365e6,
    elongationAtBreak: 0.53,
    color: '#d4a017',
  },
  {
    id: 'aluminium',
    name: 'Aluminium',
    youngsModulusPa: 69e9,
    yieldStressPa: 34.5e6,
    beta: 3e-5,
    viscousK: 1.5e-7,
    ultimatePa: 89.6e6,
    elongationAtBreak: 0.35,
    color: '#d5dbe3',
  },
  {
    id: 'lead',
    name: 'Soldering lead',
    youngsModulusPa: 16e9,
    yieldStressPa: 12e6,
    beta: 4.11e-4,
    viscousK: 2.78e-6,
    ultimatePa: 13.2e6,
    elongationAtBreak: 0.31,
    color: '#8d9096',
  },
]

/** Cut length of the specimen, metres. The workbook uses 15 cm. */
export const LENGTH_M = { min: 0.1, max: 0.5 }
export const DIAMETER_MM = { min: 0.2, max: 1.5 }
/** One workbook load. */
export const SLOT_MASS_KG = 0.2
export const MAX_SLOTS = 10

const BY_ID = new Map(METALS.map((metal) => [metal.id, metal]))

export function getMetal(id: MetalId): Metal {
  const metal = BY_ID.get(id)
  if (!metal) throw new Error(`Unknown metal: ${id}`)
  return metal
}

export function isMetalId(value: string): value is MetalId {
  return BY_ID.has(value as MetalId)
}
