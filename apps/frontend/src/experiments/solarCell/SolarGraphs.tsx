import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { SolarCellResult } from '../../../../backend/src/experiments/solarCell/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface SolarGraphsProps {
  simulationResult: SolarCellResult;
  livePointVoltage: number;
  livePointCurrent: number;
}

export function SolarGraphs({
  simulationResult,
  livePointVoltage,
  livePointCurrent,
}: SolarGraphsProps) {
  const ivData = useMemo(() => ({
    labels: simulationResult.ivCurve.map((point) => point.voltage.toFixed(2)),
    datasets: [
      {
        label: 'I-V Characteristics',
        data: simulationResult.ivCurve.map((point) => point.current),
        borderColor: '#0d7ea0',
        backgroundColor: 'rgba(13, 126, 160, 0.12)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Operating Point',
        data: simulationResult.ivCurve.map((point) =>
          Math.abs(point.voltage - livePointVoltage) < 0.005 ? livePointCurrent : null,
        ),
        borderColor: '#e65100',
        backgroundColor: '#e65100',
        showLine: false,
        pointRadius: 5,
      },
    ],
  }), [simulationResult, livePointVoltage, livePointCurrent]);

  const pvData = useMemo(() => ({
    labels: simulationResult.pvCurve.map((point) => point.voltage.toFixed(2)),
    datasets: [
      {
        label: 'P-V Characteristics',
        data: simulationResult.pvCurve.map((point) => point.power),
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.12)',
        tension: 0.3,
        fill: true,
      },
    ],
  }), [simulationResult]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
    },
  };

  return (
    <div className="solar-graphs">
      <div className="creep-chart">
        <div className="creep-chart__title">I-V Characteristics Graph</div>
        <div className="creep-chart__canvas">
          <Line data={ivData} options={options} />
        </div>
      </div>
      <div className="creep-chart">
        <div className="creep-chart__title">P-V Characteristics Graph</div>
        <div className="creep-chart__canvas">
          <Line data={pvData} options={options} />
        </div>
      </div>
    </div>
  );
}
