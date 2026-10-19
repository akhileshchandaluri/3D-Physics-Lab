import { useState } from 'react';
import {
  CRYSTALS,
  XRAY_SOURCES,
  ALLOWED_REFLECTIONS,
  isAllowedFCC,
  calculateBraggPeaks,
  latticeConstantFromPeak,
  type PickedPeakObservation,
} from '../physics/bragg';
import styles from './ui.module.css';

interface GoniometerPanelProps {
  crystalKey: string;
  onCrystalChange: (key: string) => void;
  sourceKey: string;
  onSourceChange: (key: string) => void;
  twoThetaDeg: number;
  onTwoThetaChange: (deg: number) => void;
  isScanning: boolean;
  onToggleScan: () => void;
  onAddObservation: (obs: PickedPeakObservation) => void;
  onAutoPickAllPeaks: () => void;
  onClearObservations: () => void;
  isReadOnly?: boolean;
}

export function GoniometerPanel({
  crystalKey,
  onCrystalChange,
  sourceKey,
  onSourceChange,
  twoThetaDeg,
  onTwoThetaChange,
  isScanning,
  onToggleScan,
  onAddObservation,
  onAutoPickAllPeaks,
  onClearObservations,
  isReadOnly = false,
}: GoniometerPanelProps) {
  const source = XRAY_SOURCES[sourceKey] || XRAY_SOURCES['cu-ka'];

  const [selectedHklStr, setSelectedHklStr] = useState<string>('2,0,0');
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Available peak positions to snap
  const peaks = calculateBraggPeaks(crystalKey, sourceKey);

  const handleSnapToPeak = (tt: number) => {
    onTwoThetaChange(tt);
  };

  const handleAssignReflection = () => {
    const parts = selectedHklStr.split(',').map((v) => parseInt(v.trim(), 10));
    const [h, k, l] = parts;

    if (!isAllowedFCC(h, k, l)) {
      setHintMessage(`(${h}${k}${l}) is forbidden for FCC lattices (must be all odd or all even).`);
      return;
    }

    const thetaRad = ((twoThetaDeg / 2.0) * Math.PI) / 180.0;
    const sinT = Math.sin(thetaRad);
    const sin2T = Math.pow(sinT, 2);
    const aVal = latticeConstantFromPeak(twoThetaDeg, h, k, l, source.wavelengthA);
    const h2k2l2 = h * h + k * k + l * l;

    const obs: PickedPeakObservation = {
      id: `${twoThetaDeg.toFixed(1)}-${h}${k}${l}`,
      twoThetaDeg: Number(twoThetaDeg.toFixed(2)),
      thetaDeg: Number((twoThetaDeg / 2.0).toFixed(2)),
      sinTheta: Number(sinT.toFixed(4)),
      sin2Theta: Number(sin2T.toFixed(4)),
      h,
      k,
      l,
      h2k2l2,
      calculatedAA: Number(aVal.toFixed(4)),
    };

    onAddObservation(obs);
    setHintMessage(null);
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>
        <span>Diffractometer Controls</span>
      </h3>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Specimen Crystal</span>
        </label>
        <select
          className={styles.select}
          value={crystalKey}
          onChange={(e) => onCrystalChange(e.target.value)}
          disabled={isReadOnly || isScanning}
        >
          {Object.values(CRYSTALS).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>X-Ray Target Anode</span>
        </label>
        <select
          className={styles.select}
          value={sourceKey}
          onChange={(e) => onSourceChange(e.target.value)}
          disabled={isReadOnly || isScanning}
        >
          {Object.values(XRAY_SOURCES).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Goniometer Angle (2θ)</span>
          <span className={styles.valueBadge}>{twoThetaDeg.toFixed(1)}°</span>
        </label>
        <input
          type="range"
          min="10.0"
          max="90.0"
          step="0.1"
          value={twoThetaDeg}
          onChange={(e) => onTwoThetaChange(parseFloat(e.target.value))}
          className={styles.slider}
          disabled={isReadOnly || isScanning}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Snap to Bragg Peak</span>
        </label>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {peaks.slice(0, 5).map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSnapToPeak(p.twoThetaDeg)}
              disabled={isReadOnly || isScanning}
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                background:
                  Math.abs(twoThetaDeg - p.twoThetaDeg) < 0.2
                    ? '#8d1b2e'
                    : 'var(--surface-primary)',
                color: Math.abs(twoThetaDeg - p.twoThetaDeg) < 0.2 ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {p.twoThetaDeg}° ({p.h}
              {p.k}
              {p.l})
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <label className={styles.label}>
          <span>Assign Miller Indices (hkl)</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className={styles.select}
            value={selectedHklStr}
            onChange={(e) => setSelectedHklStr(e.target.value)}
            disabled={isReadOnly}
          >
            {ALLOWED_REFLECTIONS.map((r, idx) => (
              <option key={idx} value={`${r.h},${r.k},${r.l}`}>
                ({r.h} {r.k} {r.l}) — Σ(h²+k²+l²) = {r.h2k2l2}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssignReflection}
            className={styles.actionBtn}
            style={{ width: 'auto', whiteSpace: 'nowrap' }}
            disabled={isReadOnly}
          >
            Assign
          </button>
        </div>
        {hintMessage && <div className={styles.hintBox}>{hintMessage}</div>}
      </div>

      <div className={styles.section}>
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={onToggleScan}
            disabled={isReadOnly}
            style={{
              background: isScanning ? '#d97706' : '#8d1b2e',
            }}
          >
            {isScanning ? 'Pause 2θ Scan' : 'Run 2θ Scan'}
          </button>

          <button
            type="button"
            className={styles.actionBtn}
            style={{
              background: 'var(--surface-primary)',
              color: '#8d1b2e',
              border: '1px solid #8d1b2e',
            }}
            onClick={onAutoPickAllPeaks}
            disabled={isReadOnly || isScanning}
          >
            Auto-Pick All Peaks
          </button>
        </div>

        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClearObservations}
          disabled={isReadOnly}
        >
          Clear Observations
        </button>
      </div>
    </div>
  );
}
