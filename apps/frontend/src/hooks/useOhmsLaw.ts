import { useState, useMemo } from 'react';
// Importing the pure physics functions and types from the backend
import { computeOhmsLaw, generateIVCurve } from '../../../backend/src/experiments/ohmsLaw/physics';
import type { OhmsInput, OhmsResult, IVCurveDataPoint } from '../../../backend/src/experiments/ohmsLaw/types';

export interface UseOhmsLawReturn extends OhmsResult {
  // Interactive State
  voltage: number;
  resistance: number;
  temperature: number;
  
  // State Setters
  setVoltage: (v: number) => void;
  setResistance: (r: number) => void;
  setTemperature: (t: number) => void;
  
  // Graph Data
  ivCurve: IVCurveDataPoint[];
}

export function useOhmsLaw(initialValues: Partial<OhmsInput> = {}): UseOhmsLawReturn {
  // 1. Manage interactive UI state
  const [voltage, setVoltage] = useState<number>(initialValues.voltage ?? 5);
  const [resistance, setResistance] = useState<number>(initialValues.resistance ?? 10);
  const [temperature, setTemperature] = useState<number>(initialValues.temperature ?? 25);

  // 2. Compute physics results only when inputs change
  const physicsResult = useMemo<OhmsResult>(() => {
    return computeOhmsLaw({ voltage, resistance, temperature });
  }, [voltage, resistance, temperature]);

  // 3. Generate graph data points
  const ivCurve = useMemo<IVCurveDataPoint[]>(() => {
    return generateIVCurve(resistance, temperature);
  }, [resistance, temperature]);

  return {
    voltage,
    resistance,
    temperature,
    setVoltage,
    setResistance,
    setTemperature,
    ...physicsResult,
    ivCurve,
  };
}
