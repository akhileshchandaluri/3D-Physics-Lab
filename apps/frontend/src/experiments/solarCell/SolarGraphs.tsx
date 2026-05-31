import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { SolarObservation } from '../../hooks/useSolarCell';
import { computeGraphMetrics, sortReadingsByVoltage } from './solarGraphUtils';

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface SolarGraphsProps {
  readings: SolarObservation[];
  showData: boolean;
  compact?: boolean;
}

function GraphPlaceholder({ message }: { message: string }) {
  return (
    <div className="solar-graph-placeholder">
      <span className="solar-graph-placeholder__icon">📈</span>
      <p>{message}</p>
    </div>
  );
}

export function SolarGraphs({ readings, showData, compact = false }: SolarGraphsProps) {
  const sorted = useMemo(() => sortReadingsByVoltage(readings), [readings]);
  const metrics = useMemo(() => computeGraphMetrics(readings), [readings]);

  const ivChart = useMemo(() => {
    if (!showData || !metrics) return null;

    const linePoints = sorted.map((r) => ({ x: r.voltage, y: r.current }));

    return {
      datasets: [
        {
          label: 'I–V curve',
          data: linePoints,
          borderColor: '#1e293b',
          backgroundColor: 'rgba(30, 41, 59, 0.06)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#0d7ea0',
        },
        {
          label: `Isc (${metrics.isc.current.toFixed(3)} A)`,
          data: [{ x: metrics.isc.voltage, y: metrics.isc.current }],
          borderColor: '#1565c0',
          backgroundColor: '#1565c0',
          showLine: false,
          pointRadius: 7,
          pointStyle: 'triangle' as const,
        },
        {
          label: `Voc (${metrics.voc.voltage.toFixed(3)} V)`,
          data: [{ x: metrics.voc.voltage, y: metrics.voc.current }],
          borderColor: '#c62828',
          backgroundColor: '#c62828',
          showLine: false,
          pointRadius: 7,
          pointStyle: 'rectRot' as const,
        },
        {
          label: `MPP (${metrics.mpp.voltage.toFixed(3)} V, ${metrics.mpp.current.toFixed(3)} A)`,
          data: [{ x: metrics.mpp.voltage, y: metrics.mpp.current }],
          borderColor: '#e65100',
          backgroundColor: '#e65100',
          showLine: false,
          pointRadius: 8,
          pointStyle: 'star' as const,
        },
      ],
    };
  }, [showData, metrics, sorted]);

  const pvChart = useMemo(() => {
    if (!showData || !metrics) return null;

    return {
      datasets: [
        {
          label: 'P–V curve',
          data: sorted.map((r) => ({ x: r.voltage, y: r.power })),
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.12)',
          borderWidth: 2,
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
        {
          label: `Pmax (${metrics.mpp.power.toFixed(3)} W)`,
          data: [{ x: metrics.mpp.voltage, y: metrics.mpp.power }],
          borderColor: '#e65100',
          backgroundColor: '#e65100',
          showLine: false,
          pointRadius: 8,
        },
      ],
    };
  }, [showData, metrics, sorted]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      parsing: false as const,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: { boxWidth: 10, font: { size: compact ? 9 : 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { parsed: { x: number; y: number }; dataset: { label?: string } }) =>
              `${ctx.dataset.label}: (${ctx.parsed.x.toFixed(3)}, ${ctx.parsed.y.toFixed(3)})`,
          },
        },
      },
    }),
    [compact],
  );

  const ivOptions = useMemo(
    () => ({
      ...chartOptions,
      scales: {
        x: {
          type: 'linear' as const,
          title: { display: true, text: 'Voltage V (V)', font: { weight: 'bold' as const } },
          min: 0,
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          type: 'linear' as const,
          title: { display: true, text: 'Current i (A)', font: { weight: 'bold' as const } },
          min: 0,
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }),
    [chartOptions],
  );

  const pvOptions = useMemo(
    () => ({
      ...chartOptions,
      scales: {
        x: {
          type: 'linear' as const,
          title: { display: true, text: 'Voltage V (V)' },
          min: 0,
        },
        y: {
          type: 'linear' as const,
          title: { display: true, text: 'Power P (W)' },
          min: 0,
        },
      },
    }),
    [chartOptions],
  );

  if (!showData) {
    return (
      <div className={`solar-graphs${compact ? ' solar-graphs--compact' : ''}`}>
        <GraphPlaceholder message="No data yet. Complete the simulation, record readings at different loads, then click Complete Simulation." />
      </div>
    );
  }

  if (readings.length < 3) {
    return (
      <div className={`solar-graphs${compact ? ' solar-graphs--compact' : ''}`}>
        <GraphPlaceholder message="Record at least 3 readings at different load values, then complete the simulation to plot the I–V curve." />
      </div>
    );
  }

  if (!ivChart || !pvChart || !metrics) {
    return (
      <div className={`solar-graphs${compact ? ' solar-graphs--compact' : ''}`}>
        <GraphPlaceholder message="Unable to plot graph from current readings." />
      </div>
    );
  }

  return (
    <div className={`solar-graphs${compact ? ' solar-graphs--compact' : ''}`}>
      <div className="solar-graph-metrics-bar">
        <span>Voc = {metrics.voc.voltage.toFixed(3)} V</span>
        <span>Isc = {metrics.isc.current.toFixed(3)} A</span>
        <span>Vmp = {metrics.mpp.voltage.toFixed(3)} V</span>
        <span>Imp = {metrics.mpp.current.toFixed(3)} A</span>
        <span className="solar-graph-metrics-bar__ff">
          Fill factor N = {metrics.fillFactor.toFixed(3)}
        </span>
      </div>

      <div className="creep-chart solar-graph-chart--iv">
        <div className="creep-chart__title">I–V Characteristics (measured)</div>
        <div className={`creep-chart__canvas${compact ? ' creep-chart__canvas--compact' : ' creep-chart__canvas--large'}`}>
          <Line data={ivChart} options={ivOptions} />
        </div>
        <div className="creep-chart__caption">
          Model-style plot: current vs voltage with Isc, Voc, and maximum power point (Vmp, Imp).
        </div>
      </div>

      <div className="creep-chart">
        <div className="creep-chart__title">P–V Characteristics (measured)</div>
        <div className={`creep-chart__canvas${compact ? ' creep-chart__canvas--compact' : ''}`}>
          <Line data={pvChart} options={pvOptions} />
        </div>
      </div>
    </div>
  );
}
