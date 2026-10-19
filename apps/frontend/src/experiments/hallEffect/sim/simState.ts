import type { HallReading } from '../physics/hall';

export interface HallSimState {
  currentA: number; // Specimen current in Amperes (0.001..0.010 A)
  magnetCurrentA: number; // Magnet coil current in Amperes (0..2.5 A)
  fieldDirection: '+B' | '-B';
  probePolarity: 'normal' | 'reversed';
  sampleKey: string;
  thicknessM: number;
  widthM: number;
  lengthM: number;
  readingsCurrent: HallReading[]; // V_H vs I at fixed B
  readingsField: HallReading[]; // V_H vs B at fixed I
  activeTab: 'current' | 'field';
  revealedTrueValue: boolean;
  seed: number;
}

export const INITIAL_HALL_STATE: HallSimState = {
  currentA: 0.005, // 5 mA
  magnetCurrentA: 2.0, // 2 A -> B = 0.5 T
  fieldDirection: '+B',
  probePolarity: 'normal',
  sampleKey: 'n-germanium',
  thicknessM: 0.0005, // 0.5 mm
  widthM: 0.005, // 5.0 mm
  lengthM: 0.01, // 10.0 mm
  readingsCurrent: [],
  readingsField: [],
  activeTab: 'current',
  revealedTrueValue: false,
  seed: 1042,
};

export function isHallSavedState(obj: unknown): obj is HallSimState {
  if (!obj || typeof obj !== 'object') return false;
  const state = obj as Record<string, unknown>;
  return (
    typeof state.currentA === 'number' &&
    typeof state.magnetCurrentA === 'number' &&
    (state.fieldDirection === '+B' || state.fieldDirection === '-B') &&
    (state.probePolarity === 'normal' || state.probePolarity === 'reversed') &&
    typeof state.sampleKey === 'string' &&
    typeof state.thicknessM === 'number' &&
    Array.isArray(state.readingsCurrent) &&
    Array.isArray(state.readingsField)
  );
}
