import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SolarCellResult } from '../../../backend/src/experiments/solarCell/types';
import { computeSolarCell } from '../../../backend/src/experiments/solarCell/physics';

const SOLAR_FALLBACK_DATA = {
  slug: 'solar-cell-characteristics',
  title: 'Solar Cell Characteristics',
  overview:
    'The Solar Cell Characteristics experiment studies the relationship between voltage, current, and power output of a solar cell under varying light conditions and load resistance. The experiment helps analyze the electrical behavior and efficiency of photovoltaic devices.',
  aim:
    '• Study the V-I characteristics of a solar cell\n' +
    '• Analyze the effect of light intensity\n' +
    '• Determine output power characteristics\n' +
    '• Understand photovoltaic behavior',
  theory:
    'A solar cell converts light energy into electrical energy using the photovoltaic effect. When light falls on the semiconductor junction, electron-hole pairs are generated, producing electric current.\n\n' +
    'The output current and voltage depend on:\n' +
    '• Light intensity\n' +
    '• Temperature\n' +
    '• Load resistance\n\n' +
    'The V-I and P-V characteristic curves help determine the operating behavior and efficiency of the solar cell.',
  formula: 'Current: I = V / R\nPower: P = VI\nEfficiency approximation: η ≈ Pout / Pin',
  conclusion:
    'The experiment verifies the electrical characteristics of a solar cell and demonstrates the relationship between voltage, current, and power under varying conditions. The V-I and P-V curves help analyze the efficiency and operating region of the photovoltaic system.',
};

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
  const [rheostatResistance, setRheostatResistance] = useState(25);
  const [loadResistance, setLoadResistance] = useState(20);
  const [isExperimentStarted, setIsExperimentStarted] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/experiments/solar-cell-characteristics');
        if (!res.ok) throw new Error('Failed to fetch experiment');
        setData(await res.json());
        setError(null);
      } catch {
        setData(SOLAR_FALLBACK_DATA);
        setError(null);
      } finally {
        setLoading(false);
      }
    };
    fetchExperiment();
  }, []);

  const simulationResult = useMemo<SolarCellResult>(() => {
    return computeSolarCell({
      lightIntensity,
      rheostatResistance,
      loadResistance,
    });
  }, [lightIntensity, rheostatResistance, loadResistance]);

  const startExperiment = useCallback(async () => {
    // Keep API integration while preserving responsive local updates.
    try {
      await fetch('/api/experiments/solar-cell-characteristics/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lightIntensity, rheostatResistance, loadResistance }),
      });
    } catch {
      // Local simulation continues even if backend is unavailable.
    }
    setIsExperimentStarted(true);
  }, [lightIntensity, rheostatResistance, loadResistance]);

  return {
    lightIntensity,
    setLightIntensity,
    rheostatResistance,
    setRheostatResistance,
    loadResistance,
    setLoadResistance,
    isExperimentStarted,
    setIsExperimentStarted,
    startExperiment,
    simulationResult,
    data,
    loading,
    error,
  };
}
