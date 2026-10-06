import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DIAMETER_MM, LENGTH_M, MAX_SLOTS, SLOT_MASS_KG, getMetal, isMetalId, type MetalId } from './physics/materials'
import { creepDeltaCm, elasticExtensionM, maxSafeMassKg, stressPa, wouldYield } from './physics/creep'
import { emptyPlaced, hintFor, nextPart, type PartId, type Placed } from './sim/assembly'
import { createEngine, publish } from './sim/engine'
import {
  DEFAULT_FINISH_SECONDS,
  DEFAULT_LAB_MINUTES,
  FINISH_SECONDS,
  LAB_MINUTES,
  formatLabTime,
  playbackRate,
  type FinishSeconds,
  type LabMinutes,
  type Lap,
} from './sim/format'
import { LabScene } from './scene/LabScene'
import { PartsTray } from './ui/PartsTray'
import { SpecimenPanel } from './ui/SpecimenPanel'
import { SheetView } from './ui/SheetView'
import { LessonMenu, LessonReading, type LessonId } from './ui/Lesson'
import styles from './App.module.css'
import panelStyles from './ui/ui.module.css'

const AUTO_LAP_SEC = Array.from({ length: 1800 / 3 }, (_, index) => (index + 1) * 3)

interface DragState {
  id: string
  x: number
  y: number
  moved: boolean
}

interface CreepSavedState {
  metalId: MetalId | null
  lengthM: number
  diameterMm: number
  massKg: number
  placed: Placed
  lab: number
  creep: number
  fractured: boolean
  referenceLengthM: number | null
  labMinutes: LabMinutes
  finishSeconds: FinishSeconds
  autoLaps: boolean
  magnification: number
  manualLaps: Lap[]
}

interface CreepConstantProps {
  initialState?: unknown
  isReadOnly?: boolean
}

