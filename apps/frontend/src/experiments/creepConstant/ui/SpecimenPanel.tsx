import { useEffect, useState } from 'react'
import {
  DIAMETER_MM,
  LENGTH_M,
  getMetal,
  type MetalId,
} from '../physics/materials'
import {
  creepDeltaCm,
  elasticExtensionM,
  maxSafeMassKg,
  stressPa,
} from '../physics/creep'
import type { Engine } from '../sim/engine'
import styles from './ui.module.css'

interface SpecimenPanelProps {
  engine: Engine
  metalId: MetalId | null
  massKg: number
  lengthM: number
  diameterMm: number
  running: boolean
  yieldMessage: string | null
  onLength: (lengthM: number) => void
  onDiameter: (diameterMm: number) => void
  onRemoveWeight: () => void
}

export function SpecimenPanel({
  engine,
  metalId,
  massKg,
  lengthM,
  diameterMm,
  running,
  yieldMessage,
  onLength,
  onDiameter,
  onRemoveWeight,
}: SpecimenPanelProps) {
  const clock = useClock(engine)
  const metal = metalId ? getMetal(metalId) : null
  const diameterM = diameterMm / 1000
  const elasticCm = metal
    ? elasticExtensionM(massKg, lengthM, diameterM, metal.youngsModulusPa) * 100
    : 0
  const l0Cm = engine.referenceLengthM != null ? engine.referenceLengthM * 100 : null
  const creepCm = metal
    ? creepDeltaCm(l0Cm ?? 0, metal.beta, metal.viscousK, clock.creep, metal.elongationAtBreak)
    : 0
  const stressMpa = metal ? stressPa(massKg, diameterM) / 1e6 : 0
  const maxKg = metal ? maxSafeMassKg(diameterM, metal.yieldStressPa) : null

  return (
    <aside className={`${styles.panel} ${styles.panelRight}`}>
      <p className={styles.kicker}>Readings</p>
      <h2 className={styles.heading}>What the numbers mean</h2>
      <p className={styles.note}>
        The load stretches the wire at once. After you press Start, it keeps lengthening slowly. That slow part is creep.
      </p>

      <dl className={styles.facts}>
        <div>
          <dt>Metal</dt>
          <dd>{metal ? metal.name : 'Not hung yet'}</dd>
          <p>The wire you hung from the clamp.</p>
        </div>
        <div>
          <dt>Load</dt>
          <dd>{(massKg * 1000).toFixed(0)} g</dd>
          <p>The steady weight on the hanger. The workbook uses 200 g.</p>
        </div>
        <div>
          <dt>Stress</dt>
          <dd>{metal ? `${stressMpa.toFixed(2)} MPa` : '—'}</dd>
          <p>The load divided by the cross-section of the wire.</p>
        </div>
        <div>
          <dt>Young’s modulus</dt>
          <dd>{metal ? `${(metal.youngsModulusPa / 1e9).toFixed(0)} GPa` : '—'}</dd>
          <p>How stiff the metal is. A stiffer metal stretches less at once.</p>
        </div>
        <div>
          <dt>l₀</dt>
          <dd>{l0Cm == null ? '—' : `${l0Cm.toFixed(3)} cm`}</dd>
          <p>The length when Start is pressed. It stays fixed for the whole run.</p>
        </div>
        <div>
          <dt>Δl</dt>
          <dd>{metal ? `${creepCm.toFixed(4)} cm` : '—'}</dd>
          <p>How much the wire has crept since Start.</p>
        </div>
        <div>
          <dt>lₜ</dt>
          <dd>{metal ? `${(lengthM * 100 + elasticCm + creepCm).toFixed(3)} cm` : '—'}</dd>
          <p>The length now: the original length, the instant stretch, and the creep.</p>
        </div>
        <div>
          <dt>Yields above</dt>
          <dd>{maxKg === null ? '—' : `${(maxKg * 1000).toFixed(0)} g`}</dd>
          <p>A heavier load than this would bend the wire at once.</p>
        </div>
      </dl>

      <label className={styles.field}>
        Length
        <span>
          <input
            type="number"
            min={LENGTH_M.min * 100}
            max={LENGTH_M.max * 100}
            step={0.5}
            value={Number((lengthM * 100).toFixed(2))}
            disabled={running}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) onLength(value / 100)
            }}
          />
          cm
        </span>
      </label>
      <label className={styles.field}>
        Diameter
        <span>
          <input
            type="number"
            min={DIAMETER_MM.min}
            max={DIAMETER_MM.max}
            step={0.01}
            value={diameterMm}
            disabled={running}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) onDiameter(value)
            }}
          />
          mm
        </span>
      </label>

      <button type="button" className={styles.secondary} disabled={massKg <= 0} onClick={onRemoveWeight}>
        Take off one weight
      </button>

      {yieldMessage ? <p className={styles.yield}>{yieldMessage}</p> : null}

      <p className={styles.formula}>Δl = l₀ (β t^(1/3) + k t)</p>
      <p className={styles.note}>
        β is the slope of Δl/l₀ against t^(1/3). k is the slope of Δl/lₜ against t. Lap every 3 to 5 minutes so those slopes can be drawn.
      </p>
    </aside>
  )
}

function useClock(engine: Engine): { lab: number; creep: number } {
  const [clock, setClock] = useState({ lab: engine.lab, creep: engine.creep })
  useEffect(() => {
    const listener = (snapshot: { lab: number; creep: number }) => setClock(snapshot)
    engine.listeners.add(listener)
    listener({ lab: engine.lab, creep: engine.creep })
    return () => {
      engine.listeners.delete(listener)
    }
  }, [engine])
  return clock
}
