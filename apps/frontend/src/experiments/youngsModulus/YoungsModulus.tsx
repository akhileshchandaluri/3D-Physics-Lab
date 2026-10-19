import { useState, useMemo, useCallback } from 'react';
import { LabShell } from '../../components/lab/LabShell';
import { ChartPanel } from '../../components/lab/ChartPanel';
import { DataTable } from '../../components/lab/DataTable';
import { useExperimentSave } from '../../components/lab/useExperimentSave';
import type { TableColumn, ChartDataset, SaveStatus } from '../../components/lab/types';
import {
  mean,
  sampleStdDev,
  linearRegression,
  mulberry32,
  gaussianNoise,
} from '../../lib/stats';
import {
  MATERIALS,
  clampMassKg,
  centerElevation,
  maxBendingStress,
  youngsModulusFromElevation,
  youngsModulusFromSlope,
  type MaterialKey,
} from './physics/bending';
import {
  createInitialSimState,
  generateBendingReading,
  splitMicroscopeReading,
} from './sim/simState';
import {
  isYoungsModulusSavedState,
  type YoungsModulusSavedState,
  type BendingReading,
} from './sim/types';
import { BendingScene } from './scene/BendingScene';
import { ControlPanel } from './ui/ControlPanel';
import { DimensionInspection } from './ui/DimensionInspection';
import { ResultBanner } from './ui/ResultBanner';
import { TheoryProcedureDrawer } from './ui/TheoryProcedureDrawer';
import styles from './youngsModulus.module.css';

interface YoungsModulusProps {
  initialState?: unknown;
  isReadOnly?: boolean;
}

interface LabCoreProps {
  initialState?: unknown;
  isReadOnly: boolean;
  saveStatus: SaveStatus;
  saveMessage: string | null;
  onSave: (state: YoungsModulusSavedState, title?: string, notes?: string) => Promise<boolean>;
}

