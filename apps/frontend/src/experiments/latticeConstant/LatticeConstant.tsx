import { useState, useCallback, useMemo, useEffect } from 'react';
import { LabShell } from '../../components/lab/LabShell';
import { DataTable } from '../../components/lab/DataTable';
import { ChartPanel } from '../../components/lab/ChartPanel';
import { useExperimentSave } from '../../components/lab/useExperimentSave';
import type { TableColumn } from '../../components/lab/types';
import type { ExperimentProps } from '../types';
import { LatticeScene } from './scene/LatticeScene';
import { GoniometerPanel } from './ui/GoniometerPanel';
import { TheoryDrawer } from './ui/TheoryDrawer';
import { ResultBanner } from './ui/ResultBanner';
import {
  generateDiffractionPattern,
  calculateBraggPeaks,
  latticeConstantFromPeak,
  CRYSTALS,
  XRAY_SOURCES,
  type PickedPeakObservation,
} from './physics/bragg';
import { mean, sampleStdDev, linearRegression, percentError } from '../../lib/stats';
import {
  INITIAL_LATTICE_STATE,
  isLatticeSavedState,
  type LatticeSimState,
} from './sim/simState';
import styles from './latticeConstant.module.css';

interface LabCoreProps {
  initialState?: unknown;
  isReadOnly: boolean;
  saveStatus: string;
  saveMessage: string | null;
  onSave: (state: LatticeSimState, title?: string, notes?: string) => Promise<boolean>;
}

