import styles from './ui.module.css';

interface ResultBannerProps {
  meanDUm: number;
  stdDevDUm: number;
  regressionDUm: number;
  trueDiameterUm: number;
  percentErrorVal: number;
  revealed: boolean;
  onToggleReveal: () => void;
  hasReadings: boolean;
  isReadOnly?: boolean;
}

export function ResultBanner({
  meanDUm,
  stdDevDUm,
  regressionDUm,
  trueDiameterUm,
  percentErrorVal,
  revealed,
  onToggleReveal,
  hasReadings,
  isReadOnly = false,
}: ResultBannerProps) {
  if (!hasReadings) {
    return null;
  }

  const isGood = percentErrorVal < 3.0;

  return (
    <aside className={styles.banner} aria-label="Experiment Results Summary">
      <div className={styles.bannerStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Mean Diameter d̄</span>
          <span className={styles.statVal}>
            {meanDUm.toFixed(2)} <span style={{ fontSize: '12px' }}>µm</span>
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Sample Std Dev s</span>
          <span className={styles.statVal}>
            {stdDevDUm.toFixed(2)} <span style={{ fontSize: '12px' }}>µm</span>
          </span>
        </div>

        {regressionDUm > 0 && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Regression Slope d</span>
            <span className={styles.statVal}>
              {regressionDUm.toFixed(2)} <span style={{ fontSize: '12px' }}>µm</span>
            </span>
          </div>
        )}

        {revealed && (
          <>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>True Particle Size</span>
              <span className={styles.statVal} style={{ color: 'var(--primary-600)' }}>
                {trueDiameterUm.toFixed(2)} <span style={{ fontSize: '12px' }}>µm</span>
              </span>
            </div>

            <div className={styles.statItem}>
              <span className={styles.statLabel}>Percent Error</span>
              <span
                className={`${styles.errorBadge} ${isGood ? styles.errorGood : styles.errorMedium}`}
              >
                {percentErrorVal.toFixed(2)}%
              </span>
            </div>
          </>
        )}
      </div>

      <div>
        <button
          type="button"
          className={`${styles.actionBtn} ${revealed ? styles.secondaryBtn : ''}`}
          style={{ width: 'auto' }}
          onClick={onToggleReveal}
          disabled={isReadOnly}
        >
          {revealed ? 'Hide True Value' : '🔍 Reveal True Value & Error'}
        </button>
      </div>
    </aside>
  );
}
