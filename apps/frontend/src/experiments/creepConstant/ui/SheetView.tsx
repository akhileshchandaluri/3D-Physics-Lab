import { useMemo } from 'react'
import {
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { fitTransientBeta, fitViscousK, readingFromLengths } from '../physics/creep'
import type { Lap } from '../sim/format'
import styles from './ui.module.css'

ChartJS.register(LineElement, PointElement, LinearScale, Tooltip, Legend)

interface SheetViewProps {
  laps: readonly Lap[]
  compact?: boolean
  fractured?: boolean
  elongationPercent?: number | null
}

export function SheetView({ laps, compact = false, fractured = false, elongationPercent = null }: SheetViewProps) {
  const rows = useMemo(
    () =>
      laps.map((lap) => ({
        ...lap,
        ...readingFromLengths(lap.timeSec, lap.l0Cm, lap.ltCm),
      })),
    [laps],
  )
  const timed = rows.filter((row) => row.timeSec > 0)
  const beta = fitTransientBeta(laps)
  const viscousK = fitViscousK(laps)

  const transient = {
    datasets: [
      {
        label: 'Δl/l₀',
        data: timed.map((row) => ({ x: row.tCubeRoot, y: row.deltaOverL0 })),
        borderColor: '#8a4b24',
        backgroundColor: '#8a4b24',
        pointRadius: compact ? 2 : 3,
        borderWidth: 1.5,
        tension: 0.15,
      },
    ],
  }
  const viscous = {
    datasets: [
      {
        label: 'Δl/lₜ',
        data: timed.map((row) => ({ x: row.timeSec, y: row.deltaOverLt })),
        borderColor: '#3d5c4a',
        backgroundColor: '#3d5c4a',
        pointRadius: compact ? 2 : 3,
        borderWidth: 1.5,
        tension: 0.15,
      },
    ],
  }

  return (
    <article className={compact ? styles.sheetCompact : styles.sheet}>
      <header className={styles.sheetHead}>
        <p>Observation sheet</p>
        <h2>Creep constant</h2>
      </header>
      {laps.length === 0 ? (
        <p className={styles.sheetEmpty}>
          Press Lap on the stopwatch. Each lap writes the time and the length of the wire.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th rowSpan={2}>S. No.</th>
                <th colSpan={2}>Time</th>
                <th rowSpan={2}>t^(1/3) (s^(1/3))</th>
                <th rowSpan={2}>lₜ (cm)</th>
                <th rowSpan={2}>Δl (cm)</th>
                <th rowSpan={2}>Δl/l₀</th>
                <th rowSpan={2}>Δl/lₜ</th>
              </tr>
              <tr>
                <th>t (min)</th>
                <th>t (sec)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.n}>
                  <td>{row.n}</td>
                  <td>{(row.timeSec / 60).toFixed(2)}</td>
                  <td>{row.timeSec.toFixed(1)}</td>
                  <td>{row.tCubeRoot.toFixed(3)}</td>
                  <td>{row.ltCm.toFixed(3)}</td>
                  <td>{row.deltaCm.toFixed(4)}</td>
                  <td>{row.deltaOverL0.toExponential(3)}</td>
                  <td>{row.deltaOverLt.toExponential(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.constant}>
        {beta === null
          ? 'β appears after four laps spread over time.'
          : `Transient creep constant β = ${beta.toExponential(3)}`}
      </p>
      <p className={styles.constant}>
        {viscousK === null
          ? 'k appears after four laps spread over time.'
          : `Viscous creep constant k = ${viscousK.toExponential(3)}`}
      </p>
      <p className={styles.sheetEmpty}>β = (Δl/l₀) / t^(1/3) &nbsp; k = (Δl/lₜ) / t</p>
      {fractured ? (
        <p className={styles.constant}>
          {elongationPercent == null
            ? 'The wire has fractured. Experiment complete.'
            : `Wire fractured at ${elongationPercent} percent elongation. Experiment complete.`}
        </p>
      ) : null}
      <div className={styles.charts}>
        <figure>
          <figcaption>Graph 1: Δl/l₀ against t^(1/3)</figcaption>
          <div className={compact ? styles.chartCompact : styles.chart}>
            {timed.length > 0 ? (
              <Line data={transient} options={chartOptions('t^(1/3) (s^(1/3))', 'Δl/l₀', compact)} />
            ) : (
              <p className={styles.sheetEmpty}>No timed readings yet.</p>
            )}
          </div>
        </figure>
        <figure>
          <figcaption>Graph 2: Δl/lₜ against t</figcaption>
          <div className={compact ? styles.chartCompact : styles.chart}>
            {timed.length > 0 ? (
              <Line data={viscous} options={chartOptions('t (sec)', 'Δl/lₜ', compact)} />
            ) : (
              <p className={styles.sheetEmpty}>No timed readings yet.</p>
            )}
          </div>
        </figure>
      </div>
    </article>
  )
}

function chartOptions(xLabel: string, yLabel: string, compact: boolean) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: !compact },
    },
    scales: {
      x: {
        type: 'linear' as const,
        title: { display: !compact, text: xLabel, color: '#5c5146' },
        ticks: { color: '#5c5146', maxTicksLimit: compact ? 4 : 6, font: { size: compact ? 9 : 11 } },
        grid: { color: 'rgba(43, 36, 28, 0.08)' },
      },
      y: {
        title: { display: !compact, text: yLabel, color: '#5c5146' },
        ticks: { color: '#5c5146', maxTicksLimit: 5, font: { size: compact ? 9 : 11 } },
        grid: { color: 'rgba(43, 36, 28, 0.08)' },
      },
    },
  }
}
