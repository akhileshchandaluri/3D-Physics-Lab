import styles from './ui.module.css';

interface ResultBannerProps {
  meanLambdaNm: number;
  stdDevLambdaNm: number;
  regressionLambdaNm: number;
  trueLambdaNm: number;
  percentErrorVal: number;
  revealed: boolean;
  onToggleReveal: () => void;
  hasReadings: boolean;
  isReadOnly?: boolean;
}

export function ResultBanner({
  meanLambdaNm,
  stdDevLambdaNm,
  regressionLambdaNm,
  trueLambdaNm,
  percentErrorVal,
  revealed,
  onToggleReveal,
  hasReadings,
  isReadOnly = false,
}: ResultBannerProps) {
  if (!hasReadings) {
    return null;
  }

  const isGood = percentErrorVal < 2.0;

  return (
    <aside className={styles.banner} aria-label="Experiment Results Summary">
      <div className={styles.bannerStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Mean Wavelength λ̄</span>
          <span className={styles.statVal}>
            {meanLambdaNm.toFixed(1)} <span style={{ fontSize: '12px' }}>nm</span>
          </span>
        </div>

        <div className={styles.statItem}>
          <span className={styles.statLabel}>Sample Std Dev s</span>
          <span className={styles.statVal}>
            {stdDevLambdaNm.toFixed(2)} <span style={{ fontSize: '12px' }}>nm</span>
          </span>
        </div>

        {regressionLambdaNm > 0 && (
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Regression Slope λ</span>
            <span className={styles.statVal}>
              {regressionLambdaNm.toFixed(1)} <span style={{ fontSize: '12px' }}>nm</span>
            </span>
          </div>
        )}

        {revealed && (
          <>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>True Wavelength</span>
              <span className={styles.statVal} style={{ color: 'var(--primary-600)' }}>
                {trueLambdaNm.toFixed(1)} <span style={{ fontSize: '12px' }}>nm</span>
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
