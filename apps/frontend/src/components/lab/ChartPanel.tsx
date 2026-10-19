import { useMemo } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartPanelProps } from './types';
import styles from './ChartPanel.module.css';

// Register Chart.js components once at module initialization
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function getCssColor(variableName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value || fallback;
}

export function ChartPanel({
  title,
  xLabel,
  yLabel,
  datasets,
  fitLine,
  height = 320,
}: ChartPanelProps) {
  const textColor = getCssColor('--text-secondary', '#4b5563');
  const textPrimary = getCssColor('--text-primary', '#111827');
  const textMuted = getCssColor('--text-muted', '#9ca3af');
  const gridColor = getCssColor('--grid-line', 'rgba(0, 0, 0, 0.05)');
  const primaryColor = getCssColor('--primary-600', '#8d1b2e');

  const chartData = useMemo(() => {
    const list = datasets.map((ds, idx) => {
      const isScatter = ds.type === 'scatter';
      const color = ds.color || (idx === 0 ? primaryColor : idx === 1 ? '#10b981' : '#f59e0b');

      return {
        label: ds.label,
        data: ds.points.map((p) => ({ x: p.x, y: p.y })),
        showLine: !isScatter,
        borderColor: color,
        backgroundColor: color,
        pointRadius: isScatter ? 5 : 3,
        pointHoverRadius: 7,
        borderWidth: isScatter ? 0 : 2,
        tension: 0.1,
      };
    });

    if (fitLine) {
      const allX = datasets.flatMap((ds) => ds.points.map((p) => p.x));
      if (allX.length > 0) {
        let minX = Math.min(...allX);
        let maxX = Math.max(...allX);
        if (minX === maxX) {
          minX -= 1;
          maxX += 1;
        }

        list.push({
          label: 'Fit Line',
          data: [
            { x: minX, y: fitLine.slope * minX + fitLine.intercept },
            { x: maxX, y: fitLine.slope * maxX + fitLine.intercept },
          ],
          showLine: true,
          borderColor: '#e11d48',
          backgroundColor: '#e11d48',
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 2,
          tension: 0,
        });
      }
    }

    return { datasets: list };
  }, [datasets, fitLine, primaryColor]);

  const options: ChartOptions<'line'> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: datasets.length > 1 || !!fitLine,
          labels: {
            color: textColor,
            font: { size: 12 },
          },
        },
        tooltip: {
          enabled: true,
          backgroundColor: textPrimary,
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
        },
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: !!xLabel,
            text: xLabel,
            color: textColor,
            font: { size: 12, weight: 'bold' },
          },
          ticks: {
            color: textMuted,
            font: { size: 11 },
          },
          grid: {
            color: gridColor,
          },
        },
        y: {
          type: 'linear',
          title: {
            display: !!yLabel,
            text: yLabel,
            color: textColor,
            font: { size: 12, weight: 'bold' },
          },
          ticks: {
            color: textMuted,
            font: { size: 11 },
          },
          grid: {
            color: gridColor,
          },
        },
      },
    }),
    [xLabel, yLabel, textColor, textPrimary, textMuted, gridColor, datasets.length, fitLine]
  );

  return (
    <div className={styles.container}>
      {title && <h4 className={styles.title}>{title}</h4>}
      <div
        className={styles.chartWrap}
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
