import type { TravellingMicroscopeReading } from '../sim/types';
import styles from './ui.module.css';

interface MicroscopeReadoutProps {
  reading: TravellingMicroscopeReading;
  massKg: number;
  loadingMode: 'loading' | 'unloading';
  onRecord: () => void;
  isReadOnly?: boolean;
}

/**
 * Travelling microscope readout widget with Main Scale + Vernier breakdown.
 * Least count LC = 0.01 mm.
 */
export function MicroscopeReadout({
  reading,
  massKg,
  loadingMode,
  onRecord,
  isReadOnly = false,
}: MicroscopeReadoutProps) {
  const lcMm = 0.01;
  const vernierFractionMm = (reading.vernierDiv * lcMm).toFixed(2);

  return (
    <div className={styles.microscopeWidget}>
      <div className={styles.dimensionHeader}>
        <span className={styles.dimensionTitle}>
          Travelling Microscope Readout (Centre Elevation)
        </span>
        <span className={styles.badge}>LC: 0.01 mm</span>
      </div>

      <div className={styles.readoutGrid}>
        <div className={styles.readoutCell}>
          <span className={styles.readoutLabel}>Main Scale Reading (MSR)</span>
          <span className={styles.readoutValue}>{reading.mainScaleMm} mm</span>
        </div>

        <div className={styles.readoutCell}>
          <span className={styles.readoutLabel}>Vernier Div (VSR)</span>
          <span className={styles.readoutValue}>{reading.vernierDiv} div</span>
          <span className={styles.readoutLabel}>= {vernierFractionMm} mm</span>
        </div>

        <div className={styles.readoutCell}>
          <span className={styles.readoutLabel}>Total Elevation (e)</span>
          <span className={`${styles.readoutValue} ${styles.highlightValue}`}>
            {reading.totalMm.toFixed(2)} mm
          </span>
        </div>
      </div>

      {/* Simulated Vernier Scale Visualizer */}
      <svg
        viewBox="0 0 300 45"
        style={{
          width: '100%',
          height: '45px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        }}
      >
        {/* Main scale lines */}
        <line x1="10" y1="20" x2="290" y2="20" stroke="var(--text-muted)" strokeWidth="1" />
        {Array.from({ length: 29 }).map((_, i) => {
          const x = 10 + i * 10;
          const isMajor = i % 5 === 0;
          return (
            <g key={`ms-${i}`}>
              <line
                x1={x}
                y1={isMajor ? 8 : 14}
                x2={x}
                y2="20"
                stroke="var(--text-secondary)"
                strokeWidth={isMajor ? 1.5 : 1}
              />
              {isMajor && (
                <text
                  x={x}
                  y="7"
                  fontSize="7"
                  textAnchor="middle"
                  fill="var(--text-muted)"
                >
                  {i}
                </text>
              )}
            </g>
          );
        })}

        {/* Vernier scale indicator */}
        <g transform={`translate(${Math.min(240, 20 + reading.vernierDiv * 2.2)}, 20)`}>
          <polygon points="0,0 -5,12 5,12" fill="var(--primary-600)" />
          {Array.from({ length: 11 }).map((_, vi) => (
            <line
              key={`vs-${vi}`}
              x1={vi * 4}
              y1="0"
              x2={vi * 4}
              y2={vi % 5 === 0 ? 10 : 6}
              stroke="var(--primary-600)"
              strokeWidth="1"
            />
          ))}
        </g>
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Target: <strong>{(massKg * 1000).toFixed(0)} g</strong> ({loadingMode === 'loading' ? 'Loading ↑' : 'Unloading ↓'})
        </span>
        <button
          type="button"
          onClick={onRecord}
          disabled={isReadOnly}
          className={`${styles.button} ${styles.primaryButton}`}
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          Record Observation
        </button>
      </div>
    </div>
  );
}
