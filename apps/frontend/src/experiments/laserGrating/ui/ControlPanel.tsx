import {
  GRATING_LINES_PER_MM_PRESETS,
  WAVELENGTH_PRESETS,
  DISTANCE_BOUNDS_M,
} from '../physics/grating';
import type { GratingMode } from '../sim/types';
import styles from './ui.module.css';

interface ControlPanelProps {
  linesPerMm: number;
  onLinesPerMmChange: (n: number) => void;
  mode: GratingMode;
  onModeChange: (m: GratingMode) => void;
  selectedWavelengthM: number;
  onSelectedWavelengthChange: (wl: number) => void;
  distanceM: number;
  onDistanceChange: (d: number) => void;
  distanceClampedWarning: boolean;
  onMeasureAll: () => void;
  onClearAll: () => void;
  hasReadings: boolean;
  isReadOnly?: boolean;
}

export function ControlPanel({
  linesPerMm,
  onLinesPerMmChange,
  mode,
  onModeChange,
  selectedWavelengthM,
  onSelectedWavelengthChange,
  distanceM,
  onDistanceChange,
  distanceClampedWarning,
  onMeasureAll,
  onClearAll,
  hasReadings,
  isReadOnly = false,
}: ControlPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Grating Controls</h3>

      {/* Grating Presets */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          Grating Density N <span className={styles.unit}>({linesPerMm} lines/mm)</span>
        </label>
        <div className={styles.buttonGroup}>
          {GRATING_LINES_PER_MM_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.toggleBtn} ${linesPerMm === preset ? styles.toggleBtnActive : ''}`}
              onClick={() => onLinesPerMmChange(preset)}
              disabled={isReadOnly}
            >
              {preset} l/mm
            </button>
          ))}
        </div>
      </div>

      {/* Experiment Mode */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Experiment Mode</label>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'unknown' ? styles.toggleBtnActive : ''}`}
            onClick={() => onModeChange('unknown')}
            disabled={isReadOnly}
          >
            ❓ Unknown Laser
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${mode === 'known' ? styles.toggleBtnActive : ''}`}
            onClick={() => onModeChange('known')}
            disabled={isReadOnly}
          >
            🎯 Known (Practice)
          </button>
        </div>
      </div>

      {/* Laser Wavelength Selector in Known Mode */}
      {mode === 'known' && (
        <div className={styles.formGroup}>
          <label className={styles.label}>
            Select Practice Laser <span className={styles.unit}>(Wavelength λ)</span>
          </label>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${
                selectedWavelengthM === WAVELENGTH_PRESETS.GREEN ? styles.toggleBtnActive : ''
              }`}
              onClick={() => onSelectedWavelengthChange(WAVELENGTH_PRESETS.GREEN)}
              disabled={isReadOnly}
            >
              532 nm (Green)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${
                selectedWavelengthM === WAVELENGTH_PRESETS.RED_HENE ? styles.toggleBtnActive : ''
              }`}
              onClick={() => onSelectedWavelengthChange(WAVELENGTH_PRESETS.RED_HENE)}
              disabled={isReadOnly}
            >
              633 nm (He-Ne)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${
                selectedWavelengthM === WAVELENGTH_PRESETS.RED_DIODE ? styles.toggleBtnActive : ''
              }`}
              onClick={() => onSelectedWavelengthChange(WAVELENGTH_PRESETS.RED_DIODE)}
              disabled={isReadOnly}
            >
              650 nm (Red)
            </button>
          </div>
        </div>
      )}

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
            step={0.05}
            value={distanceM}
            onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
            className={styles.numInput}
            disabled={isReadOnly}
          />
        </div>
        {distanceClampedWarning && (
          <div className={styles.warningBox}>
            ⚠️ Distance clamped to realistic range [0.30 m, 2.00 m].
          </div>
        )}
      </div>

      {/* Observation Table Actions */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Observation Table Actions</label>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onMeasureAll}
          disabled={isReadOnly}
        >
          ⚡ Auto-Record All Existing Orders (±1..±3)
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
