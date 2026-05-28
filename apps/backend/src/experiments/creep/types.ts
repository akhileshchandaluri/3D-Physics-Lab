export interface CreepInput {
  initialLength: number;    // cm
  loadMass: number;         // g
  totalDuration: number;    // minutes
  interval: number;         // minutes
  materialType: string;     // lead, copper, aluminum
}

export interface CreepFrame {
  timeMinutes: number;
  timeSeconds: number;
  timeOneThird: number;
  elongation: number;
  instantaneousLength: number;
  deltaLOverL0: number;
  deltaLOverLt: number;
}

export interface CreepResult {
  material: string;
  beta: number;
  k: number;
  history: CreepFrame[];
}
