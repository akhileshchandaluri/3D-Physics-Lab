import { useState, useCallback } from 'react';

const materialProperties: Record<string, { beta: number; k: number; snapThreshold: number }> = {
  lead: { beta: 0.00005, k: 0.000001, snapThreshold: 0.15 },
  copper: { beta: 0.00002, k: 0.0000005, snapThreshold: 0.08 },
  aluminum: { beta: 0.00003, k: 0.0000008, snapThreshold: 0.10 },
};

interface SimulationFrame {
  timeMinutes: number;
  timeSeconds: number;
  timeOneThird: number;
  elongation: number;
  instantaneousLength: number;
  deltaLOverL0: number;
  deltaLOverLt: number;
}

interface SimulationData {
  material: string;
  initialLength: number;
  loadMass: number;
  beta: number;
  k: number;
  history: SimulationFrame[];
}

interface UseCreepParams {
  initialLength: number;
  loadMass: number;
  totalDuration: number;
  interval: number;
  materialType: string;
}

export function useCreep(defaults: UseCreepParams) {
  const [initialLength, setInitialLength] = useState(defaults.initialLength);
  const [loadMass, setLoadMass] = useState(defaults.loadMass);
  const [totalDuration, setTotalDuration] = useState(defaults.totalDuration);
  const [interval, setInterval] = useState(defaults.interval);
  const [materialType, setMaterialType] = useState(defaults.materialType);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const runSimulation = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const props = materialProperties[materialType];
      if (!props) {
        throw new Error('Unknown material type');
      }

      const betaEffective = props.beta * loadMass;
      const kEffective = props.k * loadMass;

      const history: SimulationFrame[] = [];
      const timeInSeconds = totalDuration * 60;
      const intervalInSeconds = interval * 60;
      const numberOfSteps = Math.floor(timeInSeconds / intervalInSeconds);

      history.push({
        timeMinutes: 0,
        timeSeconds: 0,
        timeOneThird: 0,
        elongation: 0,
        instantaneousLength: initialLength,
        deltaLOverL0: 0,
        deltaLOverLt: 0,
      });

      let previousLength = initialLength;
      let snapped = false;

      for (let step = 1; step <= numberOfSteps; step++) {
        const t = step * intervalInSeconds;
        const deltaLTransient = betaEffective * initialLength * Math.pow(t, 1 / 3);
        const deltaLViscous = kEffective * previousLength * t;
        const totalElongation = deltaLTransient + deltaLViscous;
        const currentLength = initialLength + totalElongation;
        const deltaLOverL0 = totalElongation / initialLength;
        const deltaLOverLt = totalElongation / currentLength;

        if (deltaLOverL0 >= props.snapThreshold) {
          snapped = true;
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

      setSimulationData({
        material: materialType,
        initialLength,
        loadMass,
        beta: betaEffective,
        k: kEffective,
        history,
      });
      setCurrentFrameIdx(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }, [initialLength, loadMass, totalDuration, interval, materialType]);

  const hasSnapped = simulationData ? (simulationData.history[currentFrameIdx]?.deltaLOverL0 ?? 0) >= (materialProperties[materialType]?.snapThreshold ?? 1) : false;

  return {
    initialLength, setInitialLength,
    loadMass, setLoadMass,
    totalDuration, setTotalDuration,
    interval, setInterval,
    materialType, setMaterialType,
    simulationData,
    currentFrameIdx, setCurrentFrameIdx,
    isPlaying, setIsPlaying,
    hasSnapped,
    runSimulation,
    data,
    loading,
    error,
  };
}
