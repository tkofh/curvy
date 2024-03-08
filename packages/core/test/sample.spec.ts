import { describe, expect, test } from 'vitest'
import { createBezierCurve } from '../src'
import { sampleCurveLength } from '../src/sample'

describe('sampleCurveLength', () => {
  test('takes at least minSamples ', () => {
    expect(
      sampleCurveLength(createBezierCurve([0, 5, -4, 1]), 32, false).size,
    ).toBe(32)
  })

  test('takes samples according to max error (straight line)', () => {
    expect(
      sampleCurveLength(createBezierCurve([0, 1, 2, 3]), 2, 0.1).size,
    ).toBe(2)
  })

  test('takes samples when there is one root of a cubic segment', () => {
    // start, root, max, end
    expect(
      sampleCurveLength(createBezierCurve([-1, 2, 1, 1]), 2, 100).size,
    ).toBe(4)
  })

  test('takes samples when there are three roots of a cubic segment', () => {
    // start, root, max, midpoint between max and min, root, min, root, end
    expect(
      sampleCurveLength(createBezierCurve([-1, 5, -4, 1]), 2, 100).size,
    ).toBe(8)
  })

  test('takes additional samples to enforce maxError', () => {
    expect(
      sampleCurveLength(createBezierCurve([-1, 5, -4, 1]), 2, 100).size,
    ).toBe(8)
    expect(
      sampleCurveLength(createBezierCurve([-1, 5, -4, 1]), 2, 0.01).size,
    ).toBe(12)
  })

  test('maxError is correctly enforced', () => {
    const curve = createBezierCurve([5, 10, -4, 1])
    const samples = sampleCurveLength(curve, 2, 0.0001)

    const sampleEntries = Array.from(samples.entries())
    for (const [index, [t, value]] of sampleEntries.entries()) {
      if (index === sampleEntries.length - 1) {
        break
      }
      const nextT = sampleEntries[index + 1][0]
      const nextValue = sampleEntries[index + 1][1]

      const midY = curve.solve((t + nextT) / 2)
      const midValue = (value + nextValue) / 2

      expect(Math.abs(midY - midValue)).toBeLessThanOrEqual(0.01)
    }
  })
})
