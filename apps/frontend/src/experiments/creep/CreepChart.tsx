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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CreepChartProps {
  simulationData: any;
  materialType: string;
}

export function CreepChart({ simulationData, materialType }: CreepChartProps) {
  const graph1Data = useMemo(() => {
    if (!simulationData?.history) return null;

    const labels = simulationData.history.map((h: any) => h.timeOneThird.toFixed(2));
    const data = simulationData.history.map((h: any) => h.deltaLOverL0);

    return {
      labels,
      datasets: [
        {
          label: 'Δl/l₀ vs t^(1/3)',
          data,
          borderColor: '#e65100',
          backgroundColor: 'rgba(230, 81, 0, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [simulationData]);

  const graph2Data = useMemo(() => {
    if (!simulationData?.history) return null;

    const labels = simulationData.history.map((h: any) => h.timeSeconds.toFixed(0));
    const data = simulationData.history.map((h: any) => h.deltaLOverLt);

    return {
      labels,
      datasets: [
        {
          label: 'Δl/l_t vs t',
          data,
          borderColor: '#0d7ea0',
          backgroundColor: 'rgba(13, 126, 160, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [simulationData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: { size: 11 },
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          font: { size: 10 },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          font: { size: 10 },
        },
      },
    },
  };

  if (!simulationData) {
    return (
      <div className="creep-chart-placeholder">
        <span>Run simulation to view graphs</span>
      </div>
    );
  }

  return (
    <div className="creep-charts">
      <div className="creep-chart">
        <div className="creep-chart__title">Graph 1: Δl/l₀ vs t^(1/3)</div>
        <div className="creep-chart__canvas">
          {graph1Data && <Line data={graph1Data} options={chartOptions} />}
        </div>
        <div className="creep-chart__caption">
          Slope gives transient creep constant (β)
        </div>
      </div>
      <div className="creep-chart">
        <div className="creep-chart__title">Graph 2: Δl/l_t vs t</div>
        <div className="creep-chart__canvas">
          {graph2Data && <Line data={graph2Data} options={chartOptions} />}
        </div>
        <div className="creep-chart__caption">
          Slope gives viscous creep constant (k)
        </div>
      </div>
    </div>
  );
}
