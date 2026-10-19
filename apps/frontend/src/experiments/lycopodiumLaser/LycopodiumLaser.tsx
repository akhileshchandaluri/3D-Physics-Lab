import { useState, useMemo, useCallback } from 'react';
import { LabShell } from '../../components/lab/LabShell';
import { ChartPanel } from '../../components/lab/ChartPanel';
import { DataTable } from '../../components/lab/DataTable';
import { useExperimentSave } from '../../components/lab/useExperimentSave';
import type { TableColumn, ChartDataset } from '../../components/lab/types';
import {
  mean,
  sampleStdDev,
  linearRegression,
  percentError,
} from '../../lib/stats';
import {
  DARK_RING_K,
  SAMPLE_DIAMETERS,
  clampDistanceM,
  particleDiameterFromRadius,
  particleDiameterFromRegression,
} from './physics/lycopodium';
import {
  createInitialSimState,
  generateRingReading,
} from './sim/simState';
import {
  isLycopodiumSavedState,
  type LycopodiumSavedState,
  type RingReading,
  type SampleKey,
} from './sim/types';
import { DiffractionCanvas } from './canvas/DiffractionCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { TheoryProcedureDrawer } from './ui/TheoryProcedureDrawer';
import { ResultBanner } from './ui/ResultBanner';
import styles from './lycopodiumLaser.module.css';

interface LycopodiumLaserProps {
  initialState?: unknown;
  isReadOnly?: boolean;
}

export function LycopodiumLaser({
  initialState,
  isReadOnly = false,
}: LycopodiumLaserProps) {
  const {
    status: saveStatus,
    message: saveMessage,
    save,
    currentSavedId,
    loadedState,
  } = useExperimentSave<LycopodiumSavedState>({
    experimentId: 'lycopodium-laser',
    isSavedState: isLycopodiumSavedState,
    initialState,
    isReadOnly,
    defaultTitle: 'Lycopodium Laser Diffraction Run',
  });

  const effectiveState = loadedState || initialState;

  return (
    <LycopodiumLabCore
      key={currentSavedId || 'default'}
      initialState={effectiveState}
      isReadOnly={isReadOnly}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onSave={save}
    />
  );
}

interface LabCoreProps {
  initialState?: unknown;
  isReadOnly: boolean;
  saveStatus: string;
  saveMessage: string | null;
  onSave: (state: LycopodiumSavedState, title?: string) => Promise<boolean>;
}

