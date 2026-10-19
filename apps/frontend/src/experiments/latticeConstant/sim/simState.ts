import type { PickedPeakObservation } from '../physics/bragg';

export interface LatticeSimState {
  crystalKey: string;
  sourceKey: string;
  currentTwoThetaDeg: number;
  isScanning: boolean;
  scanSpeed: number; // Scan step / speed
  selectedPeakId: string | null;
  pickedPeaks: PickedPeakObservation[];
  revealedTrueValue: boolean;
  seed: number;
}

export const INITIAL_LATTICE_STATE: LatticeSimState = {
  crystalKey: 'nacl',
  sourceKey: 'cu-ka',
  currentTwoThetaDeg: 10.0,
  isScanning: false,
  scanSpeed: 1.0,
  selectedPeakId: null,
  pickedPeaks: [],
  revealedTrueValue: false,
  seed: 2048,
};

export function isLatticeSavedState(obj: unknown): obj is LatticeSimState {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return (
    typeof s.crystalKey === 'string' &&
    typeof s.sourceKey === 'string' &&
    typeof s.currentTwoThetaDeg === 'number' &&
    Array.isArray(s.pickedPeaks) &&
    typeof s.seed === 'number'
  );
}
