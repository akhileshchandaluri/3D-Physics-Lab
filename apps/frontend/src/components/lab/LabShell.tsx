import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LabShellProps } from './types';
import styles from './LabShell.module.css';

export function LabShell({
  title,
  sessionCode,
  backUrl = '/dashboard',
  saveControls,
  controls,
  visualization,
  results,
  theoryProcedure,
  resultBanner,
}: LabShellProps) {
  const [showTheory, setShowTheory] = useState(false);

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.leftGroup}>
          <Link to={backUrl} className={styles.backLink}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          {sessionCode && <span className={styles.sessionCode}>{sessionCode}</span>}
          <h1 className={styles.title}>{title}</h1>
        </div>

        <div className={styles.rightGroup}>
          {theoryProcedure && (
            <button
              type="button"
              className={`${styles.theoryToggle} ${showTheory ? styles.theoryToggleActive : ''}`}
              onClick={() => setShowTheory((prev) => !prev)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              {showTheory ? 'Hide Theory' : 'Theory & Procedure'}
            </button>
          )}

          {saveControls && <div className={styles.saveSlot}>{saveControls}</div>}
        </div>
      </header>

      {showTheory && theoryProcedure && (
        <aside className={styles.theoryDrawer}>{theoryProcedure}</aside>
      )}

      {resultBanner && <div className={styles.bannerWrap}>{resultBanner}</div>}

      <main className={styles.mainLayout}>
        <section className={styles.controlsSlot} aria-label="Experiment Controls">
          {controls}
        </section>
        <section className={styles.visualizationSlot} aria-label="Experiment Simulation View">
          {visualization}
        </section>
        <section className={styles.resultsSlot} aria-label="Experiment Results and Graphs">
          {results}
        </section>
      </main>
    </div>
  );
}