function YoungsModulusLabCore({
  initialState,
  isReadOnly,
  saveStatus,
  saveMessage,
  onSave,
}: LabCoreProps) {
  const [simState, setSimState] = useState<YoungsModulusSavedState>(() =>
    createInitialSimState(initialState)
  );
  const [loadingMode, setLoadingMode] = useState<'loading' | 'unloading'>('loading');
  const [isClamped, setIsClamped] = useState(false);

  // Material change updates specimen properties and default thickness
  const handleMaterialChange = useCallback((newMat: MaterialKey) => {
    setSimState((prev) => {
      const defaultThickness = MATERIALS[newMat].defaultThicknessM;
      const rng = mulberry32((prev.seed + 101) >>> 0);
      const nominalD = defaultThickness * 1000;
      const thicknessTrials = [
        Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
        Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
        Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2)),
      ];
      return {
        ...prev,
        materialKey: newMat,
        thicknessM: Number((mean(thicknessTrials) * 1e-3).toFixed(5)),
        thicknessTrials,
        readings: [],
      };
    });
  }, []);

  // Clamped mass update
  const handleMassChange = useCallback((rawMass: number) => {
    const { clamped, wasClamped } = clampMassKg(rawMass);
    setIsClamped(wasClamped);
    setSimState((prev) => ({
      ...prev,
      currentMassKg: clamped,
    }));
  }, []);

  // New trial for breadth using Vernier Caliper (LC 0.02 mm)
  const handleAddBreadthTrial = useCallback(() => {
    setSimState((prev) => {
      const rng = mulberry32((prev.seed + prev.breadthTrials.length * 7 + 13) >>> 0);
      const newTrial = Number((25.0 + gaussianNoise(rng, 0.02)).toFixed(2));
      const breadthTrials = [...prev.breadthTrials, newTrial];
      return {
        ...prev,
        breadthTrials,
        breadthM: Number((mean(breadthTrials) * 1e-3).toFixed(5)),
      };
    });
  }, []);

  // New trial for thickness using Screw Gauge (LC 0.01 mm)
  const handleAddThicknessTrial = useCallback(() => {
    setSimState((prev) => {
      const nominalD = MATERIALS[prev.materialKey].defaultThicknessM * 1000;
      const rng = mulberry32((prev.seed + prev.thicknessTrials.length * 11 + 29) >>> 0);
      const newTrial = Number((nominalD + gaussianNoise(rng, 0.01)).toFixed(2));
      const thicknessTrials = [...prev.thicknessTrials, newTrial];
      return {
        ...prev,
        thicknessTrials,
        thicknessM: Number((mean(thicknessTrials) * 1e-3).toFixed(5)),
      };
    });
  }, []);

  // Span distance change clamped to [0.50, 0.85] m
  const handleSupportDistanceChange = useCallback((valM: number) => {
    if (Number.isNaN(valM) || !Number.isFinite(valM)) return;
    const clamped = Math.max(0.5, Math.min(0.85, valM));
    setSimState((prev) => ({ ...prev, supportDistanceM: clamped }));
  }, []);

  // Overhang distance change clamped to [0.05, 0.20] m
  const handleOverhangChange = useCallback((valM: number) => {
    if (Number.isNaN(valM) || !Number.isFinite(valM)) return;
    const clamped = Math.max(0.05, Math.min(0.2, valM));
    setSimState((prev) => ({ ...prev, overhangM: clamped }));
  }, []);

  // Exaggeration factor change
  const handleExaggerationChange = useCallback((factor: number) => {
    setSimState((prev) => ({ ...prev, exaggerationFactor: factor }));
  }, []);

  // Toggle true value reveal
  const handleToggleReveal = useCallback(() => {
    setSimState((prev) => ({ ...prev, revealedTrueValue: !prev.revealedTrueValue }));
  }, []);

  // Current theoretical center elevation in meters
  const currentTheoreticalElevationM = useMemo(() => {
    return centerElevation(
      simState.currentMassKg,
      simState.overhangM,
      simState.supportDistanceM,
      simState.breadthM,
      simState.thicknessM,
      MATERIALS[simState.materialKey].youngsModulusPa
    );
  }, [simState]);

  // Current simulated microscope readout with seeded noise at 0.01 mm LC
  const currentMicroscopeReading = useMemo(() => {
    const reading = generateBendingReading(
      simState.currentMassKg,
      simState.materialKey,
      simState.supportDistanceM,
      simState.overhangM,
      simState.breadthM,
      simState.thicknessM,
      simState.seed
    );
    const elevMm = loadingMode === 'loading' ? reading.loadingReadingMm : reading.unloadingReadingMm;
    return splitMicroscopeReading(elevMm);
  }, [simState, loadingMode]);

  // Record reading for current mass
  // Record reading for current mass and advance to next load so 3D beam visibly deflects
  const handleRecordCurrentReading = useCallback(() => {
    const reading = generateBendingReading(
      simState.currentMassKg,
      simState.materialKey,
      simState.supportDistanceM,
      simState.overhangM,
      simState.breadthM,
      simState.thicknessM,
      simState.seed
    );

    setSimState((prev) => {
      const existingIdx = prev.readings.findIndex(
        (r) => Math.abs(r.massKg - prev.currentMassKg) < 0.001
      );
      let updatedReadings: BendingReading[];

      if (existingIdx >= 0) {
        const existing = prev.readings[existingIdx];
        const newLoad =
          loadingMode === 'loading' ? reading.loadingReadingMm : existing.loadingReadingMm;
        const newUnload =
          loadingMode === 'unloading' ? reading.unloadingReadingMm : existing.unloadingReadingMm;
        const meanElev = Number(((newLoad + newUnload) / 2.0).toFixed(2));
        const updatedRow: BendingReading = {
          massKg: prev.currentMassKg,
          loadingReadingMm: newLoad,
          unloadingReadingMm: newUnload,
          meanElevationMm: meanElev,
          eOverMMmPerKg: Number((meanElev / prev.currentMassKg).toFixed(2)),
          stressMpa: reading.stressMpa,
        };
        updatedReadings = [...prev.readings];
        updatedReadings[existingIdx] = updatedRow;
      } else {
        updatedReadings = [...prev.readings, reading].sort((a, b) => a.massKg - b.massKg);
      }

      // Automatically advance to next mass step so 3D beam deflects visibly
      let nextMass = prev.currentMassKg;
      if (loadingMode === 'loading') {
        if (prev.currentMassKg < 0.5) nextMass = Number((prev.currentMassKg + 0.1).toFixed(2));
      } else {
        if (prev.currentMassKg > 0.1) nextMass = Number((prev.currentMassKg - 0.1).toFixed(2));
      }

      return {
        ...prev,
        currentMassKg: nextMass,
        readings: updatedReadings,
      };
    });
  }, [simState, loadingMode]);

  // Populate complete loading sequence with step-by-step 3D deflection animation
  const handleAutoRecordAllReadings = useCallback(() => {
    const masses = [0.1, 0.2, 0.3, 0.4, 0.5];
    masses.forEach((m, idx) => {
      setTimeout(() => {
        setSimState((prev) => {
          const r = generateBendingReading(
            m,
            prev.materialKey,
            prev.supportDistanceM,
            prev.overhangM,
            prev.breadthM,
            prev.thicknessM,
            prev.seed
          );
          const filtered = prev.readings.filter((row) => Math.abs(row.massKg - m) > 0.001);
          return {
            ...prev,
            currentMassKg: m,
            readings: [...filtered, r].sort((a, b) => a.massKg - b.massKg),
          };
        });
      }, idx * 160);
    });
  }, []);

  // Clear all observations
  const handleClearObservations = useCallback(() => {
    setSimState((prev) => ({ ...prev, readings: [] }));
  }, []);

  // Save session
  const handleSaveSession = useCallback(async () => {
    await onSave(
      simState,
      `Young's Modulus (${MATERIALS[simState.materialKey].name})`,
      `Uniform bending run with ${simState.readings.length} observations`
    );
  }, [onSave, simState]);

  // Current bending stress in MPa
  const currentStressMpa = useMemo(() => {
    const sPa = maxBendingStress(
      simState.currentMassKg,
      simState.overhangM,
      simState.breadthM,
      simState.thicknessM
    );
    return Number((sPa / 1e6).toFixed(1));
  }, [simState]);

  // Analytical & regression results
  const {
    meanYPa,
    stdDevYPa,
    slopeYPa,
    meanEOverMMmPerKg,
    regressionSlopeMm,
    regressionInterceptMm,
  } = useMemo(() => {
    if (simState.readings.length === 0) {
      return {
        meanYPa: 0,
        stdDevYPa: 0,
        slopeYPa: 0,
        meanEOverMMmPerKg: 0,
        regressionSlopeMm: 0,
        regressionInterceptMm: 0,
      };
    }

    const yValues = simState.readings.map((r) =>
      youngsModulusFromElevation(
        r.massKg,
        simState.overhangM,
        simState.supportDistanceM,
        simState.breadthM,
        simState.thicknessM,
        r.meanElevationMm * 1e-3
      )
    );

    const mY = mean(yValues);
    const sY = sampleStdDev(yValues);

    const xs = simState.readings.map((r) => r.massKg);
    const ysMm = simState.readings.map((r) => r.meanElevationMm);
    const regMm = linearRegression(xs, ysMm);

    // Convert slope to SI units (m / kg):
    const slopeSI = regMm.slope * 1e-3;
    const slopeY = youngsModulusFromSlope(
      slopeSI,
      simState.overhangM,
      simState.supportDistanceM,
      simState.breadthM,
      simState.thicknessM
    );

    const meanEOverMVal = mean(simState.readings.map((r) => r.eOverMMmPerKg));

    return {
      meanYPa: mY,
      stdDevYPa: sY,
      slopeYPa: slopeY,
      meanEOverMMmPerKg: meanEOverMVal,
      regressionSlopeMm: regMm.slope,
      regressionInterceptMm: regMm.intercept,
    };
  }, [simState]);

  // Chart dataset and linear fit
  const chartDatasets: ChartDataset[] = useMemo(() => {
    const points = simState.readings.map((r) => ({
      x: r.massKg,
      y: r.meanElevationMm,
    }));
    return [
      {
        label: 'Mean Elevation e (mm)',
        points,
        type: 'scatter',
        color: '#8d1b2e',
      },
    ];
  }, [simState.readings]);

  const chartFitLine = useMemo(() => {
    if (simState.readings.length < 2) return undefined;
    return {
      slope: regressionSlopeMm,
      intercept: regressionInterceptMm,
    };
  }, [simState.readings.length, regressionSlopeMm, regressionInterceptMm]);

  // Observation table columns definition
  const tableColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: 'massKg', label: 'Load Mass M', unit: 'kg' },
      { key: 'loadingReadingMm', label: 'Loading (h₁)', unit: 'mm' },
      { key: 'unloadingReadingMm', label: 'Unloading (h₂)', unit: 'mm' },
      { key: 'meanElevationMm', label: 'Mean Elevation (e)', unit: 'mm' },
      { key: 'eOverMMmPerKg', label: 'e / M', unit: 'mm/kg' },
      { key: 'stressMpa', label: 'Max Stress (σ)', unit: 'MPa' },
    ],
    []
  );

  const tableRows = useMemo(
    () =>
      simState.readings.map((r) => ({
        massKg: r.massKg.toFixed(2),
        loadingReadingMm: r.loadingReadingMm.toFixed(2),
        unloadingReadingMm: r.unloadingReadingMm.toFixed(2),
        meanElevationMm: r.meanElevationMm.toFixed(2),
        eOverMMmPerKg: r.eOverMMmPerKg.toFixed(2),
        stressMpa: r.stressMpa.toFixed(1),
      })),
    [simState.readings]
  );

  return (
    <LabShell
      title="Young's Modulus — Uniform Bending Method"
      sessionCode="SESSION 04"
      backUrl="/dashboard"
      saveControls={
        <div className={styles.saveSlotWrap}>
          {saveStatus === 'saved' && (
            <span className={`${styles.saveStatus} ${styles.saveSuccess}`}>Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className={`${styles.saveStatus} ${styles.saveError}`}>
              {saveMessage || 'Save Error'}
            </span>
          )}
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSaveSession}
            disabled={isReadOnly || saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Session'}
          </button>
        </div>
      }
      controls={
        <div className={styles.controlsColumn}>
          <ControlPanel
            materialKey={simState.materialKey}
            onMaterialChange={handleMaterialChange}
            massKg={simState.currentMassKg}
            onMassChange={handleMassChange}
            loadingMode={loadingMode}
            onLoadingModeChange={setLoadingMode}
            microscopeReading={currentMicroscopeReading}
            onRecordCurrentReading={handleRecordCurrentReading}
            onAutoRecordAllReadings={handleAutoRecordAllReadings}
            stressMpa={currentStressMpa}
            yieldStrengthMpa={Number(
              (MATERIALS[simState.materialKey].yieldStrengthPa / 1e6).toFixed(0)
            )}
            isClamped={isClamped}
            isReadOnly={isReadOnly}
          />

          <DimensionInspection
            breadthTrials={simState.breadthTrials}
            thicknessTrials={simState.thicknessTrials}
            onAddBreadthTrial={handleAddBreadthTrial}
            onAddThicknessTrial={handleAddThicknessTrial}
            supportDistanceM={simState.supportDistanceM}
            overhangM={simState.overhangM}
            onSupportDistanceChange={handleSupportDistanceChange}
            onOverhangChange={handleOverhangChange}
            isReadOnly={isReadOnly}
          />
        </div>
      }
      visualization={
        <div className={styles.visualizationColumn}>
          <BendingScene
            materialKey={simState.materialKey}
            massKg={simState.currentMassKg}
            elevationM={currentTheoreticalElevationM}
            exaggerationFactor={simState.exaggerationFactor}
            onExaggerationChange={handleExaggerationChange}
            supportDistanceM={simState.supportDistanceM}
            overhangM={simState.overhangM}
            beamLengthM={simState.lengthM}
            breadthM={simState.breadthM}
            thicknessM={simState.thicknessM}
          />
        </div>
      }
      results={
        <div className={styles.resultsColumn}>
          <div className={styles.resultsGrid}>
            <DataTable
              title="Uniform Bending Observations"
              columns={tableColumns}
              rows={tableRows}
              onClearRows={handleClearObservations}
              emptyMessage="No load observations recorded yet. Select load M and record readings."
            />

            <ChartPanel
              title="Central Rise e vs Load Mass M"
              xLabel="Mass M (kg)"
              yLabel="Elevation e (mm)"
              datasets={chartDatasets}
              fitLine={chartFitLine}
              height={320}
            />
          </div>
        </div>
      }
      theoryProcedure={<TheoryProcedureDrawer />}
      resultBanner={
        <ResultBanner
          meanYPa={meanYPa}
          stdDevYPa={stdDevYPa}
          slopeYPa={slopeYPa}
          meanEOverMMmPerKg={meanEOverMMmPerKg}
          trueYPa={MATERIALS[simState.materialKey].youngsModulusPa}
          revealed={simState.revealedTrueValue}
          onToggleReveal={handleToggleReveal}
          materialName={MATERIALS[simState.materialKey].name}
        />
      }
    />
  );
}

export function YoungsModulus({
  initialState,
  isReadOnly = false,
}: YoungsModulusProps) {
  const {
    status: saveStatus,
    message: saveMessage,
    save,
    currentSavedId,
    loadedState,
  } = useExperimentSave<YoungsModulusSavedState>({
    experimentId: 'youngs-modulus',
    isSavedState: isYoungsModulusSavedState,
    initialState,
    isReadOnly,
    defaultTitle: "Young's Modulus Uniform Bending Run",
  });

  const effectiveState = loadedState || initialState;

  return (
    <YoungsModulusLabCore
      key={currentSavedId || 'default'}
      initialState={effectiveState}
      isReadOnly={isReadOnly}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onSave={save}
    />
  );
}

export default YoungsModulus;
