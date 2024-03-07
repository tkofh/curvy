import { describe, expect, test } from 'vitest'
import { createBezierCurve } from '../src'
import { remapSamplesByLength, sampleCurve } from '../src/sample'

describe('sampleCurve', () => {
  test('throws for invalid minSamples', () => {
    expect(() =>
      sampleCurve(createBezierCurve([0, 1, 2, 3]), { minSamples: 0 }),
    ).toThrow()
  })

  test('throws for invalid maxError', () => {
    expect(() =>
      sampleCurve(createBezierCurve([0, 1, 2, 3]), { maxError: -1 }),
    ).toThrow()
  })

  test('takes at least minSamples ', () => {
    expect(
      sampleCurve(createBezierCurve([0, 5, -4, 1]), {
        maxError: false,
        minSamples: 32,
      }).size,
    ).toBe(32)
  })

  test('takes samples according to max error (straight line)', () => {
    expect(
      sampleCurve(createBezierCurve([0, 1, 2, 3]), {
        maxError: 0.1,
        minSamples: 2,
      }).size,
    ).toBe(2)
  })

  test('takes samples when there is one root of a cubic segment', () => {
    // start, root, max, end
    expect(
      sampleCurve(createBezierCurve([-1, 2, 1, 1]), {
        maxError: 100,
        minSamples: 2,
      }).size,
    ).toBe(4)
  })

  test('takes samples when there are three roots of a cubic segment', () => {
    // start, root, max, midpoint between max and min, root, min, root, end
    expect(
      sampleCurve(createBezierCurve([-1, 5, -4, 1]), {
        maxError: 100,
        minSamples: 2,
      }).size,
    ).toBe(8)
  })

  test('takes additional samples to enforce maxError', () => {
    expect(
      sampleCurve(createBezierCurve([-1, 5, -4, 1]), {
        maxError: 100,
        minSamples: 2,
      }).size,
    ).toBe(8)
    expect(
      sampleCurve(createBezierCurve([-1, 5, -4, 1]), {
        maxError: 0.01,
        minSamples: 2,
      }).size,
    ).toBe(12)
  })
})

describe('remapSamplesByLength', () => {
  test('it works', () => {
    const curve = createBezierCurve([0, 2, -3, 1])
    const samples = sampleCurve(curve, { minSamples: 256, maxError: 0.000001 })
    const byLength = remapSamplesByLength(samples)

    expect(byLength.get(0)).toBe(0)
    expect(byLength.get(1)).toBe(1)
  })
})
