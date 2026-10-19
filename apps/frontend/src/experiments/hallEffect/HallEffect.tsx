import { useState, useCallback, useMemo } from 'react';
import { LabShell } from '../../components/lab/LabShell';
import { DataTable } from '../../components/lab/DataTable';
import { ChartPanel } from '../../components/lab/ChartPanel';
import { useExperimentSave } from '../../components/lab/useExperimentSave';
import type { TableColumn } from '../../components/lab/types';
import type { ExperimentProps } from '../types';
import { HallCanvas } from './canvas/HallCanvas';
import { ControlPanel } from './ui/ControlPanel';
import { TheoryDrawer } from './ui/TheoryDrawer';
import { ResultBanner } from './ui/ResultBanner';
import {
  generateHallReading,
  carrierDensityFromRh,
  conductivityFromVoltage,
  mobilityFromRhAndSigma,
  longitudinalVoltage,
  SAMPLES,
  calculateMagneticField,
  type HallReading,
} from './physics/hall';
import { linearRegression, percentError } from '../../lib/stats';
import {
  INITIAL_HALL_STATE,
  isHallSavedState,
  type HallSimState,
} from './sim/simState';
import styles from './hallEffect.module.css';

interface LabCoreProps {
  initialState?: unknown;
  isReadOnly: boolean;
  saveStatus: string;
  saveMessage: string | null;
  onSave: (state: HallSimState, title?: string, notes?: string) => Promise<boolean>;
}

