import { SimulationRequest, SimulationFrame } from '../types/simulation';

export class SimulationService {
  /**
   * Represents the fundamental properties of materials affecting creep rate.
   * beta = Transient creep coefficient
   * k = Viscous (steady-state) creep coefficient
   */
  private readonly materialProperties: Record<string, { beta: number; k: number }> = {
    // Arbitrary realistic scaling factors for demonstration purposes
    lead: { beta: 0.00005, k: 0.000001 },
    copper: { beta: 0.00002, k: 0.0000005 },
    aluminum: { beta: 0.00003, k: 0.0000008 },
  };

  /**
   * Executes the creep physics model based on the provided material request.
   */
  public generateSeries(request: SimulationRequest): { history: SimulationFrame[], beta: number, k: number } {
    const { initialLength, loadMass, totalDurationMinutes, intervalMinutes, materialType } = request;
    const materialConstants = this.materialProperties[materialType];

    // Scale properties appropriately based on the load mass
    const betaEffective = materialConstants.beta * loadMass;
    const kEffective = materialConstants.k * loadMass;

    const dataFrames: SimulationFrame[] = [];
    
    const timeInSeconds = totalDurationMinutes * 60;
    const intervalInSeconds = intervalMinutes * 60;
    const numberOfSteps = Math.floor(timeInSeconds / intervalInSeconds);

    // Initial Condition (t = 0)
    dataFrames.push({
      timeMinutes: 0,
      timeSeconds: 0,
      timeOneThird: 0,
      elongation: 0,
      instantaneousLength: initialLength,
      deltaLOverL0: 0,
      deltaLOverLt: 0
    });

    let previousLength = initialLength;

    for (let currentStep = 1; currentStep <= numberOfSteps; currentStep++) {
      const t = currentStep * intervalInSeconds;

      // Transient Creep (Δl_transient = β * l0 * t^(1/3))
      const deltaLTransient = betaEffective * initialLength * Math.pow(t, 1 / 3);

      // Viscous Creep (Δl_viscous = k * lt * t) -> Using the instantaneous/previous length
      const deltaLViscous = kEffective * previousLength * t;

      // Compute total elongation and the new instantaneous length
      const totalElongation = deltaLTransient + deltaLViscous;
      const currentLength = initialLength + totalElongation;

      const deltaLOverL0 = totalElongation / initialLength;
      const deltaLOverLt = totalElongation / currentLength;

      dataFrames.push({
        timeMinutes: t / 60,
        timeSeconds: t,
        timeOneThird: Math.pow(t, 1 / 3),
        elongation: totalElongation,
        instantaneousLength: currentLength,
        deltaLOverL0: deltaLOverL0,
        deltaLOverLt: deltaLOverLt
      });

      previousLength = currentLength;
    }

    return {
      history: dataFrames,
      beta: betaEffective,
      k: kEffective
    };
  }
}