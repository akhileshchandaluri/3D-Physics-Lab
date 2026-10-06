import type { MetalId } from '../physics/materials'
import { getMetal } from '../physics/materials'
import { stressPa, wireShouldBreak } from '../physics/creep'
import { RUPTURE_LAB_SEC } from '../physics/creep'
import { playbackRate, DEFAULT_FINISH_SECONDS, DEFAULT_LAB_MINUTES } from './format'

export interface ClockSnapshot {
  lab: number
  creep: number
}

export interface Engine {
  lab: number
  creep: number
  running: boolean
  speed: number
  massKg: number
  lengthM: number
  diameterMm: number
  metalId: MetalId | null
  /** Length at the moment Start is pressed, metres. Includes the elastic stretch already present. */
  referenceLengthM: number | null
  fractured: boolean
  magnification: number
  lastNotify: number
  listeners: Set<(snapshot: ClockSnapshot) => void>
}

export function createEngine(): Engine {
  return {
    lab: 0,
    creep: 0,
    running: false,
    speed: playbackRate(DEFAULT_LAB_MINUTES, DEFAULT_FINISH_SECONDS),
    massKg: 0,
    lengthM: 0.15,
    diameterMm: 1,
    metalId: null,
    referenceLengthM: null,
    fractured: false,
    magnification: 80,
    lastNotify: 0,
    listeners: new Set(),
  }
}

export function publish(engine: Engine): void {
  const snapshot = { lab: engine.lab, creep: engine.creep }
  engine.listeners.forEach((listener) => listener(snapshot))
}

/** Advance lab time. Creep time moves only while the hanger carries a load. */
export function advanceEngine(engine: Engine, dtSec: number, nowMs: number): void {
  let justBroke = false
  if (engine.running && !engine.fractured) {
    const step = Math.min(Math.max(dtSec, 0), 0.05) * engine.speed
    if (engine.massKg > 0) {
      engine.lab += step
      engine.creep += step
      const metal = engine.metalId ? getMetal(engine.metalId) : null
      if (
        metal &&
        wireShouldBreak(
          engine.creep,
          metal.beta,
          metal.viscousK,
          metal.elongationAtBreak,
          engine.massKg,
          engine.diameterMm / 1000,
          metal.ultimatePa,
        )
      ) {
        const overloaded = stressPa(engine.massKg, engine.diameterMm / 1000) > metal.ultimatePa
        if (!overloaded) {
          engine.creep = RUPTURE_LAB_SEC
          engine.lab = RUPTURE_LAB_SEC
        }
        engine.fractured = true
        engine.running = false
        justBroke = true
      }
    }
  }
  if (nowMs - engine.lastNotify >= 100 || justBroke) {
    engine.lastNotify = nowMs
    publish(engine)
  }
}
