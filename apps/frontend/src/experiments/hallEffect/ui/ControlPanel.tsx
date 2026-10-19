import { SAMPLES } from '../physics/hall';
import styles from './ui.module.css';

interface ControlPanelProps {
  sampleKey: string;
  onSampleChange: (key: string) => void;
  currentA: number;
  onCurrentChange: (valA: number) => void;
  magnetCurrentA: number;
  onMagnetCurrentChange: (valA: number) => void;
  fieldDirection: '+B' | '-B';
  onFieldDirectionChange: (dir: '+B' | '-B') => void;
  probePolarity: 'normal' | 'reversed';
  onProbePolarityChange: (pol: 'normal' | 'reversed') => void;
  activeTab: 'current' | 'field';
  onTabChange: (tab: 'current' | 'field') => void;
  onRecordCurrentReading: () => void;
  onAutoRecordSequence: () => void;
  onClearReadings: () => void;
  isReadOnly?: boolean;
}

export function ControlPanel({
  sampleKey,
  onSampleChange,
  currentA,
  onCurrentChange,
  magnetCurrentA,
  onMagnetCurrentChange,
  fieldDirection,
  onFieldDirectionChange,
  probePolarity,
  onProbePolarityChange,
  activeTab,
  onTabChange,
  onRecordCurrentReading,
  onAutoRecordSequence,
  onClearReadings,
  isReadOnly = false,
}: ControlPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>
        <span>Hall Apparatus Controls</span>
      </h3>

      <div className={styles.tabGroup}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'current' ? styles.tabBtnActive : ''}`}
          onClick={() => onTabChange('current')}
        >
          1. V_H vs I (Fixed B)
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'field' ? styles.tabBtnActive : ''}`}
          onClick={() => onTabChange('field')}
        >
          2. V_H vs B (Fixed I)
        </button>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Semiconductor Sample</span>
        </label>
        <select
          className={styles.select}
          value={sampleKey}
          onChange={(e) => onSampleChange(e.target.value)}
          disabled={isReadOnly}
        >
          {Object.values(SAMPLES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Specimen Current (I)</span>
          <span className={styles.valueBadge}>{(currentA * 1e3).toFixed(1)} mA</span>
        </label>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={currentA * 1e3}
          onChange={(e) => onCurrentChange(Number(e.target.value) * 1e-3)}
          className={styles.slider}
          disabled={isReadOnly || activeTab === 'field'}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Electromagnet Current (I_m)</span>
          <span className={styles.valueBadge}>{magnetCurrentA.toFixed(2)} A</span>
        </label>
        <input
          type="range"
          min="0"
          max="2.5"
          step="0.1"
          value={magnetCurrentA}
          onChange={(e) => onMagnetCurrentChange(Number(e.target.value))}
          className={styles.slider}
          disabled={isReadOnly || activeTab === 'current'}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Magnetic Field Direction</span>
        </label>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${fieldDirection === '+B' ? styles.toggleBtnActive : ''}`}
            onClick={() => onFieldDirectionChange('+B')}
            disabled={isReadOnly}
          >
            +B (Out of Page ⊙)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${fieldDirection === '-B' ? styles.toggleBtnActive : ''}`}
            onClick={() => onFieldDirectionChange('-B')}
            disabled={isReadOnly}
          >
            -B (Into Page ⊗)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Probe Polarity</span>
        </label>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${probePolarity === 'normal' ? styles.toggleBtnActive : ''}`}
            onClick={() => onProbePolarityChange('normal')}
            disabled={isReadOnly}
          >
            Normal (A: -, B: +)
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${probePolarity === 'reversed' ? styles.toggleBtnActive : ''}`}
            onClick={() => onProbePolarityChange('reversed')}
            disabled={isReadOnly}
          >
            Reversed (A: +, B: -)
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={onRecordCurrentReading}
          disabled={isReadOnly}
        >
          <span>Record Reading (+B & -B offset cancellation)</span>
        </button>

        <button
          type="button"
          className={styles.actionBtn}
          style={{ background: 'var(--surface-primary)', color: '#8d1b2e', border: '1px solid #8d1b2e' }}
          onClick={onAutoRecordSequence}
          disabled={isReadOnly}
        >
          <span>Auto-Record 6 Points Sequence</span>
        </button>

        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClearReadings}
          disabled={isReadOnly}
        >
          Clear Observations
        </button>
      </div>
    </div>
  );
};
