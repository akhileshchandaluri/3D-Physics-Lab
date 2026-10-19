import { describe, it, expect } from 'vitest';
import {
  hallCoefficient,
  hallVoltage,
  carrierDensityFromRh,
  calculateMagneticField,
  generateHallReading,
  SAMPLES,
} from './hall';

describe('Hall Effect Physics Engine', () => {
  it('computes theoretical R_H and V_H for n-type Ge matching test values within 0.5%', () => {
    const sample = SAMPLES['n-germanium'];
    const rh = hallCoefficient(sample.carrierDensityM3, sample.type);

    // |R_H| = 1 / (2e21 * 1.602177e-19) = 3.12075e-3 m^3 / C ~ 3.1209e-3 m^3 / C
    const absRh = Math.abs(rh);
    expect(absRh).toBeCloseTo(3.1209e-3, 5);
    expect(rh).toBeLessThan(0); // negative sign for electrons

    const currentA = 5e-3; // 5 mA
    const fieldT = 0.5; // 0.5 T
    const thicknessM = 0.5e-3; // 0.5 mm

    const vH = hallVoltage(rh, currentA, fieldT, thicknessM);
    const absVhMv = Math.abs(vH) * 1e3; // in mV

    // |V_H| = 15.60 mV
    expect(absVhMv).toBeCloseTo(15.60, 1);
    expect(vH).toBeLessThan(0); // negative for electrons
  });

  it('recovers carrier density n within 0.1% via round trip', () => {
    const originalN = 2.0e21;
    const rh = hallCoefficient(originalN, 'n-type');
    const recoveredN = carrierDensityFromRh(Math.abs(rh));

    const relError = Math.abs(recoveredN - originalN) / originalN;
    expect(relError).toBeLessThan(0.001); // within 0.1%
  });

  it('removes misalignment offset voltage V_0 exactly via field reversal', () => {
    const v0Mv = 0.3; // 0.3 mV offset
    const sampleKey = 'n-germanium';
    const reading = generateHallReading(1, 0.005, 2.0, sampleKey, 0.0005, 42, false);

    // With noise off, (V(+B) - V(-B)) / 2 must equal true V_H
    const sample = SAMPLES[sampleKey];
    const b = calculateMagneticField(2.0);
    const rh = hallCoefficient(sample.carrierDensityM3, sample.type);
    const expectedVhMv = (hallVoltage(rh, 0.005, b, 0.0005)) * 1e3;

    expect(reading.hallVoltageMv).toBeCloseTo(expectedVhMv, 2);
    expect(reading.offsetVoltageMv).toBeCloseTo(v0Mv, 2);
  });

  it('smoothly saturates magnetic field above 0.45 T', () => {
    // k = 0.25 T/A
    // At I = 1.0 A: B = 0.25 T (strictly linear)
    expect(calculateMagneticField(1.0)).toBeCloseTo(0.25, 4);

    // At I = 1.8 A: B = 0.45 T (threshold)
    expect(calculateMagneticField(1.8)).toBeCloseTo(0.45, 4);

    // At I = 2.5 A: linear would be 0.625 T, but soft saturation dampens it
    const bSat = calculateMagneticField(2.5);
    expect(bSat).toBeGreaterThan(0.45);
    expect(bSat).toBeLessThan(0.55);
    expect(bSat).toBeLessThan(0.25 * 2.5);
  });

  it('correctly handles p-type germanium with positive R_H and V_H', () => {
    const pSample = SAMPLES['p-germanium'];
    const rh = hallCoefficient(pSample.carrierDensityM3, pSample.type);
    expect(rh).toBeGreaterThan(0);

    const vH = hallVoltage(rh, 0.005, 0.5, 0.0005);
    expect(vH).toBeGreaterThan(0);
  });
});
