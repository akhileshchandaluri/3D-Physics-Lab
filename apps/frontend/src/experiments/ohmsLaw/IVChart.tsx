import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface IVPoint {
  x: number;
  y: number;
}

interface IVChartProps {
  ivCurve: IVPoint[];
  resistance: number;
  temperature: number;
}

export function IVChart({ ivCurve, resistance, temperature }: IVChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        datasets: [
          {
            label: `Current temp (${temperature}°C)`,
            data: ivCurve,
            borderColor: '#8d1b2e',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            display: true,
            labels: { font: { size: 11 }, boxWidth: 12 },
          },
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Voltage (V)',
              font: { size: 11 },
            },
            min: 0,
            max: 24,
          },
          y: {
            title: {
              display: true,
              text: 'Current (mA)',
              font: { size: 11 },
            },
            min: 0,
          },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.data.datasets[0].data = ivCurve;
    chartRef.current.data.datasets[0].label =
      `Current temp (${temperature}°C)`;
    chartRef.current.update('none');
  }, [ivCurve, temperature, resistance]);

  return (
    <div style={{ position: 'relative', height: '220px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}