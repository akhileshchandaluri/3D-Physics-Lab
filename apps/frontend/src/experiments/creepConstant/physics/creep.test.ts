import { describe, expect, it } from 'vitest'
import { G } from './materials'
import {
  RUPTURE_LAB_SEC,
  creepDeltaCm,
  elasticExtensionM,
  fitTransientBeta,
  fitViscousK,
  maxSafeMassKg,
  totalExtensionM,
  wouldYield,
} from './creep'

describe('elastic extension', () => {
  it('matches FL/AE for 1 kg on a 1 m mild-steel wire of 0.50 mm diameter', () => {
    const diameterM = 0.0005
    const area = (Math.PI * diameterM * diameterM) / 4
    const expected = G / (area * 200e9)
    expect(expected * 1000).toBeCloseTo(0.2497, 4)
    expect(elasticExtensionM(1, 1, diameterM, 200e9)).toBeCloseTo(expected, 12)
  })

  it('is zero when the wire is unloaded', () => {
    expect(elasticExtensionM(0, 0.15, 0.001, 16e9)).toBe(0)
  })
})

describe('Andrade creep', () => {
  it('follows Andrade until late in the half hour, then reaches 31 percent at 30 minutes', () => {
    const beta = 4.11e-4
    const viscousK = 2.78e-6
    const early = 15 * (beta * Math.cbrt(600) + viscousK * 600)
    expect(creepDeltaCm(15, beta, viscousK, 600, 0.31)).toBeCloseTo(early, 6)
    expect(creepDeltaCm(15, beta, viscousK, RUPTURE_LAB_SEC, 0.31)).toBeCloseTo(15 * 0.31, 6)
  })

  it('is zero before the clock starts', () => {
    expect(creepDeltaCm(15, 4.11e-4, 2.78e-6, 0, 0.31)).toBe(0)
  })
})

describe('total extension', () => {
  it('adds the current elastic stretch to creep measured from the frozen gauge length', () => {
    const elastic = elasticExtensionM(0.2, 0.15, 0.001, 16e9)
    const creepM = creepDeltaCm(15.01, 4.11e-4, 2.78e-6, 100, 0.31) / 100
    expect(
      totalExtensionM({
        massKg: 0.2,
        lengthM: 0.15,
        diameterM: 0.001,
        youngsModulusPa: 16e9,
        referenceLengthM: 0.1501,
        beta: 4.11e-4,
        viscousK: 2.78e-6,
        elongationAtBreak: 0.31,
        creepTimeSec: 100,
      }),
    ).toBeCloseTo(elastic + creepM, 12)
  })
})

describe('yield', () => {
  it('accepts 200 g on a 1 mm soldering-lead wire', () => {
    expect(wouldYield(0.2, 0.001, 12e6)).toBe(false)
    expect(maxSafeMassKg(0.001, 12e6)).toBeGreaterThan(0.2)
  })

  it('refuses 0.5 kg on a 0.50 mm lead wire', () => {
    expect(wouldYield(0.5, 0.0005, 12e6)).toBe(true)
    expect(maxSafeMassKg(0.0005, 12e6)).toBeCloseTo(0.2403, 3)
  })
})

describe('workbook slopes', () => {
  it('recovers β from Δl/l0 against t^(1/3)', () => {
    const beta = 4.11e-4
    const l0Cm = 15
    const points = [10, 40, 120, 400, 1200].map((timeSec) => {
      const delta = l0Cm * beta * Math.cbrt(timeSec)
      return { timeSec, l0Cm, ltCm: l0Cm + delta }
    })
    expect(fitTransientBeta(points)).toBeCloseTo(beta, 8)
  })

  it('recovers k from Δl/lt against t when the extension is the viscous term alone', () => {
    const viscousK = 2.78e-6
    const l0Cm = 15
    const points = [10, 40, 120, 400, 1200].map((timeSec) => {
      const deltaOverLt = viscousK * timeSec
      const ltCm = l0Cm / (1 - deltaOverLt)
      return { timeSec, l0Cm, ltCm }
    })
    expect(fitViscousK(points)).toBeCloseTo(viscousK, 10)
  })

  it('withholds a result until four readings cover a useful time span', () => {
    const short = [10, 12, 14].map((timeSec) => ({ timeSec, l0Cm: 15, ltCm: 15.01 }))
    const tight = [10, 11, 12, 13].map((timeSec) => ({ timeSec, l0Cm: 15, ltCm: 15.01 }))
    expect(fitTransientBeta(short)).toBeNull()
    expect(fitViscousK(tight)).toBeNull()
  })
})
