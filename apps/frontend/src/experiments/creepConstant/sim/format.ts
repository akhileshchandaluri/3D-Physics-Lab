/** Scientific duration of the run, in minutes. */
export const LAB_MINUTES = [15, 30, 45, 60] as const

/** Real seconds in which that lab length should finish. Null means the clock runs in real time. */
export const FINISH_SECONDS = [10, 20, 30, 60] as const

export const DEFAULT_LAB_MINUTES = 30
export const DEFAULT_FINISH_SECONDS = 10

export type LabMinutes = (typeof LAB_MINUTES)[number]
export type FinishSeconds = (typeof FINISH_SECONDS)[number] | null

/** Lab seconds advanced per real second. */
export function playbackRate(labMinutes: number, finishSeconds: FinishSeconds): number {
  if (finishSeconds == null) return 1
  return (labMinutes * 60) / finishSeconds
}

export interface Lap {
  n: number
  timeSec: number
  /** Gauge length frozen when the stopwatch started, centimetres. */
  l0Cm: number
  /** Instantaneous length at the lap, centimetres. */
  ltCm: number
}

/** Lab clock as minutes:seconds. Minutes keep growing past 59. */
export function formatLabTime(seconds: number): string {
  const safe = Math.max(0, seconds)
  const minutes = Math.floor(safe / 60)
  const whole = Math.floor(safe % 60)
  return `${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}`
}
