import { WAVELENGTH_PRESETS, DISTANCE_BOUNDS_M } from '../physics/lycopodium';
import type { SampleKey } from '../sim/types';
import styles from './ui.module.css';

interface ControlPanelProps {
  wavelengthM: number;
  onWavelengthChange: (wl: number) => void;
  distanceM: number;
  onDistanceChange: (d: number) => void;
  sampleKey: SampleKey;
  onSampleChange: (sample: SampleKey) => void;
  distanceClampedWarning: boolean;
  onMeasureAll: () => void;
  onClearAll: () => void;
  hasReadings: boolean;
  isReadOnly?: boolean;
}

export function ControlPanel({
  wavelengthM,
  onWavelengthChange,
  distanceM,
  onDistanceChange,
  sampleKey,
  onSampleChange,
  distanceClampedWarning,
  onMeasureAll,
  onClearAll,
  hasReadings,
  isReadOnly = false,
}: ControlPanelProps) {
  const isRed = wavelengthM >= WAVELENGTH_PRESETS.RED - 10e-9;

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Simulation Controls</h3>

      {/* Laser Wavelength Presets */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Laser Source Preset <span className={styles.unit}>(Wavelength λ)</span>
        </label>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isRed ? styles.laserRedActive : ''}`}
            onClick={() => onWavelengthChange(WAVELENGTH_PRESETS.RED)}
            disabled={isReadOnly}
          >
            🔴 Red (650 nm)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isRed ? styles.laserGreenActive : ''}`}
            onClick={() => onWavelengthChange(WAVELENGTH_PRESETS.GREEN)}
            disabled={isReadOnly}
          >
            🟢 Green (532 nm)
          </button>
        </div>
      </div>

      {/* Screen Distance Slider & Input */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Screen Distance D <span className={styles.unit}>({distanceM.toFixed(2)} m)</span>
        </label>
        <div className={styles.inputRow}>
          <input
            type="range"
            min={DISTANCE_BOUNDS_M.MIN}
            max={DISTANCE_BOUNDS_M.MAX}
            step={0.05}
            value={distanceM}
            onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
            className={styles.slider}
            disabled={isReadOnly}
          />
          <input
            type="number"
            min={DISTANCE_BOUNDS_M.MIN}
            max={DISTANCE_BOUNDS_M.MAX}
            step={0.1}
            value={distanceM}
            onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
            className={styles.numInput}
            disabled={isReadOnly}
          />
        </div>
        {distanceClampedWarning && (
          <div className={styles.warningBox}>
            ⚠️ Screen distance clamped to valid range [0.50 m, 3.00 m].
          </div>
        )}
      </div>

      {/* Powder Sample Selection */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Lycopodium Powder Sample <span className={styles.unit}>(Sample Slide)</span>
        </label>
        <div className={styles.buttonGroup}>
          {(['A', 'B', 'C'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`${styles.toggleBtn} ${sampleKey === key ? styles.toggleBtnActive : ''}`}
              onClick={() => onSampleChange(key)}
              disabled={isReadOnly}
            >
              Powder {key}
            </button>
          ))}
        </div>
      </div>

      {/* Automated Measurement Controls */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Observation Table Actions</label>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onMeasureAll}
          disabled={isReadOnly}
        >
          ⚡ Auto-Record Rings 1–4 (with noise)
        </button>
        {hasReadings && (
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.secondaryBtn}`}
            onClick={onClearAll}
            disabled={isReadOnly}
          >
            Clear Recorded Readings
          </button>
        )}
      </div>
    </div>
  );
}
