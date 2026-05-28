import { SOLAR_MODEL_CONSTANTS } from './constants.js';
import type { SolarCellInput, SolarCellResult, SolarCurvePoint } from './types.js';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildIvCurve(isc: number, voc: number, steps = 60): SolarCurvePoint[] {
  return Array.from({ length: steps }, (_, i) => {
    const voltage = (i / (steps - 1)) * voc;
    const ratio = clamp(voltage / voc, 0, 1);
    const current = isc * Math.pow(1 - ratio, SOLAR_MODEL_CONSTANTS.formFactor);
    return {
      voltage: Number(voltage.toFixed(4)),
      current: Number(current.toFixed(4)),
      power: Number((voltage * current).toFixed(4)),
    };
  });
}

function findOperatingPoint(curve: SolarCurvePoint[], totalResistance: number): SolarCurvePoint {
  let best = curve[0];
  let minDiff = Number.POSITIVE_INFINITY;

  for (const point of curve) {
    const loadCurrent = point.voltage / totalResistance;
    const diff = Math.abs(point.current - loadCurrent);
    if (diff < minDiff) {
      minDiff = diff;
      best = point;
    }
  }

  return best;
}

export function computeSolarCell(input: SolarCellInput): SolarCellResult {
  const lightIntensity = clamp(input.lightIntensity, 20, 150);
  const rheostatResistance = clamp(input.rheostatResistance, 1, 120);
  const loadResistance = clamp(input.loadResistance, 1, 200);
  const totalResistance = rheostatResistance + loadResistance;

  const lightFactor = lightIntensity / 100;
  const isc = SOLAR_MODEL_CONSTANTS.iscBase * lightFactor;
  const voc = SOLAR_MODEL_CONSTANTS.vocBase * (0.94 + 0.06 * lightFactor);

  const ivCurve = buildIvCurve(isc, voc);
  const operatingPoint = findOperatingPoint(ivCurve, totalResistance);
  const power = operatingPoint.voltage * operatingPoint.current;

  const inputPower = (lightIntensity * 10) * SOLAR_MODEL_CONSTANTS.panelAreaM2; // W/m2 -> rough W
  const efficiency = clamp(power / Math.max(inputPower, 0.01), 0, 0.35);

  return {
    voltage: Number(operatingPoint.voltage.toFixed(4)),
    current: Number(operatingPoint.current.toFixed(4)),
    power: Number(power.toFixed(4)),
    efficiency: Number(efficiency.toFixed(4)),
    ivCurve,
    pvCurve: ivCurve,
  };
}