function LycopodiumLabCore({
  initialState,
  isReadOnly,
  saveStatus,
  saveMessage,
  onSave,
}: LabCoreProps) {
  const [simState, setSimState] = useState<LycopodiumSavedState>(() =>
    createInitialSimState(initialState)
  );

  const [saveTitle, setSaveTitle] = useState('Lycopodium Laser Diffraction Run');
  const [distanceClampedWarning, setDistanceClampedWarning] = useState(false);

  // Wavelength Change Handler
  const handleWavelengthChange = useCallback(
    (wl: number) => {
      if (isReadOnly) return;
      setSimState((prev) => ({
        ...prev,
        wavelengthM: wl,
        // Regenerate readings for new wavelength
        readings: prev.readings.map((r) =>
          generateRingReading(r.n, wl, prev.distanceM, prev.sampleKey, prev.seed)
        ),
      }));
    },
    [isReadOnly]
  );

  // Distance Change Handler
  const handleDistanceChange = useCallback(
    (dist: number) => {
      if (isReadOnly) return;
      const { clamped, wasClamped } = clampDistanceM(dist);
      setDistanceClampedWarning(wasClamped);
      setSimState((prev) => ({
        ...prev,
        distanceM: clamped,
        readings: prev.readings.map((r) =>
          generateRingReading(r.n, prev.wavelengthM, clamped, prev.sampleKey, prev.seed)
        ),
      }));
    },
    [isReadOnly]
  );

  // Sample Selection Change Handler
  const handleSampleChange = useCallback(
    (sample: SampleKey) => {
      if (isReadOnly) return;
      setSimState((prev) => ({
        ...prev,
        sampleKey: sample,
        readings: prev.readings.map((r) =>
          generateRingReading(r.n, prev.wavelengthM, prev.distanceM, sample, prev.seed)
        ),
      }));
    },
    [isReadOnly]
  );

  // Auto-record rings 1 to 4 with seeded noise and progressive animation
  const handleMeasureAll = useCallback(() => {
    if (isReadOnly) return;
    [1, 2, 3, 4].forEach((n, idx) => {
      setTimeout(() => {
        setSimState((prev) => {
          const r = generateRingReading(
            n,
            prev.wavelengthM,
            prev.distanceM,
            prev.sampleKey,
            prev.seed
          );
          const filtered = prev.readings.filter((row) => row.n !== n);
          return {
            ...prev,
            readings: [...filtered, r].sort((a, b) => a.n - b.n),
          };
        });
      }, idx * 150);
    });
  }, [isReadOnly]);

  // Clear recorded readings
  const handleClearAll = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, readings: [] }));
  }, [isReadOnly]);

  // Record a single ring from the ruler crosshair measurement
  const handleRecordRing = useCallback(
    (orderN: number, measuredDiameterMm: number) => {
      if (isReadOnly) return;
      const radiusMm = Number((measuredDiameterMm / 2).toFixed(2));
      const radiusM = radiusMm * 1e-3;
      const kn = DARK_RING_K[orderN - 1];
      const sinTheta = Number((radiusM / Math.hypot(radiusM, simState.distanceM)).toFixed(5));
      const estDiameterM = particleDiameterFromRadius(
        orderN,
        radiusM,
        simState.distanceM,
        simState.wavelengthM
      );
      const dUm = Number((estDiameterM * 1e6).toFixed(2));

      const newReading: RingReading = {
        n: orderN,
        kn,
        diameterMm: Number(measuredDiameterMm.toFixed(2)),
        radiusMm,
        sinTheta,
        dUm,
      };

      setSimState((prev) => {
        const filtered = prev.readings.filter((r) => r.n !== orderN);
        const updated = [...filtered, newReading].sort((a, b) => a.n - b.n);
        return { ...prev, readings: updated };
      });
    },
    [isReadOnly, simState.distanceM, simState.wavelengthM]
  );

  // Toggle reveal true diameter and error
  const handleToggleReveal = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, revealedTrueValue: !prev.revealedTrueValue }));
  }, [isReadOnly]);

  // Save Setup
  const handleSaveClick = useCallback(async () => {
    if (isReadOnly) return;
    await onSave(simState, saveTitle);
  }, [isReadOnly, onSave, simState, saveTitle]);

  // Statistical calculations
  const { meanDUm, stdDevDUm, regressionDUm, trueDiameterUm, percentErr, regressionFit } =
    useMemo(() => {
      const readings = simState.readings;
      const dVals = readings.map((r) => r.dUm);
      const meanD = mean(dVals);
      const sDev = sampleStdDev(dVals);

      const xs = readings.map((r) => r.kn);
      const ys = readings.map((r) => r.radiusMm);
      const reg = linearRegression(xs, ys);

      // slope is in mm per dimensionless kn. Convert to meters:
      const slopeM = (reg.slope * 1e-3);
      const regD =
        slopeM > 0
          ? particleDiameterFromRegression(
              slopeM,
              simState.distanceM,
              simState.wavelengthM
            ) * 1e6
          : 0;

      const trueDiamM = SAMPLE_DIAMETERS[simState.sampleKey];
      const trueDiamUm = trueDiamM * 1e6;
      const pErr = percentError(meanD, trueDiamUm);

      return {
        meanDUm: meanD,
        stdDevDUm: sDev,
        regressionDUm: regD,
        trueDiameterUm: trueDiamUm,
        percentErr: pErr,
        regressionFit: reg,
      };
    }, [simState.readings, simState.distanceM, simState.wavelengthM, simState.sampleKey]);

  // Table Columns
  const tableColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: 'n', label: 'Ring Order n' },
      { key: 'kn', label: 'Bessel Zero kₙ' },
      { key: 'diameterMm', label: 'Diameter 2rₙ', unit: 'mm' },
      { key: 'radiusMm', label: 'Radius rₙ', unit: 'mm' },
      { key: 'sinTheta', label: 'sin(θₙ)' },
      { key: 'dUm', label: 'Size d', unit: 'µm' },
    ],
    []
  );

  // Table Rows
  const tableRows = useMemo(
    () =>
      simState.readings.map((r) => ({
        n: r.n,
        kn: r.kn,
        diameterMm: r.diameterMm.toFixed(2),
        radiusMm: r.radiusMm.toFixed(2),
        sinTheta: r.sinTheta.toFixed(5),
        dUm: r.dUm.toFixed(2),
      })),
    [simState.readings]
  );

  // Chart Dataset
  const chartDatasets: ChartDataset[] = useMemo(() => {
    return [
      {
        label: 'Ring Measurements',
        type: 'scatter',
        points: simState.readings.map((r) => ({ x: r.kn, y: r.radiusMm })),
        color: '#8d1b2e',
      },
    ];
  }, [simState.readings]);

  // Fit line for ChartPanel
  const chartFitLine = useMemo(() => {
    if (simState.readings.length < 2) return undefined;
    return {
      slope: regressionFit.slope,
      intercept: regressionFit.intercept,
    };
  }, [simState.readings.length, regressionFit.slope, regressionFit.intercept]);

  // Save controls slot for top bar
  const saveControlsSlot = (
    <div className={styles.saveControls}>
      {!isReadOnly && (
        <>
          <input
            type="text"
            className={styles.saveInput}
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Save run title..."
          />
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSaveClick}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : '💾 Save Setup'}
          </button>
        </>
      )}
      {saveMessage && (
        <span
          className={`${styles.statusMsg} ${
            saveStatus === 'saved' ? styles.statusSaved : styles.statusError
          }`}
        >
          {saveMessage}
        </span>
      )}
    </div>
  );

  return (
    <LabShell
      sessionCode="Session 03"
      title="Determination of Particle Size of Lycopodium Powder Using Laser"
      saveControls={saveControlsSlot}
      controls={
        <ControlPanel
          wavelengthM={simState.wavelengthM}
          onWavelengthChange={handleWavelengthChange}
          distanceM={simState.distanceM}
          onDistanceChange={handleDistanceChange}
          sampleKey={simState.sampleKey}
          onSampleChange={handleSampleChange}
          distanceClampedWarning={distanceClampedWarning}
          onMeasureAll={handleMeasureAll}
          onClearAll={handleClearAll}
          hasReadings={simState.readings.length > 0}
          isReadOnly={isReadOnly}
        />
      }
      visualization={
        <DiffractionCanvas
          wavelengthM={simState.wavelengthM}
          distanceM={simState.distanceM}
          sampleKey={simState.sampleKey}
          onRecordRing={handleRecordRing}
          isReadOnly={isReadOnly}
        />
      }
      results={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DataTable
            title="Observation Table: Dark Ring Radii & Particle Size"
            columns={tableColumns}
            rows={tableRows}
            onClearRows={simState.readings.length > 0 ? handleClearAll : undefined}
            emptyMessage="No dark rings recorded yet. Measure rings using the caliper overlay or click Auto-Record."
          />
          <ChartPanel
            title="Ring Radius rₙ vs Bessel Zero Constant kₙ"
            xLabel="Bessel Zero Constant kₙ (Dimensionless)"
            yLabel="Dark Ring Radius rₙ (mm)"
            datasets={chartDatasets}
            fitLine={chartFitLine}
            height={260}
          />
        </div>
      }
      theoryProcedure={<TheoryProcedureDrawer />}
      resultBanner={
        <ResultBanner
          meanDUm={meanDUm}
          stdDevDUm={stdDevDUm}
          regressionDUm={regressionDUm}
          trueDiameterUm={trueDiameterUm}
          percentErrorVal={percentErr}
          revealed={simState.revealedTrueValue}
          onToggleReveal={handleToggleReveal}
          hasReadings={simState.readings.length > 0}
          isReadOnly={isReadOnly}
        />
      }
    />
  );
}

export default LycopodiumLaser;
