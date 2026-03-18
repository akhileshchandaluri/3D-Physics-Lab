// src/experiments/ohmsLaw/types.ts

export interface OhmsInput {
  voltage: number;       // V
  resistance: number;    // Ω at room temp
  temperature: number;   // °C
}

export interface OhmsResult {
  current: number;          // A
  currentMa: number;        // mA (for display)
  effectiveResistance: number; // Ω after temperature correction
  power: number;            // W
  brightnessRatio: number;  // 0–1 for bulb glow
}

export interface IVCurveDataPoint {
  x: number; // Voltage (V)
  y: number; // Current (mA)
}
