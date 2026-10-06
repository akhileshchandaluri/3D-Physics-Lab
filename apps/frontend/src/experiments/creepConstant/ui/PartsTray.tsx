import type { PointerEvent as ReactPointerEvent } from 'react'
import { MAX_SLOTS, METALS, SLOT_MASS_KG, type MetalId } from '../physics/materials'
import { PART_ORDER, nextPart, type Placed } from '../sim/assembly'
import styles from './ui.module.css'

interface PartsTrayProps {
  placed: Placed
  metalId: MetalId | null
  massKg: number
  dragId: string | null
  instruction: string
  rigReady: boolean
  onDragStart: (id: string, event: ReactPointerEvent<HTMLButtonElement>) => void
  onDisassemble: () => void
}

const STEPS: { id: string; label: string; detail: string; swatch: string }[] = [
  { id: 'clamp', label: 'Upper clamp', detail: 'Fits the cross-arm', swatch: '#8d939c' },
  { id: 'hook', label: 'Lower hook', detail: 'Free end of the wire', swatch: '#c4a574' },
  { id: 'scale', label: 'Millimetre scale', detail: 'Reads true extension', swatch: '#f4ecdc' },
  { id: 'watch', label: 'Stopwatch', detail: 'The only clock', swatch: '#1a1c1f' },
  { id: 'sheet', label: 'Observation sheet', detail: 'Blank until you lap', swatch: '#f7f1e4' },
  { id: 'hanger', label: 'Weight hanger', detail: 'Carries the slots', swatch: '#6e757d' },
]

export function PartsTray({
  placed,
  metalId,
  massKg,
  dragId,
  instruction,
  rigReady,
  onDragStart,
  onDisassemble,
}: PartsTrayProps) {
  const next = nextPart(placed)
  const stepNumber = next ? PART_ORDER.indexOf(next) + 1 : PART_ORDER.length
  const slotsLeft = MAX_SLOTS - Math.round(massKg / SLOT_MASS_KG)
  const anyPlaced = Object.values(placed).some(Boolean) || massKg > 0

  return (
    <aside className={styles.panel}>
      <p className={styles.kicker}>Step {rigReady ? 'done' : `${stepNumber} of ${PART_ORDER.length}`}</p>
      <h2 className={styles.heading}>Set up the stand</h2>
      <p className={styles.instruction}>{instruction}</p>

      {rigReady ? (
        <button
          type="button"
          data-part="weight"
          className={dragId === 'weight' ? styles.partActive : styles.part}
          disabled={slotsLeft <= 0}
          onPointerDown={(event) => onDragStart('weight', event)}
        >
          <span className={styles.swatch} style={{ background: '#4d545c' }} />
          <span>
            <strong>200 g weight</strong>
            <small>{slotsLeft} left on the tray. Drag it onto the hanger.</small>
          </span>
        </button>
      ) : (
        <ol className={styles.tray}>
          <TrayButton
            id="clamp"
            number={1}
            label="Upper clamp"
            detail="Fits the cross-arm"
            swatch="#8d939c"
            placed={placed.clamp}
            next={next === 'clamp'}
            dragId={dragId}
            onDragStart={onDragStart}
          />
          {next === 'wire' || placed.wire ? (
            <li className={styles.wireStep}>
              <p className={next === 'wire' ? styles.stepLabelOn : styles.stepLabel}>2. Choose the wire</p>
              <div className={styles.wires}>
                {METALS.map((metal) => (
                  <TrayButton
                    key={metal.id}
                    id={`wire:${metal.id}`}
                    label={metal.name}
                    detail={metal.id === 'lead' ? 'Workbook metal' : 'Another metal'}
                    swatch={metal.color}
                    placed={placed.wire && metalId === metal.id}
                    hidden={placed.wire && metalId !== metal.id}
                    next={next === 'wire' && metal.id === 'lead'}
                    dragId={dragId}
                    onDragStart={onDragStart}
                  />
                ))}
              </div>
            </li>
          ) : (
            <li className={styles.stepWaiting}>
              <span>2</span> Choose the wire
            </li>
          )}
          {STEPS.slice(1).map((step, index) => (
            <TrayButton
              key={step.id}
              id={step.id}
              number={index + 3}
              label={step.label}
              detail={step.detail}
              swatch={step.swatch}
              placed={placed[step.id as keyof Placed]}
              next={next === step.id}
              dragId={dragId}
              onDragStart={onDragStart}
            />
          ))}
        </ol>
      )}

      <button type="button" className={styles.secondary} disabled={!anyPlaced} onClick={onDisassemble}>
        Start again
      </button>
    </aside>
  )
}

function TrayButton({
  id,
  number,
  label,
  detail,
  swatch,
  placed,
  hidden,
  next,
  dragId,
  onDragStart,
}: {
  id: string
  number?: number
  label: string
  detail: string
  swatch: string
  placed: boolean
  hidden?: boolean
  next: boolean
  dragId: string | null
  onDragStart: (id: string, event: ReactPointerEvent<HTMLButtonElement>) => void
}) {
  if (hidden) return null
  const className = placed ? styles.partDone : dragId === id || next ? styles.partActive : styles.part
  const body = (
    <button
      type="button"
      data-part={id}
      className={className}
      disabled={placed}
      onPointerDown={(event) => onDragStart(id, event)}
    >
      {number ? <span className={styles.stepNo}>{number}</span> : null}
      <span className={styles.swatch} style={{ background: swatch }} />
      <span>
        <strong>{label}</strong>
        <small>{placed ? 'On the bench' : detail}</small>
      </span>
    </button>
  )
  if (number == null) return body
  return <li>{body}</li>
}
