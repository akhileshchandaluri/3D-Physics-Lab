import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SolarCellResult } from '../../../backend/src/experiments/solarCell/types';
import type { SolarExperimentRecord } from '../experiments/solarCell/types';
import { computeSolarCell } from '../../../backend/src/experiments/solarCell/physics';

export interface SolarObservation {
  id: number;
  trial: number;
  lightIntensity: number;
  resistance: number;
  voltage: number;
  current: number;
  power: number;
}

export function useSolarCell() {
  const [lightIntensity, setLightIntensity] = useState(100);
  const [loadResistance, setLoadResistance] = useState(20);
  const [keyClosed, setKeyClosed] = useState(true);
  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [data, setData] = useState<SolarExperimentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/experiments/solar-cell-characteristics');
        if (!res.ok) throw new Error('Failed to fetch experiment from database');
        setData(await res.json());
        setError(null);
      } catch (err: unknown) {
        setData(null);
        setError(err instanceof Error ? err.message : 'Failed to load experiment');
      } finally {
        setLoading(false);
      }
    };
    fetchExperiment();
  }, []);

  const simulationResult = useMemo<SolarCellResult>(() => {
    return computeSolarCell({
      lightIntensity,
      loadResistance,
      keyClosed,
    });
  }, [lightIntensity, loadResistance, keyClosed]);

  const startExperiment = useCallback(async () => {
    try {
      await fetch('/api/experiments/solar-cell-characteristics/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lightIntensity, loadResistance, keyClosed }),
      });
    } catch {
      // Local simulation continues even if backend is unavailable.
    }
    setIsExperimentStarted(true);
  }, [lightIntensity, loadResistance, keyClosed]);

  return {
    lightIntensity,
    setLightIntensity,
    loadResistance,
    setLoadResistance,
    keyClosed,
    setKeyClosed,
    isExperimentStarted,
    setIsExperimentStarted,
    startExperiment,
    simulationResult,
    data,
    loading,
    error,
  };
}
