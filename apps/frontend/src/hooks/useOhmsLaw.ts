import { useState, useEffect, useMemo, useCallback } from 'react';
import { computeOhmsLaw, generateIVCurve } from '../../../backend/src/experiments/ohmsLaw/physics';
import type { OhmsInput, OhmsResult, IVCurveDataPoint } from '../../../backend/src/experiments/ohmsLaw/types';

export interface UseOhmsLawReturn extends OhmsResult {
  voltage: number;
  resistance: number;
  temperature: number;
  setVoltage: (v: number) => void;
  setResistance: (r: number) => void;
  setTemperature: (t: number) => void;
  ivCurve: IVCurveDataPoint[];
  calculateVoltage: (current: number, resistance: number) => number;
  data: any;
  loading: boolean;
  error: string | null;
}

export function calculateVoltage(current: number, resistance: number): number {
  return current * resistance;
}

/**
 * Static fallback data for the Ohm's Law experiment.
 * Used when the backend API is unavailable.
 */
const OHMS_LAW_FALLBACK_DATA = {
  slug: 'ohms-law',
  title: "Ohm's Law",
  overview:
    "Ohm's Law is one of the most fundamental principles in electrical engineering and physics. " +
    "Discovered by Georg Simon Ohm in 1827, it describes the linear relationship between voltage (V), " +
    "current (I), and resistance (R) in an electrical circuit. This virtual experiment allows you to " +
    "explore this relationship interactively by adjusting voltage, resistance, and temperature parameters " +
    "while observing real-time changes in current, power, and circuit behavior.",
  aim:
    "To verify Ohm's Law by studying the relationship between voltage and current for a resistive conductor, " +
    "and to observe the effect of temperature on resistance. Students will:\n\n" +
    "• Understand the proportional relationship between voltage and current.\n" +
    "• Calculate resistance using the V-I characteristic curve.\n" +
    "• Investigate how temperature affects the resistance of a conductor.\n" +
    "• Measure electrical power dissipated in a resistor.",
  theory:
    "Ohm's Law states that the current flowing through a conductor between two points is directly " +
    "proportional to the voltage across the two points, provided the temperature and other physical " +
    "conditions remain constant.\n\n" +
    "Mathematically: V = I × R\n\n" +
    "Where:\n" +
    "• V = Voltage (Volts)\n" +
    "• I = Current (Amperes)\n" +
    "• R = Resistance (Ohms)\n\n" +
    "For a metallic conductor, resistance increases with temperature due to increased lattice vibrations " +
    "that impede electron flow. The temperature dependence is given by:\n\n" +
    "R(T) = R₀ × (1 + α × ΔT)\n\n" +
    "Where α is the temperature coefficient of resistance (0.004 /°C for copper) and ΔT is the " +
    "temperature change from the reference temperature (25°C).\n\n" +
    "The I-V characteristic of an ohmic conductor is a straight line passing through the origin, " +
    "with the slope equal to 1/R. Non-ohmic devices like diodes and transistors do not follow this linear relationship.",
  formula:
    "Key formulas used in this experiment:\n\n" +
    "1. Ohm's Law: I = V / R\n" +
    "2. Power: P = V × I = V² / R = I² × R\n" +
    "3. Temperature correction: R(T) = R₀(1 + α·ΔT)\n" +
    "4. Effective current: I = V / R(T)\n\n" +
    "Where:\n" +
    "• α (copper) = 0.004 /°C\n" +
    "• T₀ (reference) = 25°C\n" +
    "• R₀ = Resistance at reference temperature",
  conclusion:
    "Through this experiment, we have verified Ohm's Law and observed that:\n\n" +
    "1. Current is directly proportional to voltage when resistance is constant — the I-V curve is a straight line.\n" +
    "2. Current is inversely proportional to resistance when voltage is constant.\n" +
    "3. Increasing temperature increases the effective resistance of a conductor, resulting in lower current " +
    "for the same applied voltage.\n" +
    "4. Electrical power dissipated in the resistor increases with both voltage and current.\n\n" +
    "These observations confirm the fundamental principles of Ohm's Law and demonstrate the practical " +
    "effects of temperature on resistive circuits.",
};

export function useOhmsLaw(initialValues: Partial<OhmsInput> = {}): UseOhmsLawReturn {
  const [voltage, setVoltage] = useState<number>(initialValues.voltage ?? 5);
  const [resistance, setResistance] = useState<number>(initialValues.resistance ?? 10);
  const [temperature, setTemperature] = useState<number>(initialValues.temperature ?? 25);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/experiments/ohms-law');
        if (!res.ok) throw new Error('Failed to fetch experiment');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (_err) {
        // Backend unavailable — use static fallback data
        console.warn('Backend API unavailable, using fallback experiment data.');
        setData(OHMS_LAW_FALLBACK_DATA);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchExperiment();
  }, []);

  const physicsResult = useMemo<OhmsResult>(() => {
    return computeOhmsLaw({ voltage, resistance, temperature });
  }, [voltage, resistance, temperature]);

  const ivCurve = useMemo<IVCurveDataPoint[]>(() => {
    return generateIVCurve(resistance, temperature);
  }, [resistance, temperature]);

  const calculateVoltageFn = useCallback(calculateVoltage, []);

  return {
    voltage,
    resistance,
    temperature,
    setVoltage,
    setResistance,
    setTemperature,
    ...physicsResult,
    ivCurve,
    calculateVoltage: calculateVoltageFn,
    data,
    loading,
    error,
  };
}
