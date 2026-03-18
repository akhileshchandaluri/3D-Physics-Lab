// src/experiments/ohmsLaw/physics.ts
import { OhmsInput, OhmsResult, IVCurveDataPoint } from './types';
import { ALPHA_COPPER, T_ROOM, MAX_CURRENT_FOR_GLOW } from './constants';

export function computeOhmsLaw(input: OhmsInput): OhmsResult {
  const { voltage, resistance, temperature } = input;
  const effectiveResistance = resistance * (1 + ALPHA_COPPER * (temperature - T_ROOM));
  const current = voltage / effectiveResistance;
  const power = voltage * current;
  const brightnessRatio = Math.min(current / MAX_CURRENT_FOR_GLOW, 1); // e.g., 120mA = full brightness
  return {
    current,
    currentMa: current * 1000,
    effectiveResistance,
    power,
    brightnessRatio,
  };
}

export function generateIVCurve(
  resistance: number,
  temperature: number,
  steps = 49
): IVCurveDataPoint[] {
  const R = resistance * (1 + ALPHA_COPPER * (temperature - T_ROOM));
  return Array.from({ length: steps }, (_, i) => {
    const v = (i / (steps - 1)) * 24;
    return { x: parseFloat(v.toFixed(2)), y: parseFloat(((v / R) * 1000).toFixed(3)) };
  });
}
