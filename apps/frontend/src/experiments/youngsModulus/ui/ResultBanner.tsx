import { percentError } from '../../../lib/stats';
import styles from './ui.module.css';

interface ResultBannerProps {
  meanYPa: number;
  stdDevYPa: number;
  slopeYPa: number;
  meanEOverMMmPerKg: number;
  trueYPa: number;
  revealed: boolean;
  onToggleReveal: () => void;
  materialName: string;
}

export function ResultBanner({
  meanYPa,
  stdDevYPa,
  slopeYPa,
  meanEOverMMmPerKg,
  trueYPa,
  revealed,
  onToggleReveal,
  materialName,
}: ResultBannerProps) {
  const meanYGpa = Number((meanYPa / 1e9).toFixed(2));
  const stdDevGpa = Number((stdDevYPa / 1e9).toFixed(2));
  const slopeYGpa = Number((slopeYPa / 1e9).toFixed(2));
  const trueYGpa = Number((trueYPa / 1e9).toFixed(1));

  const errMeanPercent = revealed && trueYPa > 0 ? percentError(meanYPa, trueYPa).toFixed(2) : null;
  const errSlopePercent = revealed && trueYPa > 0 ? percentError(slopeYPa, trueYPa).toFixed(2) : null;

  return (
    <div className={styles.resultBanner}>
      <div className={styles.resultHeader}>
        <div>
          <h3 className={styles.panelTitle} style={{ fontSize: '17px' }}>
            Experimental Young&apos;s Modulus Results ({materialName})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Uniform Bending Method: Constant Bending Moment τ = M·g·a
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleReveal}
          className={`${styles.button} ${revealed ? styles.secondaryButton : styles.primaryButton}`}
        >
          {revealed ? 'Hide True Value' : '🔍 Reveal True Value'}
        </button>
      </div>

      <div className={styles.resultStatsGrid}>
        <div className={styles.resultStatCard}>
          <span className={styles.statTitle}>Mean e / M Ratio</span>
          <span className={styles.statValue}>{meanEOverMMmPerKg.toFixed(2)} mm/kg</span>
          <span className={styles.statSub}>Average slope across trials</span>
        </div>

        <div className={styles.resultStatCard}>
          <span className={styles.statTitle}>Experimental Y (Mean)</span>
          <span className={styles.statValue}>
            {meanYGpa > 0 ? `${meanYGpa} GPa` : '—'}
          </span>
          <span className={styles.statSub}>
            {stdDevGpa > 0 ? `Std Dev: ±${stdDevGpa} GPa` : 'Single or no observation'}
          </span>
        </div>

        <div className={styles.resultStatCard}>
          <span className={styles.statTitle}>Regression-Derived Y</span>
          <span className={styles.statValue}>
            {slopeYGpa > 0 ? `${slopeYGpa} GPa` : '—'}
          </span>
          <span className={styles.statSub}>From linear fit slope s = e/M</span>
        </div>

        {revealed && (
          <div
            className={styles.resultStatCard}
            style={{
              borderColor: 'var(--accent-500)',
              background: 'rgba(16, 185, 129, 0.05)',
            }}
          >
            <span className={styles.statTitle} style={{ color: 'var(--accent-600)' }}>
              True Value & Accuracy
            </span>
            <span className={styles.statValue} style={{ color: 'var(--accent-600)' }}>
              {trueYGpa} GPa
            </span>
            <span className={styles.statSub}>
              Error (Mean): <strong>{errMeanPercent}%</strong> | Error (Slope): <strong>{errSlopePercent}%</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
