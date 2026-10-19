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
  clampDistanceM,
  wavelengthFromSpot,
  wavelengthFromRegression,
} from './physics/grating';
import {
  createInitialSimState,
  generateOrderReading,
  computeAveragedOrders,
} from './sim/simState';
import {
  isLaserGratingSavedState,
  type LaserGratingSavedState,
  type OrderReading,
  type GratingMode,
} from './sim/types';
import { GratingCanvas } from './canvas/GratingCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { TheoryProcedureDrawer } from './ui/TheoryProcedureDrawer';
import { ResultBanner } from './ui/ResultBanner';
import styles from './laserGrating.module.css';

interface LaserGratingProps {
  initialState?: unknown;
  isReadOnly?: boolean;
}

export function LaserGrating({
  initialState,
  isReadOnly = false,
}: LaserGratingProps) {
  const {
    status: saveStatus,
    message: saveMessage,
    save,
    currentSavedId,
    loadedState,
  } = useExperimentSave<LaserGratingSavedState>({
    experimentId: 'laser-grating',
    isSavedState: isLaserGratingSavedState,
    initialState,
    isReadOnly,
    defaultTitle: 'Diffraction Grating Laser Run',
  });

  const effectiveState = loadedState || initialState;

  return (
    <LaserGratingLabCore
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
  onSave: (state: LaserGratingSavedState, title?: string) => Promise<boolean>;
}

function LaserGratingLabCore({
  initialState,
  isReadOnly,
  saveStatus,
  saveMessage,
  onSave,
}: LabCoreProps) {
  const [simState, setSimState] = useState<LaserGratingSavedState>(() =>
    createInitialSimState(initialState)
  );

  const [saveTitle, setSaveTitle] = useState('Diffraction Grating Laser Run');
  const [distanceClampedWarning, setDistanceClampedWarning] = useState(false);

  // Active laser wavelength: known mode uses selectedWavelengthM, unknown mode uses hidden trueWavelengthM
  const activeWavelengthM =
    simState.mode === 'known' ? simState.selectedWavelengthM : simState.trueWavelengthM;

  // Grating density change
  const handleLinesPerMmChange = useCallback(
    (n: number) => {
      if (isReadOnly) return;
      setSimState((prev) => {
        const wl = prev.mode === 'known' ? prev.selectedWavelengthM : prev.trueWavelengthM;
        const updatedReadings = prev.readings
          .map((r) => generateOrderReading(r.n, wl, n, prev.distanceM, prev.seed))
          .filter((r): r is OrderReading => r !== null);
        return {
          ...prev,
          linesPerMm: n,
          readings: updatedReadings,
        };
      });
    },
    [isReadOnly]
  );

  // Mode change
  const handleModeChange = useCallback(
    (m: GratingMode) => {
      if (isReadOnly) return;
      setSimState((prev) => {
        const wl = m === 'known' ? prev.selectedWavelengthM : prev.trueWavelengthM;
        const updatedReadings = prev.readings
          .map((r) => generateOrderReading(r.n, wl, prev.linesPerMm, prev.distanceM, prev.seed))
          .filter((r): r is OrderReading => r !== null);
        return {
          ...prev,
          mode: m,
          readings: updatedReadings,
        };
      });
    },
    [isReadOnly]
  );

  // Practice wavelength change
  const handleSelectedWavelengthChange = useCallback(
    (wl: number) => {
      if (isReadOnly) return;
      setSimState((prev) => {
        const updatedReadings = prev.readings
          .map((r) => generateOrderReading(r.n, wl, prev.linesPerMm, prev.distanceM, prev.seed))
          .filter((r): r is OrderReading => r !== null);
        return {
          ...prev,
          selectedWavelengthM: wl,
          readings: updatedReadings,
        };
      });
    },
    [isReadOnly]
  );

  // Screen distance change
  const handleDistanceChange = useCallback(
    (dist: number) => {
      if (isReadOnly) return;
      const { clamped, wasClamped } = clampDistanceM(dist);
      setDistanceClampedWarning(wasClamped);
      setSimState((prev) => {
        const wl = prev.mode === 'known' ? prev.selectedWavelengthM : prev.trueWavelengthM;
        const updatedReadings = prev.readings
          .map((r) => generateOrderReading(r.n, wl, prev.linesPerMm, clamped, prev.seed))
          .filter((r): r is OrderReading => r !== null);
        return {
          ...prev,
          distanceM: clamped,
          readings: updatedReadings,
        };
      });
    },
    [isReadOnly]
  );

  // Measure all existing orders (n = -3..3)
  const handleMeasureAll = useCallback(() => {
    if (isReadOnly) return;
    const newReadings: OrderReading[] = [];
    for (const n of [-3, -2, -1, 0, 1, 2, 3]) {
      const reading = generateOrderReading(
        n,
        activeWavelengthM,
        simState.linesPerMm,
        simState.distanceM,
        simState.seed
      );
      if (reading) {
        newReadings.push(reading);
      }
    }
    setSimState((prev) => ({ ...prev, readings: newReadings }));
  }, [
    activeWavelengthM,
    isReadOnly,
    simState.distanceM,
    simState.linesPerMm,
    simState.seed,
  ]);

  // Clear readings
  const handleClearAll = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, readings: [] }));
  }, [isReadOnly]);

  // Record a single order reading from the canvas ruler caliper
  const handleRecordOrder = useCallback(
    (orderN: number, xMm: number) => {
      if (isReadOnly) return;
      const xM = xMm * 1e-3;
      const thetaRad = Math.atan(xM / simState.distanceM);
      const thetaDeg = Number(((thetaRad * 180) / Math.PI).toFixed(3));
      const sinTheta = Number((xM / Math.hypot(xM, simState.distanceM)).toFixed(5));
      const lambdaM =
        orderN !== 0
          ? wavelengthFromSpot(orderN, xM, simState.linesPerMm, simState.distanceM)
          : 0;
      const lambdaNm = Number((lambdaM * 1e9).toFixed(1));

      const newReading: OrderReading = {
        n: orderN,
        xMm: Number(xMm.toFixed(1)),
        thetaDeg,
        sinTheta,
        lambdaNm,
      };

      setSimState((prev) => {
        const filtered = prev.readings.filter((r) => r.n !== orderN);
        const updated = [...filtered, newReading].sort((a, b) => a.n - b.n);
        return { ...prev, readings: updated };
      });
    },
    [isReadOnly, simState.distanceM, simState.linesPerMm]
  );

  // Toggle true value revelation
  const handleToggleReveal = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, revealedTrueValue: !prev.revealedTrueValue }));
  }, [isReadOnly]);

  // Save Setup
  const handleSaveClick = useCallback(async () => {
    if (isReadOnly) return;
    await onSave(simState, saveTitle);
  }, [isReadOnly, onSave, simState, saveTitle]);

  // Statistical calculations and linear regression
  const {
    meanLambdaNm,
    stdDevLambdaNm,
    regressionLambdaNm,
    trueLambdaNm,
    percentErr,
    regressionFit,
  } = useMemo(() => {
    const nonZero = simState.readings.filter((r) => r.n !== 0);
    const lambdas = nonZero.map((r) => r.lambdaNm);
    const meanL = mean(lambdas);
    const sDev = sampleStdDev(lambdas);

    const xs = nonZero.map((r) => r.n);
    const ys = nonZero.map((r) => r.sinTheta);
    const reg = linearRegression(xs, ys);

    const regLambdaM =
      reg.slope > 0
        ? wavelengthFromRegression(reg.slope, simState.linesPerMm)
        : 0;
    const regLambdaNm = regLambdaM * 1e9;

    const trueLNm = activeWavelengthM * 1e9;
    const pErr = percentError(meanL, trueLNm);

    return {
      meanLambdaNm: meanL,
      stdDevLambdaNm: sDev,
      regressionLambdaNm: regLambdaNm,
      trueLambdaNm: trueLNm,
      percentErr: pErr,
      regressionFit: reg,
    };
  }, [simState.readings, simState.linesPerMm, activeWavelengthM]);

  // Averaged symmetric orders (+/- n)
  const averagedOrders = useMemo(
    () => computeAveragedOrders(simState.readings, simState.linesPerMm),
    [simState.readings, simState.linesPerMm]
  );

  // Main observation table columns
  const tableColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: 'n', label: 'Order n' },
      { key: 'xMm', label: 'Position xₙ', unit: 'mm' },
      { key: 'thetaDeg', label: 'Angle θₙ', unit: '°' },
      { key: 'sinTheta', label: 'sin(θₙ)' },
      { key: 'lambdaNm', label: 'Wavelength λ', unit: 'nm' },
    ],
    []
  );

  const tableRows = useMemo(
    () =>
      simState.readings.map((r) => ({
        n: r.n > 0 ? `+${r.n}` : String(r.n),
        xMm: r.xMm.toFixed(1),
        thetaDeg: r.thetaDeg.toFixed(3),
        sinTheta: r.sinTheta.toFixed(5),
        lambdaNm: r.n === 0 ? '—' : r.lambdaNm.toFixed(1),
      })),
    [simState.readings]
  );

  // Averaged symmetric table columns
  const avgTableColumns: TableColumn<Record<string, unknown>>[] = useMemo(
    () => [
      { key: 'orderAbs', label: 'Order |n|' },
      { key: 'xAvgMm', label: '|x| Avg', unit: 'mm' },
      { key: 'sinThetaAvg', label: 'sin(θ) Avg' },
      { key: 'lambdaNm', label: 'λ Avg', unit: 'nm' },
    ],
    []
  );

  const avgTableRows = useMemo(
    () =>
      averagedOrders.map((a) => ({
        orderAbs: `±${a.orderAbs}`,
        xAvgMm: a.xAvgMm.toFixed(2),
        sinThetaAvg: a.sinThetaAvg.toFixed(5),
        lambdaNm: a.lambdaNm.toFixed(1),
      })),
    [averagedOrders]
  );

  // Chart datasets: sin(theta) vs n
  const chartDatasets: ChartDataset[] = useMemo(() => {
    const nonZero = simState.readings.filter((r) => r.n !== 0);
    return [
      {
        label: 'Diffraction Orders',
        type: 'scatter',
        points: nonZero.map((r) => ({ x: r.n, y: r.sinTheta })),
        color: '#ef4444',
      },
    ];
  }, [simState.readings]);

  const chartFitLine = useMemo(() => {
    const nonZero = simState.readings.filter((r) => r.n !== 0);
    if (nonZero.length < 2) return undefined;
    return {
      slope: regressionFit.slope,
      intercept: regressionFit.intercept,
    };
  }, [simState.readings, regressionFit.slope, regressionFit.intercept]);

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
      sessionCode="Session 09"
      title="Determination of Wavelength of Laser Using Diffraction Grating"
      saveControls={saveControlsSlot}
      controls={
        <ControlPanel
          linesPerMm={simState.linesPerMm}
          onLinesPerMmChange={handleLinesPerMmChange}
          mode={simState.mode}
          onModeChange={handleModeChange}
          selectedWavelengthM={simState.selectedWavelengthM}
          onSelectedWavelengthChange={handleSelectedWavelengthChange}
          distanceM={simState.distanceM}
          onDistanceChange={handleDistanceChange}
          distanceClampedWarning={distanceClampedWarning}
          onMeasureAll={handleMeasureAll}
          onClearAll={handleClearAll}
          hasReadings={simState.readings.length > 0}
          isReadOnly={isReadOnly}
        />
      }
      visualization={
        <GratingCanvas
          wavelengthM={activeWavelengthM}
          linesPerMm={simState.linesPerMm}
          distanceM={simState.distanceM}
          onRecordOrder={handleRecordOrder}
          isReadOnly={isReadOnly}
        />
      }
      results={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <DataTable
            title="Observation Table: Diffraction Orders n = -3..3"
            columns={tableColumns}
            rows={tableRows}
            onClearRows={simState.readings.length > 0 ? handleClearAll : undefined}
            emptyMessage="No diffraction orders recorded yet. Drag the caliper or click Auto-Record."
          />

          {averagedOrders.length > 0 && (
            <DataTable
              title="Symmetric Averaged Orders (±n Pairs)"
              columns={avgTableColumns}
              rows={avgTableRows}
              emptyMessage="Averaged pairs will appear after recording both +n and -n orders."
            />
          )}

          <ChartPanel
            title="sin(θₙ) vs Diffraction Order n"
            xLabel="Order n"
            yLabel="sin(θₙ)"
            datasets={chartDatasets}
            fitLine={chartFitLine}
            height={260}
          />
        </div>
      }
      theoryProcedure={<TheoryProcedureDrawer />}
      resultBanner={
        <ResultBanner
          meanLambdaNm={meanLambdaNm}
          stdDevLambdaNm={stdDevLambdaNm}
          regressionLambdaNm={regressionLambdaNm}
          trueLambdaNm={trueLambdaNm}
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

export default LaserGrating;
