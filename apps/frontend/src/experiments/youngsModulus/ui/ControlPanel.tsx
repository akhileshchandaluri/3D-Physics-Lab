import { MATERIALS, type MaterialKey } from '../physics/bending';
import type { TravellingMicroscopeReading } from '../sim/types';
import { MicroscopeReadout } from './MicroscopeReadout';
import styles from './ui.module.css';

interface ControlPanelProps {
  materialKey: MaterialKey;
  onMaterialChange: (mat: MaterialKey) => void;
  massKg: number;
  onMassChange: (massKg: number) => void;
  loadingMode: 'loading' | 'unloading';
  onLoadingModeChange: (mode: 'loading' | 'unloading') => void;
  microscopeReading: TravellingMicroscopeReading;
  onRecordCurrentReading: () => void;
  onAutoRecordAllReadings: () => void;
  stressMpa: number;
  yieldStrengthMpa: number;
  isClamped: boolean;
  isReadOnly?: boolean;
}

export function ControlPanel({
  materialKey,
  onMaterialChange,
  massKg,
  onMassChange,
  loadingMode,
  onLoadingModeChange,
  microscopeReading,
  onRecordCurrentReading,
  onAutoRecordAllReadings,
  stressMpa,
  yieldStrengthMpa,
  isClamped,
  isReadOnly = false,
}: ControlPanelProps) {
  const isYieldExceeded = stressMpa > yieldStrengthMpa;

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h4 className={styles.panelTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          Experimental Controls & Apparatus
        </h4>
      </div>

      {isClamped && (
        <div className={styles.warningBox}>
          <strong>Notice:</strong> Mass clamped to valid range [0.10 kg, 0.50 kg] (100 g – 500 g).
        </div>
      )}

      {isYieldExceeded && (
        <div className={styles.dangerBox}>
          <strong>Warning:</strong> Maximum bending stress ({stressMpa} MPa) exceeds material yield strength ({yieldStrengthMpa} MPa)! Plastic deformation may occur.
        </div>
      )}

      <div className={styles.formGrid}>
        {/* Material Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="material-select">
            Specimen Material:
          </label>
          <select
            id="material-select"
            className={styles.select}
            value={materialKey}
            onChange={(e) => onMaterialChange(e.target.value as MaterialKey)}
            disabled={isReadOnly}
          >
            {(Object.keys(MATERIALS) as MaterialKey[]).map((key) => (
              <option key={key} value={key}>
                {MATERIALS[key].name} (Yield: {(MATERIALS[key].yieldStrengthPa / 1e6).toFixed(0)} MPa)
              </option>
            ))}
          </select>
        </div>

        {/* Load Mass Step Selection */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="mass-select">
            Hanger Load Mass M (each end):
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              id="mass-select"
              className={styles.select}
              value={massKg}
              onChange={(e) => onMassChange(Number(e.target.value))}
              disabled={isReadOnly}
            >
              {[0.1, 0.2, 0.3, 0.4, 0.5].map((m) => (
                <option key={m} value={m}>
                  {(m * 1000).toFixed(0)} g ({m.toFixed(1)} kg)
                </option>
              ))}
            </select>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.button}
                onClick={() => onMassChange(Number((massKg - 0.1).toFixed(1)))}
                disabled={isReadOnly || massKg <= 0.1}
                title="Decrease mass by 100g"
              >
                -100g
              </button>
              <button
                type="button"
                className={styles.button}
                onClick={() => onMassChange(Number((massKg + 0.1).toFixed(1)))}
                disabled={isReadOnly || massKg >= 0.5}
                title="Increase mass by 100g"
              >
                +100g
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Unloading Phase */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Measurement Phase:</label>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.button} ${loadingMode === 'loading' ? styles.primaryButton : ''}`}
              onClick={() => onLoadingModeChange('loading')}
              disabled={isReadOnly}
            >
              Loading (↑ 100g → 500g)
            </button>
            <button
              type="button"
              className={`${styles.button} ${loadingMode === 'unloading' ? styles.primaryButton : ''}`}
              onClick={() => onLoadingModeChange('unloading')}
              disabled={isReadOnly}
            >
              Unloading (↓ 500g → 100g)
            </button>
          </div>
        </div>
      </div>

      {/* Stress Indicator */}
      <div className={styles.dimensionCard}>
        <div className={styles.dimensionHeader}>
          <span className={styles.dimensionTitle}>Maximum Bending Stress (σ)</span>
          <span className={isYieldExceeded ? styles.badge : styles.badge}>
            Yield Limit: {yieldStrengthMpa} MPa
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Formula: σ = 6 M g a / (b d²)
          </span>
          <span
            style={{
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: isYieldExceeded ? '#ef4444' : 'var(--text-primary)',
            }}
          >
            {stressMpa} MPa
          </span>
        </div>
      </div>

      {/* Travelling Microscope Reading Widget */}
      <MicroscopeReadout
        reading={microscopeReading}
        massKg={massKg}
        loadingMode={loadingMode}
        onRecord={onRecordCurrentReading}
        isReadOnly={isReadOnly}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          type="button"
          className={`${styles.button} ${styles.secondaryButton}`}
          onClick={onAutoRecordAllReadings}
          disabled={isReadOnly}
          title="Simulate complete loading & unloading sequence for all masses"
        >
          ⚡ Auto-Record Full Sequence (100g – 500g)
        </button>
      </div>
    </div>
  );
}
