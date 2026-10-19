import { mean } from '../../../lib/stats';
import styles from './ui.module.css';

interface DimensionInspectionProps {
  breadthTrials: number[];
  thicknessTrials: number[];
  onAddBreadthTrial: () => void;
  onAddThicknessTrial: () => void;
  supportDistanceM: number;
  overhangM: number;
  onSupportDistanceChange: (valM: number) => void;
  onOverhangChange: (valM: number) => void;
  isReadOnly?: boolean;
}

/**
 * Inspection widget for apparatus dimensions:
 * Vernier Caliper for breadth b (LC 0.02 mm),
 * Screw Gauge for thickness d (LC 0.01 mm),
 * Metre scale for span l and overhang a.
 */
export function DimensionInspection({
  breadthTrials,
  thicknessTrials,
  onAddBreadthTrial,
  onAddThicknessTrial,
  supportDistanceM,
  overhangM,
  onSupportDistanceChange,
  onOverhangChange,
  isReadOnly = false,
}: DimensionInspectionProps) {
  const meanBreadthMm = mean(breadthTrials);
  const meanThicknessMm = mean(thicknessTrials);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h4 className={styles.panelTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
            <path d="m14.5 12.5 2-2" />
            <path d="m11.5 9.5 2-2" />
            <path d="m8.5 6.5 2-2" />
          </svg>
          Dimensions & Instrumental Observations
        </h4>
      </div>

      <div className={styles.formGrid}>
        {/* Vernier Caliper (Breadth b) */}
        <div className={styles.dimensionCard}>
          <div className={styles.dimensionHeader}>
            <span className={styles.dimensionTitle}>Breadth (b) — Vernier Caliper</span>
            <span className={styles.badge}>LC: 0.02 mm</span>
          </div>

          <table className={styles.trialsTable}>
            <thead>
              <tr>
                <th>Trial</th>
                <th>Reading (mm)</th>
              </tr>
            </thead>
            <tbody>
              {breadthTrials.map((val, idx) => (
                <tr key={idx}>
                  <td>Trial #{idx + 1}</td>
                  <td><strong>{val.toFixed(2)}</strong> mm</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Mean b: <strong>{meanBreadthMm.toFixed(2)} mm</strong> ({(meanBreadthMm * 1e-3).toFixed(5)} m)
            </span>
            <button
              type="button"
              className={styles.button}
              onClick={onAddBreadthTrial}
              disabled={isReadOnly}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              + Trial
            </button>
          </div>
        </div>

        {/* Screw Gauge (Thickness d) */}
        <div className={styles.dimensionCard}>
          <div className={styles.dimensionHeader}>
            <span className={styles.dimensionTitle}>Thickness (d) — Screw Gauge</span>
            <span className={styles.badge}>LC: 0.01 mm</span>
          </div>

          <table className={styles.trialsTable}>
            <thead>
              <tr>
                <th>Trial</th>
                <th>Reading (mm)</th>
              </tr>
            </thead>
            <tbody>
              {thicknessTrials.map((val, idx) => (
                <tr key={idx}>
                  <td>Trial #{idx + 1}</td>
                  <td><strong>{val.toFixed(2)}</strong> mm</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Mean d: <strong>{meanThicknessMm.toFixed(2)} mm</strong> ({(meanThicknessMm * 1e-3).toFixed(5)} m)
            </span>
            <button
              type="button"
              className={styles.button}
              onClick={onAddThicknessTrial}
              disabled={isReadOnly}
              style={{ padding: '4px 8px', fontSize: '11px' }}
            >
              + Trial
            </button>
          </div>
        </div>
      </div>

      {/* Metre Scale Dimensions (l and a) */}
      <div className={styles.formGrid}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="span-distance">
            Knife-Edge Span distance l (m):
          </label>
          <input
            id="span-distance"
            type="number"
            className={styles.input}
            min="0.5"
            max="0.85"
            step="0.01"
            value={supportDistanceM}
            onChange={(e) => onSupportDistanceChange(Number(e.target.value))}
            disabled={isReadOnly}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="overhang-distance">
            Overhang distance a (m):
          </label>
          <input
            id="overhang-distance"
            type="number"
            className={styles.input}
            min="0.05"
            max="0.2"
            step="0.01"
            value={overhangM}
            onChange={(e) => onOverhangChange(Number(e.target.value))}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
