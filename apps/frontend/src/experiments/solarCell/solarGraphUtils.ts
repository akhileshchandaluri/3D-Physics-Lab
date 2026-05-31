import type { SolarObservation } from '../../hooks/useSolarCell';

export interface SolarGraphMetrics {
  isc: SolarObservation;
  voc: SolarObservation;
  mpp: SolarObservation;
  fillFactor: number;
}

export function computeGraphMetrics(readings: SolarObservation[]): SolarGraphMetrics | null {
  if (readings.length < 2) return null;

  const mpp = readings.reduce((best, r) => (r.power > best.power ? r : best), readings[0]);
  const isc = readings.reduce((best, r) => (r.current > best.current ? r : best), readings[0]);
  const voc = readings.reduce((best, r) => (r.voltage > best.voltage ? r : best), readings[0]);

  const fillFactor =
    isc.current > 0 && voc.voltage > 0
      ? (mpp.current / isc.current) * (mpp.voltage / voc.voltage)
      : 0;

  return { isc, voc, mpp, fillFactor };
}

export function sortReadingsByVoltage(readings: SolarObservation[]): SolarObservation[] {
  return [...readings].sort((a, b) => a.voltage - b.voltage);
}
