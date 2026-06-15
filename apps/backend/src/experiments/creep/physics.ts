import type { CreepInput, CreepResult, CreepFrame } from './types.js';
import { MATERIAL_PROPERTIES } from './constants.js';

export function runCreepSimulation(input: CreepInput): CreepResult {
  const props = MATERIAL_PROPERTIES[input.materialType];
  if (!props) {
    throw new Error(`Unknown material: ${input.materialType}`);
  }

  const betaEffective = props.beta * input.loadMass;
  const kEffective = props.k * input.loadMass;

  const history: CreepFrame[] = [];
  const timeInSeconds = input.totalDuration * 60;
  const intervalInSeconds = input.interval * 60;
  const numberOfSteps = Math.floor(timeInSeconds / intervalInSeconds);

  history.push({
    timeMinutes: 0,
    timeSeconds: 0,
    timeOneThird: 0,
    elongation: 0,
    instantaneousLength: input.initialLength,
    deltaLOverL0: 0,
    deltaLOverLt: 0,
  });

  let previousLength = input.initialLength;

  for (let step = 1; step <= numberOfSteps; step++) {
    const t = step * intervalInSeconds;
    const deltaLTransient = betaEffective * input.initialLength * Math.pow(t, 1 / 3);
    const deltaLViscous = kEffective * previousLength * t;
    const totalElongation = deltaLTransient + deltaLViscous;
    const currentLength = input.initialLength + totalElongation;
    const deltaLOverL0 = totalElongation / input.initialLength;
    const deltaLOverLt = totalElongation / currentLength;

    if (deltaLOverL0 >= props.snapThreshold) {
      history.push({
        timeMinutes: t / 60,
        timeSeconds: t,
        timeOneThird: Math.pow(t, 1 / 3),
        elongation: totalElongation,
        instantaneousLength: currentLength,
        deltaLOverL0,
        deltaLOverLt,
      });
      break;
    }

    history.push({
      timeMinutes: t / 60,
      timeSeconds: t,
      timeOneThird: Math.pow(t, 1 / 3),
      elongation: totalElongation,
      instantaneousLength: currentLength,
      deltaLOverL0,
      deltaLOverLt,
    });

    previousLength = currentLength;
  }

  return {
    material: input.materialType,
    beta: betaEffective,
    k: kEffective,
    history,
  };
}