function HallEffectLabCore({
  initialState,
  isReadOnly,
  saveStatus,
  saveMessage,
  onSave,
}: LabCoreProps) {
  const [simState, setSimState] = useState<HallSimState>(() => {
    if (isHallSavedState(initialState)) return initialState;
    return INITIAL_HALL_STATE;
  });

  const sample = SAMPLES[simState.sampleKey] || SAMPLES['n-germanium'];

  // Handlers for parameters
  const handleSampleChange = useCallback(
    (key: string) => {
      if (isReadOnly) return;
      setSimState((prev) => ({
        ...prev,
        sampleKey: key,
        readingsCurrent: [],
        readingsField: [],
      }));
    },
    [isReadOnly]
  );

  const handleCurrentChange = useCallback(
    (valA: number) => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, currentA: valA }));
    },
    [isReadOnly]
  );

  const handleMagnetCurrentChange = useCallback(
    (valA: number) => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, magnetCurrentA: valA }));
    },
    [isReadOnly]
  );

  const handleFieldDirectionChange = useCallback(
    (dir: '+B' | '-B') => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, fieldDirection: dir }));
    },
    [isReadOnly]
  );

  const handleProbePolarityChange = useCallback(
    (pol: 'normal' | 'reversed') => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, probePolarity: pol }));
    },
    [isReadOnly]
  );

  const handleTabChange = useCallback(
    (tab: 'current' | 'field') => {
      if (isReadOnly) return;
      setSimState((prev) => ({ ...prev, activeTab: tab }));
    },
    [isReadOnly]
  );

  // Record a single reading for current settings with +B and -B cancellation
  const handleRecordCurrentReading = useCallback(() => {
    if (isReadOnly) return;
    const isCurrentTab = simState.activeTab === 'current';
    const activeReadings = isCurrentTab ? simState.readingsCurrent : simState.readingsField;
    const step = activeReadings.length + 1;

    const reading = generateHallReading(
      step,
      simState.currentA,
      simState.magnetCurrentA,
      simState.sampleKey,
      simState.thicknessM,
      simState.seed,
      true
    );

    setSimState((prev) => {
      if (isCurrentTab) {
        return {
          ...prev,
          readingsCurrent: [...prev.readingsCurrent, reading],
        };
      } else {
        return {
          ...prev,
          readingsField: [...prev.readingsField, reading],
        };
      }
    });
  }, [
    isReadOnly,
    simState.activeTab,
    simState.currentA,
    simState.magnetCurrentA,
    simState.readingsCurrent,
    simState.readingsField,
    simState.sampleKey,
    simState.seed,
    simState.thicknessM,
  ]);

  // Auto-record sequence of 6 points with progressive animation
  const handleAutoRecordSequence = useCallback(() => {
    if (isReadOnly) return;
    const isCurrentTab = simState.activeTab === 'current';

    if (isCurrentTab) {
      // Vary current: 1.0, 2.5, 4.0, 5.5, 7.0, 8.5 mA
      const currents = [0.001, 0.0025, 0.004, 0.0055, 0.007, 0.0085];
      currents.forEach((curr, idx) => {
        setTimeout(() => {
          setSimState((prev) => {
            const r = generateHallReading(
              idx + 1,
              curr,
              prev.magnetCurrentA,
              prev.sampleKey,
              prev.thicknessM,
              prev.seed,
              true
            );
            return {
              ...prev,
              currentA: curr,
              readingsCurrent: [...prev.readingsCurrent, r],
            };
          });
        }, idx * 160);
      });
    } else {
      // Vary magnet current: 0.5, 0.8, 1.2, 1.6, 2.0, 2.4 A
      const magnets = [0.5, 0.8, 1.2, 1.6, 2.0, 2.4];
      magnets.forEach((mag, idx) => {
        setTimeout(() => {
          setSimState((prev) => {
            const r = generateHallReading(
              idx + 1,
              prev.currentA,
              mag,
              prev.sampleKey,
              prev.thicknessM,
              prev.seed,
              true
            );
            return {
              ...prev,
              magnetCurrentA: mag,
              readingsField: [...prev.readingsField, r],
            };
          });
        }, idx * 160);
      });
    }
  }, [isReadOnly, simState.activeTab]);

  // Clear observations
  const handleClearReadings = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({
      ...prev,
      readingsCurrent: prev.activeTab === 'current' ? [] : prev.readingsCurrent,
      readingsField: prev.activeTab === 'field' ? [] : prev.readingsField,
    }));
  }, [isReadOnly]);

  // Toggle true value reveal
  const handleToggleReveal = useCallback(() => {
    if (isReadOnly) return;
    setSimState((prev) => ({ ...prev, revealedTrueValue: !prev.revealedTrueValue }));
  }, [isReadOnly]);

  // Save session
  const handleSaveSession = useCallback(async () => {
    if (isReadOnly) return;
    await onSave(
      simState,
      `Hall Effect (${sample.name})`,
      `Recorded ${simState.readingsCurrent.length + simState.readingsField.length} Hall data points`
    );
  }, [isReadOnly, onSave, simState, sample.name]);

  // Table columns definition
  const tableColumns: TableColumn<HallReading>[] = useMemo(() => {
    if (simState.activeTab === 'current') {
      return [
        { key: 'step', label: '#' },
        { key: 'currentMa', label: 'Current I', unit: 'mA' },
        { key: 'fieldT', label: 'Field B', unit: 'T' },
        { key: 'voltagePositiveBMv', label: 'V(+B)', unit: 'mV' },
        { key: 'voltageNegativeBMv', label: 'V(-B)', unit: 'mV' },
        { key: 'hallVoltageMv', label: 'Hall V_H', unit: 'mV' },
        {
          key: 'rhM3PerC',
          label: 'R_H',
          unit: 'm³/C',
          render: (row: HallReading) => row.rhM3PerC.toExponential(3),
        },
      ];
    } else {
      return [
        { key: 'step', label: '#' },
        { key: 'magnetCurrentA', label: 'Magnet I_m', unit: 'A' },
        { key: 'fieldT', label: 'Field B', unit: 'T' },
        { key: 'voltagePositiveBMv', label: 'V(+B)', unit: 'mV' },
        { key: 'voltageNegativeBMv', label: 'V(-B)', unit: 'mV' },
        { key: 'hallVoltageMv', label: 'Hall V_H', unit: 'mV' },
        {
          key: 'rhM3PerC',
          label: 'R_H',
          unit: 'm³/C',
          render: (row: HallReading) => row.rhM3PerC.toExponential(3),
        },
      ];
    }
  }, [simState.activeTab]);

  const activeTableRows =
    simState.activeTab === 'current' ? simState.readingsCurrent : simState.readingsField;

  // Linear regression and analytical results
  const { meanRh, meanDensity, carrierType, mobility, regSlope, regIntercept, errPct } =
    useMemo(() => {
      const activeRows =
        simState.activeTab === 'current' ? simState.readingsCurrent : simState.readingsField;
      if (activeRows.length === 0) {
        return {
          meanRh: 0,
          meanDensity: 0,
          carrierType: 'undetermined' as const,
          mobility: 0,
          regSlope: 0,
          regIntercept: 0,
          errPct: undefined,
        };
      }

      const rhSum = activeRows.reduce((acc, r) => acc + r.rhM3PerC, 0);
      const avgRh = rhSum / activeRows.length;
      const absAvgRh = Math.abs(avgRh);
      const nEst = carrierDensityFromRh(absAvgRh);
      const type = avgRh < 0 ? ('n-type' as const) : ('p-type' as const);

      // Longitudinal conductivity & mobility
      const vc = longitudinalVoltage(
        0.005,
        sample.carrierDensityM3,
        sample.mobilityM2Vs,
        simState.lengthM,
        simState.widthM,
        simState.thicknessM
      );
      const sigmaEst = conductivityFromVoltage(
        0.005,
        vc,
        simState.lengthM,
        simState.widthM,
        simState.thicknessM
      );
      const muEst = mobilityFromRhAndSigma(absAvgRh, sigmaEst);

      // Linear regression on active tab
      let xs: number[];
      let ys: number[];
      if (simState.activeTab === 'current') {
        xs = activeRows.map((r) => r.currentMa * 1e-3); // A
        ys = activeRows.map((r) => r.hallVoltageMv * 1e-3); // V
      } else {
        xs = activeRows.map((r) => r.fieldT); // T
        ys = activeRows.map((r) => r.hallVoltageMv * 1e-3); // V
      }
      const reg = linearRegression(xs, ys);

      const err = percentError(nEst, sample.carrierDensityM3);

      return {
        meanRh: avgRh,
        meanDensity: nEst,
        carrierType: type,
        mobility: muEst,
        regSlope: reg.slope,
        regIntercept: reg.intercept,
        errPct: err,
      };
    }, [
      simState.activeTab,
      simState.readingsCurrent,
      simState.readingsField,
      simState.lengthM,
      simState.widthM,
      simState.thicknessM,
      sample,
    ]);

  // Chart dataset
  const chartDatasets = useMemo(() => {
    if (activeTableRows.length === 0) return [];
    const isCurrent = simState.activeTab === 'current';
    const points = activeTableRows.map((r) => ({
      x: isCurrent ? r.currentMa : r.fieldT,
      y: r.hallVoltageMv,
    }));

    return [
      {
        label: isCurrent ? 'Hall Voltage V_H vs Current I' : 'Hall Voltage V_H vs Field B',
        points,
        type: 'scatter' as const,
        color: '#8d1b2e',
      },
    ];
  }, [activeTableRows, simState.activeTab]);

  const fitLine = useMemo(() => {
    if (activeTableRows.length < 2) return undefined;
    const isCurrent = simState.activeTab === 'current';
    const slopeDisplay = isCurrent ? regSlope : regSlope * 1e3;
    const interceptDisplay = regIntercept * 1e3;
    return {
      slope: slopeDisplay,
      intercept: interceptDisplay,
    };
  }, [activeTableRows.length, regSlope, regIntercept, simState.activeTab]);

  return (
    <LabShell
      sessionCode="Session 06"
      title="Determination of Hall Coefficient Using Hall Effect"
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
          sampleKey={simState.sampleKey}
          meanRhM3PerC={meanRh}
          meanDensityM3={meanDensity}
          carrierType={carrierType}
          mobilityM2Vs={mobility}
          revealedTrueValue={simState.revealedTrueValue}
          onToggleReveal={handleToggleReveal}
          percentError={errPct}
        />
      }
      controls={
        <div className={styles.controlsColumn}>
          <ControlPanel
            sampleKey={simState.sampleKey}
            onSampleChange={handleSampleChange}
            currentA={simState.currentA}
            onCurrentChange={handleCurrentChange}
            magnetCurrentA={simState.magnetCurrentA}
            onMagnetCurrentChange={handleMagnetCurrentChange}
            fieldDirection={simState.fieldDirection}
            onFieldDirectionChange={handleFieldDirectionChange}
            probePolarity={simState.probePolarity}
            onProbePolarityChange={handleProbePolarityChange}
            activeTab={simState.activeTab}
            onTabChange={handleTabChange}
            onRecordCurrentReading={handleRecordCurrentReading}
            onAutoRecordSequence={handleAutoRecordSequence}
            onClearReadings={handleClearReadings}
            isReadOnly={isReadOnly}
          />
        </div>
      }
      visualization={
        <div className={styles.visualizationColumn}>
          <HallCanvas
            sampleKey={simState.sampleKey}
            currentA={simState.currentA}
            magnetCurrentA={simState.magnetCurrentA}
            fieldDirection={simState.fieldDirection}
            probePolarity={simState.probePolarity}
            thicknessM={simState.thicknessM}
          />
        </div>
      }
      results={
        <div className={styles.resultsColumn}>
          <div className={styles.resultsGrid}>
            <DataTable<HallReading>
              title={
                simState.activeTab === 'current'
                  ? `Observations: V_H vs Current I (B = ${calculateMagneticField(simState.magnetCurrentA).toFixed(3)} T)`
                  : `Observations: V_H vs Magnetic Field B (I = ${(simState.currentA * 1e3).toFixed(1)} mA)`
              }
              columns={tableColumns}
              rows={activeTableRows}
              onClearRows={activeTableRows.length > 0 ? handleClearReadings : undefined}
              emptyMessage="No observations recorded yet. Click 'Record Reading' or 'Auto-Record'."
            />

            <ChartPanel
              title={
                simState.activeTab === 'current'
                  ? 'Hall Voltage V_H (mV) vs Specimen Current I (mA)'
                  : 'Hall Voltage V_H (mV) vs Magnetic Field B (T)'
              }
              xLabel={simState.activeTab === 'current' ? 'Current I (mA)' : 'Field B (T)'}
              yLabel="Hall Voltage V_H (mV)"
              datasets={chartDatasets}
              fitLine={fitLine}
              height={320}
            />
          </div>
        </div>
      }
    />
  );
}

export function HallEffect({
  initialState,
  isReadOnly = false,
}: ExperimentProps) {
  const {
    status: saveStatus,
    message: saveMessage,
    save,
    currentSavedId,
    loadedState,
  } = useExperimentSave<HallSimState>({
    experimentId: 'hall-effect',
    isSavedState: isHallSavedState,
    initialState,
    isReadOnly,
    defaultTitle: 'Hall Effect Experiment Session',
  });

  const effectiveState = loadedState || initialState;

  return (
    <HallEffectLabCore
      key={currentSavedId || 'default'}
      initialState={effectiveState}
      isReadOnly={isReadOnly}
      saveStatus={saveStatus}
      saveMessage={saveMessage}
      onSave={save}
    />
  );
}

export default HallEffect;