export function CreepConstant({ initialState, isReadOnly = false }: CreepConstantProps) {
  const [searchParams] = useSearchParams()
  const savedIdParam = searchParams.get('savedId')
  const engine = useRef(createEngine()).current
  const [placed, setPlaced] = useState<Placed>(emptyPlaced)
  const [metalId, setMetalId] = useState<MetalId | null>(null)
  const [massKg, setMassKg] = useState(0)
  const [lengthM, setLengthM] = useState(0.15)
  const [diameterMm, setDiameterMm] = useState(1)
  const [running, setRunning] = useState(false)
  const [labMinutes, setLabMinutes] = useState<LabMinutes>(DEFAULT_LAB_MINUTES)
  const [finishSeconds, setFinishSeconds] = useState<FinishSeconds>(DEFAULT_FINISH_SECONDS)
  const [laps, setLaps] = useState<Lap[]>([])
  const [magnification, setMagnification] = useState(80)
  const [banner, setBanner] = useState(hintFor('clamp', 0))
  const [yieldMessage, setYieldMessage] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dropHandled = useRef(false)
  const plaqueRef = useRef<HTMLDivElement>(null)
  const watchRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const fractureNoted = useRef(false)
  const digitsRef = useRef<HTMLDivElement>(null)
  const [cameraUnlocked, setCameraUnlocked] = useState(false)
  const [lesson, setLesson] = useState<LessonId>('aim')
  const [fractured, setFractured] = useState(false)
  const [autoLaps, setAutoLaps] = useState(true)
  const autoLapsRef = useRef(true)
  const lapsRef = useRef<Lap[]>([])
  const [saveTitle, setSaveTitle] = useState('My creep constant setup')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(savedIdParam)
  autoLapsRef.current = autoLaps
  lapsRef.current = laps
  const placedRef = useRef(placed)
  const massRef = useRef(massKg)
  const dragCleanup = useRef<(() => void) | null>(null)
  placedRef.current = placed
  massRef.current = massKg

  const next = nextPart(placed)
  const assembled = next === null

  useEffect(() => {
    let frame = 0
    const tick = () => {
      if (digitsRef.current) digitsRef.current.textContent = formatLabTime(engine.lab)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [engine])

  useEffect(() => {
    const onPublish = () => {
      const catchingBreak = engine.fractured && !fractureNoted.current
      if (
        autoLapsRef.current &&
        (engine.running || catchingBreak) &&
        engine.metalId &&
        engine.referenceLengthM != null
      ) {
        const taken = new Set(lapsRef.current.map((row) => row.timeSec))
        const due = AUTO_LAP_SEC.filter((sec) => engine.lab >= sec && !taken.has(sec))
        if (catchingBreak && !taken.has(engine.lab) && !due.includes(engine.lab)) due.push(engine.lab)
        if (due.length > 0) {
          const metal = getMetal(engine.metalId)
          const l0Cm = engine.referenceLengthM * 100
          const elasticCm =
            elasticExtensionM(engine.massKg, engine.lengthM, engine.diameterMm / 1000, metal.youngsModulusPa) * 100
          const additions = due.map((sec) => ({
            timeSec: sec,
            l0Cm,
            ltCm:
              engine.lengthM * 100 +
              elasticCm +
              creepDeltaCm(l0Cm, metal.beta, metal.viscousK, sec, metal.elongationAtBreak),
          }))
          const next = mergeLaps(lapsRef.current, additions)
          lapsRef.current = next
          setLaps(next)
        }
      }
      if (!engine.fractured || fractureNoted.current) return
      fractureNoted.current = true
      setFractured(true)
      setRunning(false)
      const broken = engine.metalId ? getMetal(engine.metalId) : null
      const percent = broken ? Math.round(broken.elongationAtBreak * 100) : null
      setBanner(
        percent == null
          ? 'The wire has fractured. Experiment complete.'
          : `Wire fractured at ${percent} percent elongation. Experiment complete.`,
      )
      if (!engine.metalId || engine.referenceLengthM == null) return
      const metal = getMetal(engine.metalId)
      const l0Cm = engine.referenceLengthM * 100
      const creepCm = creepDeltaCm(l0Cm, metal.beta, metal.viscousK, engine.creep, metal.elongationAtBreak)
      const elasticCm =
        elasticExtensionM(engine.massKg, engine.lengthM, engine.diameterMm / 1000, metal.youngsModulusPa) * 100
      const ltCm = engine.lengthM * 100 + elasticCm + creepCm
      if (!autoLapsRef.current) {
        const next = mergeLaps(lapsRef.current, [{ timeSec: engine.lab, l0Cm, ltCm }])
        lapsRef.current = next
        setLaps(next)
      }
    }
    engine.listeners.add(onPublish)
    return () => {
      engine.listeners.delete(onPublish)
    }
  }, [engine])

  function tryAttach(rawId: string) {
    dropHandled.current = true
    const current = placedRef.current
    const upcoming = nextPart(current)

    if (rawId === 'weight') {
      if (engine.fractured) {
        setBanner('The wire has fractured. Reset to run the experiment again.')
        setDrag(null)
        return
      }
      if (!current.hanger || !engine.metalId) {
        setBanner(hintFor(upcoming, massRef.current))
        setDrag(null)
        return
      }
      const slots = Math.round(massRef.current / SLOT_MASS_KG)
      if (slots >= MAX_SLOTS) {
        setBanner('The hanger holds ten 200 g weights.')
        setDrag(null)
        return
      }
      const metal = getMetal(engine.metalId)
      const nextMass = massRef.current + SLOT_MASS_KG
      const diameterM = engine.diameterMm / 1000
      if (stressPa(nextMass, diameterM) > metal.ultimatePa) {
        engine.massKg = nextMass
        massRef.current = nextMass
        setMassKg(nextMass)
        engine.fractured = true
        engine.running = false
        publish(engine)
        setDrag(null)
        return
      }
      if (wouldYield(nextMass, diameterM, metal.yieldStressPa)) {
        const limit = maxSafeMassKg(diameterM, metal.yieldStressPa)
        const message = `That load would yield the ${metal.name} wire. It yields above ${limit.toFixed(2)} kg.`
        setYieldMessage(message)
        setBanner(message)
        setDrag(null)
        return
      }
      engine.massKg = nextMass
      massRef.current = nextMass
      setMassKg(nextMass)
      setYieldMessage(null)
      setBanner(hintFor(upcoming, nextMass))
      setDrag(null)
      publish(engine)
      return
    }

    const part = rawId.startsWith('wire:') ? 'wire' : (rawId as PartId)
    if (part !== upcoming) {
      setBanner(hintFor(upcoming, massRef.current))
      setDrag(null)
      return
    }

    if (part === 'wire') {
      const picked = rawId.slice(5)
      if (!isMetalId(picked)) {
        setDrag(null)
        return
      }
      engine.metalId = picked
      setMetalId(picked)
    }

    const updated = { ...current, [part]: true }
    placedRef.current = updated
    setPlaced(updated)
    setBanner(hintFor(nextPart(updated), massRef.current))
    setDrag(null)
  }

  function beginDrag(id: string, event: ReactPointerEvent<HTMLButtonElement>) {
    if (isReadOnly) return
    if (event.currentTarget.disabled) return
    event.preventDefault()
    event.stopPropagation()
    dragCleanup.current?.()
    dropHandled.current = false
    const originX = event.clientX
    const originY = event.clientY
    setDrag({ id, x: originX, y: originY, moved: false })

    const move = (pointer: PointerEvent) => {
      const moved = Math.hypot(pointer.clientX - originX, pointer.clientY - originY) > 6
      setDrag((current) =>
        current && current.id === id
          ? { ...current, x: pointer.clientX, y: pointer.clientY, moved: current.moved || moved }
          : current,
      )
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      dragCleanup.current = null
      if (dropHandled.current) {
        dropHandled.current = false
        setDrag(null)
        return
      }
      setDrag((current) => {
        if (!current || current.id !== id) return current
        if (current.moved) {
          setBanner('Drop the part on the highlighted mount.')
          return null
        }
        return current
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    dragCleanup.current = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }

  function toggleRun() {
    const upcoming = nextPart(placedRef.current)
    if (upcoming) {
      setBanner(hintFor(upcoming, massRef.current))
      return
    }
    if (engine.fractured) {
      setBanner('The wire has fractured. Reset to run the experiment again.')
      setDrag(null)
      return
    }
    const starting = !engine.running
    if (starting && engine.referenceLengthM == null && engine.metalId) {
      const metal = getMetal(engine.metalId)
      const elastic = elasticExtensionM(
        engine.massKg,
        engine.lengthM,
        engine.diameterMm / 1000,
        metal.youngsModulusPa,
      )
      engine.referenceLengthM = engine.lengthM + elastic
    }
    engine.running = starting
    setRunning(engine.running)
  }

  function lap() {
    if (!engine.running || engine.fractured || !engine.metalId || engine.referenceLengthM == null) return
    const metal = getMetal(engine.metalId)
    const l0Cm = engine.referenceLengthM * 100
    const creepCm = creepDeltaCm(l0Cm, metal.beta, metal.viscousK, engine.creep, metal.elongationAtBreak)
    const elasticCm =
      elasticExtensionM(engine.massKg, engine.lengthM, engine.diameterMm / 1000, metal.youngsModulusPa) * 100
    const ltCm = engine.lengthM * 100 + elasticCm + creepCm
    const next = mergeLaps(lapsRef.current, [{ timeSec: engine.lab, l0Cm, ltCm }])
    lapsRef.current = next
    setLaps(next)
  }

  function applyPlayback(nextLab: LabMinutes, nextFinish: FinishSeconds) {
    engine.speed = playbackRate(nextLab, nextFinish)
    setLabMinutes(nextLab)
    setFinishSeconds(nextFinish)
  }

  function resetExperiment() {
    engine.lab = 0
    engine.creep = 0
    engine.running = false
    engine.massKg = 0
    engine.speed = playbackRate(labMinutes, finishSeconds)
    engine.referenceLengthM = null
    engine.fractured = false
    fractureNoted.current = false
    massRef.current = 0
    setRunning(false)
    setMassKg(0)
    setFractured(false)
    lapsRef.current = []
    setLaps([])
    setYieldMessage(null)
    publish(engine)
    setBanner(hintFor(nextPart(placedRef.current), 0))
  }

  function disassemble() {
    const cleared = emptyPlaced()
    placedRef.current = cleared
    massRef.current = 0
    engine.metalId = null
    engine.lab = 0
    engine.creep = 0
    engine.running = false
    engine.massKg = 0
    engine.speed = playbackRate(labMinutes, finishSeconds)
    engine.referenceLengthM = null
    engine.fractured = false
    fractureNoted.current = false
    setPlaced(cleared)
    setMetalId(null)
    setRunning(false)
    setMassKg(0)
    setFractured(false)
    lapsRef.current = []
    setLaps([])
    setYieldMessage(null)
    setDrag(null)
    publish(engine)
    setBanner(hintFor('clamp', 0))
  }

  function commitLength(value: number) {
    if (engine.running) return
    const clamped = Math.min(LENGTH_M.max, Math.max(LENGTH_M.min, value))
    engine.lengthM = clamped
    setLengthM(clamped)
  }

  function commitDiameter(value: number) {
    if (engine.running) return
    const clamped = Math.min(DIAMETER_MM.max, Math.max(DIAMETER_MM.min, value))
    if (engine.metalId && wouldYield(engine.massKg, clamped / 1000, getMetal(engine.metalId).yieldStressPa)) {
      const message = `That diameter is too small for the load already on the ${getMetal(engine.metalId).name} wire.`
      setYieldMessage(message)
      setBanner(message)
      return
    }
    engine.diameterMm = clamped
    setDiameterMm(clamped)
    setYieldMessage(null)
  }

  function removeWeight() {
    if (massRef.current < SLOT_MASS_KG) return
    const nextMass = massRef.current - SLOT_MASS_KG
    engine.massKg = nextMass
    massRef.current = nextMass
    setMassKg(nextMass)
    setYieldMessage(null)
    publish(engine)
  }

  function toggleMagnification() {
    const nextMag = engine.magnification === 80 ? 1 : 80
    engine.magnification = nextMag
    setMagnification(nextMag)
  }

  const applySaved = useCallback((state: CreepSavedState) => {
    const minutes = LAB_MINUTES.includes(state.labMinutes) ? state.labMinutes : DEFAULT_LAB_MINUTES
    const finish = state.finishSeconds == null || FINISH_SECONDS.includes(state.finishSeconds)
      ? state.finishSeconds
      : DEFAULT_FINISH_SECONDS
    engine.metalId = state.metalId
    engine.lengthM = state.lengthM
    engine.diameterMm = state.diameterMm
    engine.massKg = state.massKg
    engine.lab = state.lab
    engine.creep = state.creep
    engine.running = false
    engine.fractured = state.fractured
    engine.referenceLengthM = state.referenceLengthM
    engine.magnification = state.magnification
    engine.speed = playbackRate(minutes, finish)
    placedRef.current = state.placed
    massRef.current = state.massKg
    fractureNoted.current = state.fractured
    setPlaced(state.placed)
    setMetalId(state.metalId)
    setMassKg(state.massKg)
    setLengthM(state.lengthM)
    setDiameterMm(state.diameterMm)
    setRunning(false)
    setLabMinutes(minutes)
    setFinishSeconds(finish)
    setMagnification(state.magnification)
    setFractured(state.fractured)
    setAutoLaps(state.autoLaps)
    setBanner(hintFor(nextPart(state.placed), state.massKg))
    const rows = restoredLaps(state)
    lapsRef.current = rows
    setLaps(rows)
    publish(engine)
  }, [engine])

  useEffect(() => {
    if (isSavedState(initialState)) applySaved(initialState)
  }, [initialState, applySaved])

  useEffect(() => {
    if (!savedIdParam || initialState) return
    fetch(`/api/v1/experiments/${savedIdParam}`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { id?: string; title?: string; state?: unknown } | null) => {
        if (!data || !isSavedState(data.state)) return
        setCurrentSavedId(data.id ?? savedIdParam)
        if (data.title) setSaveTitle(data.title)
        applySaved(data.state)
        setSaveStatus('saved')
      })
      .catch(() => setSaveMessage('Could not open that saved session.'))
  }, [savedIdParam, initialState, applySaved])

  async function saveSetup() {
    if (isReadOnly) return
    const manualLaps = autoLaps ? [] : lapsRef.current
    const state: CreepSavedState = {
      metalId,
      lengthM,
      diameterMm,
      massKg,
      placed,
      lab: engine.lab,
      creep: engine.creep,
      fractured,
      referenceLengthM: engine.referenceLengthM,
      labMinutes,
      finishSeconds,
      autoLaps,
      magnification,
      manualLaps,
    }
    setSaveStatus('saving')
    setSaveMessage(null)
    const payload = { title: saveTitle.trim() || 'My creep constant setup', notes: '', state }
    const res = await fetch(currentSavedId ? `/api/v1/experiments/${currentSavedId}` : '/api/v1/experiments', {
      method: currentSavedId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(currentSavedId ? payload : { ...payload, experimentId: 'creep-constant' }),
    })
    if (!res.ok) {
      setSaveStatus('error')
      setSaveMessage('Could not save this session.')
      return
    }
    const data = (await res.json()) as { id?: string }
    if (!currentSavedId && data.id) setCurrentSavedId(data.id)
    setSaveStatus('saved')
    setSaveMessage('Session saved.')
  }

  return (
    <div
      className={styles.page}
      onPointerDown={(event) => {
        const target = event.target
        if (!(target instanceof Element)) return
        if (target.closest('[data-part]') || target.closest('canvas')) return
        setDrag(null)
      }}
    >
      <header className={styles.topBar}>
        <Link to="/dashboard">Back to the lab</Link>
        <div className={styles.topTitle}>
          <span>Session 05</span>
          <h1>Creep constant</h1>
        </div>
        {isReadOnly ? (
          <p className={styles.viewOnly}>This is a shared session. The setup can be viewed, not changed.</p>
        ) : (
          <div className={styles.saveRow}>
            <label>
              Session name
              <input value={saveTitle} onChange={(event) => setSaveTitle(event.target.value)} />
            </label>
            <button type="button" onClick={() => void saveSetup()}>
              {saveStatus === 'saving' ? 'Saving…' : 'Save session'}
            </button>
            {saveMessage ? <span>{saveMessage}</span> : null}
          </div>
        )}
      </header>
      <div className={styles.shell}>
        <LessonMenu current={lesson} onSelect={setLesson} />
        <div className={styles.shellMain}>
          {lesson === 'simulation' ? (
      <div className={styles.workspace}>
      <PartsTray
        placed={placed}
        metalId={metalId}
        massKg={massKg}
        dragId={drag?.id ?? null}
        instruction={banner}
        rigReady={assembled}
        onDragStart={beginDrag}
        onDisassemble={disassemble}
      />
      <div className={styles.stageColumn}>
      <div className={styles.stage}>
        <LabScene
          placed={placed}
          next={next}
          metalId={metalId}
          massKg={massKg}
          engine={engine}
          dragId={drag?.id ?? null}
          onAttach={tryAttach}
          plaqueRef={plaqueRef}
          watchRef={watchRef}
          sheetRef={sheetRef}
          cameraUnlocked={cameraUnlocked}
        />
        <button
          type="button"
          className={styles.cameraToggle}
          onClick={() => setCameraUnlocked((unlocked) => !unlocked)}
        >
          {cameraUnlocked ? 'Lock camera' : 'Unlock camera'}
        </button>
        <div ref={plaqueRef} className={styles.anchor}>
          <button type="button" className={panelStyles.plaque} onClick={toggleMagnification}>
            Display ×{magnification}
          </button>
        </div>
        {placed.watch ? (
          <div
            ref={watchRef}
            className={styles.anchor}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className={panelStyles.watch}>
              <div ref={digitsRef} className={panelStyles.digits}>
                {formatLabTime(0)}
              </div>
              <div className={panelStyles.watchRow}>
                <button type="button" disabled={!assembled} onClick={toggleRun}>
                  {running ? 'Pause' : 'Start'}
                </button>
                <button type="button" disabled={!running || autoLaps} onClick={lap}>
                  Lap
                </button>
                <button type="button" onClick={resetExperiment}>
                  Reset
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {placed.sheet ? (
          <div ref={sheetRef} className={`${styles.anchor} ${styles.sheetAnchor}`}>
            <SheetView
              laps={laps}
              compact
              fractured={fractured}
              elongationPercent={metalId ? Math.round(getMetal(metalId).elongationAtBreak * 100) : null}
            />
          </div>
        ) : null}
      </div>
      <section className={styles.results}>
        <h2>Your results</h2>
        <p className={styles.timeLabel}>Record readings</p>
        <div className={styles.choices}>
          <button
            type="button"
            className={autoLaps ? styles.choiceOn : undefined}
            onClick={() => setAutoLaps(true)}
          >
            Automatic
          </button>
          <button
            type="button"
            className={autoLaps ? undefined : styles.choiceOn}
            onClick={() => setAutoLaps(false)}
          >
            By hand
          </button>
        </div>
        <p className={styles.resultsLead}>
          {autoLaps
            ? 'Readings are taken for you every 3 seconds until 30 minutes, or until the wire breaks. Lap on the watch stays off.'
            : 'Press Lap on the watch. Four readings, spread over time, draw the two slopes.'}
        </p>
        <SheetView
          laps={laps}
          fractured={fractured}
          elongationPercent={metalId ? Math.round(getMetal(metalId).elongationAtBreak * 100) : null}
        />
      </section>
      </div>
      <div className={styles.side}>
      <section className={styles.timeCard}>
        <h2>Class time</h2>
        <p>The watch shows lab minutes. A 30 minute experiment can finish in 10 real seconds.</p>
        <p className={styles.timeLabel}>Lab length</p>
        <div className={styles.choices}>
          {LAB_MINUTES.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={minutes === labMinutes ? styles.choiceOn : undefined}
              onClick={() => applyPlayback(minutes, finishSeconds)}
            >
              {minutes} min
            </button>
          ))}
        </div>
        <p className={styles.timeLabel}>Finish in</p>
        <div className={styles.choices}>
          {FINISH_SECONDS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={seconds === finishSeconds ? styles.choiceOn : undefined}
              onClick={() => applyPlayback(labMinutes, seconds)}
            >
              {seconds === 60 ? '1 min' : `${seconds} s`}
            </button>
          ))}
          <button
            type="button"
            className={finishSeconds == null ? styles.choiceOn : undefined}
            onClick={() => applyPlayback(labMinutes, null)}
          >
            Real time
          </button>
        </div>
      </section>
      <SpecimenPanel
        engine={engine}
        metalId={metalId}
        massKg={massKg}
        lengthM={lengthM}
        diameterMm={diameterMm}
        running={running}
        yieldMessage={yieldMessage}
        onLength={commitLength}
        onDiameter={commitDiameter}
        onRemoveWeight={removeWeight}
      />
      </div>
      </div>
          ) : (
            <LessonReading section={lesson} />
          )}
        </div>
      </div>
      {drag ? (
        <div className={styles.ghost} style={{ left: drag.x, top: drag.y }}>
          {dragLabel(drag.id)}
        </div>
      ) : null}
    </div>
  )
}

function isSavedState(value: unknown): value is CreepSavedState {
  if (!value || typeof value !== 'object') return false
  const state = value as CreepSavedState
  return typeof state.lengthM === 'number'
    && typeof state.diameterMm === 'number'
    && typeof state.massKg === 'number'
    && typeof state.lab === 'number'
    && typeof state.creep === 'number'
    && typeof state.autoLaps === 'boolean'
    && !!state.placed
    && typeof state.placed === 'object'
}

function restoredLaps(state: CreepSavedState): Lap[] {
  if (!state.autoLaps || !state.metalId || state.referenceLengthM == null) return state.manualLaps ?? []
  const metal = getMetal(state.metalId)
  const l0Cm = state.referenceLengthM * 100
  const elasticCm = elasticExtensionM(state.massKg, state.lengthM, state.diameterMm / 1000, metal.youngsModulusPa) * 100
  const times = AUTO_LAP_SEC.filter((sec) => sec <= state.lab)
  if (state.fractured && !times.includes(state.lab)) times.push(state.lab)
  return times.map((sec, index) => ({
    n: index + 1,
    timeSec: sec,
    l0Cm,
    ltCm: state.lengthM * 100 + elasticCm + creepDeltaCm(l0Cm, metal.beta, metal.viscousK, sec, metal.elongationAtBreak),
  }))
}

function mergeLaps(rows: Lap[], additions: Omit<Lap, 'n'>[]): Lap[] {
  const merged = [...rows]
  for (const addition of additions) {
    if (merged.some((row) => row.timeSec === addition.timeSec)) continue
    merged.push({ n: 0, ...addition })
  }
  merged.sort((a, b) => a.timeSec - b.timeSec)
  return merged.map((row, index) => ({ ...row, n: index + 1 }))
}

function dragLabel(id: string): string {
  if (id.startsWith('wire:')) {
    const picked = id.slice(5)
    return isMetalId(picked) ? `${getMetal(picked).name} wire` : 'Wire'
  }
  if (id === 'weight') return '200 g weight'
  const labels: Record<string, string> = {
    clamp: 'Upper clamp',
    hook: 'Lower hook',
    scale: 'Millimetre scale',
    watch: 'Stopwatch',
    sheet: 'Observation sheet',
    hanger: 'Weight hanger',
  }
  return labels[id] ?? 'Part'
}
