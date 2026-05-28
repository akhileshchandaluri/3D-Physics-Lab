export interface SolarCellInput {
  lightIntensity: number; // %
  rheostatResistance: number; // ohm
  loadResistance: number; // ohm
}

export interface SolarCurvePoint {
  voltage: number; // V
  current: number; // A
  power: number; // W
}

export interface SolarCellResult {
  voltage: number; // V across load
  current: number; // A
  power: number; // W
  efficiency: number; // 0-1 approx
  ivCurve: SolarCurvePoint[];
  pvCurve: SolarCurvePoint[];
}