function LatticeConstantLabCore({
  initialState,
  isReadOnly,
  saveStatus,
  saveMessage,
  onSave,
}: LabCoreProps) {
  const [simState, setSimState] = useState<LatticeSimState>(() => {
    if (isLatticeSavedState(initialState)) return initialState;
    return INITIAL_LATTICE_STATE;
  });

  const crystal = CRYSTALS[simState.crystalKey] || CRYSTALS['nacl'];
  const source = XRAY_SOURCES[simState.sourceKey] || XRAY_SOURCES['cu-ka'];

  // Automated 2theta scan loop
  useEffect(() => {
    if (!simState.isScanning) return;
    const interval = setInterval(() => {
      setSimState((prev) => {
        if (!prev.isScanning) return prev;
        const nextAngle = prev.currentTwoThetaDeg + 0.3 * prev.scanSpeed;
        if (nextAngle >= 90.0) {
          return { ...prev, currentTwoThetaDeg: 90.0, isScanning: false };
        }
        return { ...prev, currentTwoThetaDeg: Number(nextAngle.toFixed(1)) };
      });
    }, 60);

    return () => clearInterval(interval);
  }, [simState.isScanning, simState.scanSpeed]);

  const handleCrystalChange = useCallback(
    (key: string) => {
      if (isReadOnly) return;
      setSimState((prev) => ({
        ...prev,
        crystalKey: key,
        pickedPeaks: [],
        selectedPeakId: null,
      }));
    },
    [isReadOnly]
  );

  const handleSourceChange = useCallback(
    (key: string) => {
      if (isReadOnly) return;
      setSimState((prev) => ({
        ...prev,
        sourceKey: key,
        pickedPeaks: [],
        selectedPeakId: null,
      }));
    },
    [isReadOnly]
  );

  const handleTwoThetaChange = useCallback(
    (deg: number) => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, currentTwoThetaDeg: deg }));
    },
    [isReadOnly]
  );

  const handleToggleScan = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => {
      if (!prev.isScanning && prev.currentTwoThetaDeg >= 89.9) {
        return { ...prev, currentTwoThetaDeg: 10.0, isScanning: true };
      }
      return { ...prev, isScanning: !prev.isScanning };
    });
  }, [isReadOnly]);

  const handleAddObservation = useCallback(
    (obs: PickedPeakObservation) => {
      if (isReadOnly) return;
      setSimState((prev) => {
        const filtered = prev.pickedPeaks.filter((p) => p.id !== obs.id);
        const updated = [...filtered, obs].sort((a, b) => a.twoThetaDeg - b.twoThetaDeg);
        return {
          ...prev,
          pickedPeaks: updated,
          selectedPeakId: obs.id,
        };
      });
    },
    [isReadOnly]
  );

  // Auto pick all major Bragg peaks
  const handleAutoPickAllPeaks = useCallback(() => {
    if (isReadOnly) return;
    const braggPeaks = calculateBraggPeaks(simState.crystalKey, simState.sourceKey);
    const observations: PickedPeakObservation[] = braggPeaks.map((p) => {
      const thetaRad = ((p.twoThetaDeg / 2.0) * Math.PI) / 180.0;
      const sinT = Math.sin(thetaRad);
      const sin2T = Math.pow(sinT, 2);
      const aVal = latticeConstantFromPeak(p.twoThetaDeg, p.h, p.k, p.l, source.wavelengthA);
      return {
        id: `${p.twoThetaDeg.toFixed(1)}-${p.h}${p.k}${p.l}`,
        twoThetaDeg: p.twoThetaDeg,
        thetaDeg: Number((p.twoThetaDeg / 2.0).toFixed(2)),
        sinTheta: Number(sinT.toFixed(4)),
        sin2Theta: Number(sin2T.toFixed(4)),
        h: p.h,
        k: p.k,
        l: p.l,
        h2k2l2: p.h2k2l2,
        calculatedAA: Number(aVal.toFixed(4)),
      };
    });

    setSimState((prev) => ({
      ...prev,
      pickedPeaks: observations,
      selectedPeakId: observations[0]?.id || null,
    }));
  }, [isReadOnly, simState.crystalKey, simState.sourceKey, source.wavelengthA]);

  const handleClearObservations = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, pickedPeaks: [], selectedPeakId: null }));
  }, [isReadOnly]);

  const handleToggleReveal = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, revealedTrueValue: !prev.revealedTrueValue }));
  }, [isReadOnly]);

  const handleSaveSession = useCallback(async () => {
    if (isReadOnly) return;
    await onSave(
      simState,
      `Lattice Constant (${crystal.name})`,
      `Recorded ${simState.pickedPeaks.length} Bragg diffraction peaks`
    );
  }, [crystal.name, isReadOnly, onSave, simState]);

  // Active highlighted plane family for 3D view
  const activeHighlightHkl = useMemo(() => {
    if (!simState.selectedPeakId) return null;
    const found = simState.pickedPeaks.find((p) => p.id === simState.selectedPeakId);
    if (!found) return null;
    const dVal = Number((found.calculatedAA / Math.sqrt(found.h2k2l2)).toFixed(3));
    return { h: found.h, k: found.k, l: found.l, dSpacingA: dVal };
  }, [simState.pickedPeaks, simState.selectedPeakId]);

  // Observations table columns
  const tableColumns: TableColumn<PickedPeakObservation>[] = useMemo(
    () => [
      { key: 'twoThetaDeg', label: '2θ', unit: '°' },
      { key: 'thetaDeg', label: 'θ', unit: '°' },
      { key: 'sinTheta', label: 'sin(θ)' },
      { key: 'sin2Theta', label: 'sin²(θ)' },
      {
        key: 'hkl',
        label: '(hkl)',
        render: (row: PickedPeakObservation) => `(${row.h} ${row.k} ${row.l})`,
      },
      { key: 'h2k2l2', label: 'h²+k²+l²' },
      {
        key: 'calculatedAA',
        label: 'a',
        unit: 'Å',
        render: (row: PickedPeakObservation) => row.calculatedAA.toFixed(4),
      },
    ],
    []
  );

  // Full diffraction pattern line data
  const diffractionData = useMemo(() => {
    const rawPattern = generateDiffractionPattern(
      simState.crystalKey,
      simState.sourceKey,
      simState.seed
    );
    // When scanning, only display points up to currentTwoThetaDeg
    const filtered = simState.isScanning
      ? rawPattern.filter((p) => p.twoTheta <= simState.currentTwoThetaDeg)
      : rawPattern;

    return filtered.map((p) => ({ x: p.twoTheta, y: p.intensity }));
  }, [simState.crystalKey, simState.sourceKey, simState.seed, simState.isScanning, simState.currentTwoThetaDeg]);

  // Statistical calculations
  const { meanA, stdDevA, regressionA, errPct, regSlope, regIntercept } = useMemo(() => {
    if (simState.pickedPeaks.length === 0) {
      return {
        meanA: 0,
        stdDevA: 0,
        regressionA: 0,
        errPct: undefined,
        regSlope: 0,
        regIntercept: 0,
      };
    }

    const aValues = simState.pickedPeaks.map((p) => p.calculatedAA);
    const avgA = mean(aValues);
    const sA = aValues.length > 1 ? sampleStdDev(aValues) : 0;

    // Linear regression: sin^2(theta) vs (h^2+k^2+l^2)
    // slope = lambda^2 / (4 * a^2) => a = lambda / (2 * sqrt(slope))
    const xs = simState.pickedPeaks.map((p) => p.h2k2l2);
    const ys = simState.pickedPeaks.map((p) => p.sin2Theta);
    const reg = linearRegression(xs, ys);

    let regA = 0;
    if (reg.slope > 0) {
      regA = source.wavelengthA / (2.0 * Math.sqrt(reg.slope));
    }

    const err = percentError(avgA, crystal.trueLatticeConstantA);

    return {
      meanA: avgA,
      stdDevA: sA,
      regressionA: regA,
      errPct: err,
      regSlope: reg.slope,
      regIntercept: reg.intercept,
    };
  }, [simState.pickedPeaks, source.wavelengthA, crystal.trueLatticeConstantA]);

  // Chart datasets
  const spectrumDatasets = useMemo(
    () => [
      {
        label: 'Diffraction Intensity I(2θ)',
        points: diffractionData,
        type: 'line' as const,
        color: '#8d1b2e',
      },
    ],
    [diffractionData]
  );

  const regressionDatasets = useMemo(() => {
    if (simState.pickedPeaks.length === 0) return [];
    return [
      {
        label: 'sin²(θ) vs (h² + k² + l²)',
        points: simState.pickedPeaks.map((p) => ({ x: p.h2k2l2, y: p.sin2Theta })),
        type: 'scatter' as const,
        color: '#8d1b2e',
      },
    ];
  }, [simState.pickedPeaks]);

  const fitLine = useMemo(() => {
    if (simState.pickedPeaks.length < 2) return undefined;
    return {
      slope: regSlope,
      intercept: regIntercept,
    };
  }, [simState.pickedPeaks.length, regSlope, regIntercept]);

  return (
    <LabShell
      sessionCode="Session 02"
      title="Determination of Lattice Constant"
      saveControls={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveStatus === 'saved' && (
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>Saved ✓</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
              {saveMessage || 'Save failed'}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveSession}
            disabled={isReadOnly || saveStatus === 'saving'}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '8px',
              border: 'none',
              background: '#8d1b2e',
              color: '#fff',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              opacity: isReadOnly ? 0.6 : 1,
            }}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      }
      theoryProcedure={<TheoryDrawer />}
      resultBanner={
        <ResultBanner
          crystalKey={simState.crystalKey}
          meanAA={meanA}
          stdDevAA={stdDevA}
          regressionAA={regressionA}
          revealedTrueValue={simState.revealedTrueValue}
          onToggleReveal={handleToggleReveal}
          percentError={errPct}
        />
      }
      controls={
        <div className={styles.controlsColumn}>
          <GoniometerPanel
            crystalKey={simState.crystalKey}
            onCrystalChange={handleCrystalChange}
            sourceKey={simState.sourceKey}
            onSourceChange={handleSourceChange}
            twoThetaDeg={simState.currentTwoThetaDeg}
            onTwoThetaChange={handleTwoThetaChange}
            isScanning={simState.isScanning}
            onToggleScan={handleToggleScan}
            onAddObservation={handleAddObservation}
            onAutoPickAllPeaks={handleAutoPickAllPeaks}
            onClearObservations={handleClearObservations}
            isReadOnly={isReadOnly}
          />
        </div>
      }
      visualization={
        <div className={styles.visualizationColumn}>
          <LatticeScene
            crystalKey={simState.crystalKey}
            twoThetaDeg={simState.currentTwoThetaDeg}
            highlightHkl={activeHighlightHkl}
          />
        </div>
      }
      results={
        <div className={styles.resultsColumn}>
          <div className={styles.resultsGrid}>
            <DataTable<PickedPeakObservation>
              title="Bragg Peak Observations & Lattice Constant (a)"
              columns={tableColumns}
              rows={simState.pickedPeaks}
              onClearRows={simState.pickedPeaks.length > 0 ? handleClearObservations : undefined}
              emptyMessage="No Bragg peaks recorded. Click 'Snap to Bragg Peak' or 'Auto-Pick All Peaks'."
            />

            <ChartPanel
              title={`XRD Powder Pattern — ${crystal.name} (${source.name})`}
              xLabel="Diffraction Angle 2θ (°)"
              yLabel="Relative Intensity (%)"
              datasets={spectrumDatasets}
              height={260}
            />

            <ChartPanel
              title="Bragg Linear Fit: sin²(θ) vs (h² + k² + l²)"
              xLabel="Index Sum Σ(h² + k² + l²)"
              yLabel="sin²(θ)"
              datasets={regressionDatasets}
              fitLine={fitLine}
              height={260}
            />
          </div>
        </div>
      }
    />
  );
}

export function LatticeConstant({
  initialState,
  isReadOnly = false,
}: ExperimentProps) {
  const {
    status: saveStatus,
    message: saveMessage,
    save,
    currentSavedId,
    loadedState,
  } = useExperimentSave<LatticeSimState>({
    experimentId: 'lattice-constant',
    isSavedState: isLatticeSavedState,
    initialState,
    isReadOnly,
    defaultTitle: 'Lattice Constant Bragg Diffraction Run',
  });

  const effectiveState = loadedState || initialState;

  return (
    <LatticeConstantLabCore
      key={currentSavedId || 'default'}
      initialState={effectiveState}
      isReadOnly={isReadOnly}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onSave={save}
    />
  );
}

export default LatticeConstant;
