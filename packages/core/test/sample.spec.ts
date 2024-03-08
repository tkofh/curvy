import { describe, expect, test } from 'vitest'
import { createBezierCurve } from '../src'
import { createLengthLookup } from '../src/sample'

describe('sampleCurveLength', () => {
  test('it works', () => {
    expect(true).toBe(true)

    const curve = createBezierCurve([0, 3, -2, 1, 4, 5, -2])
    const samples = createLengthLookup(curve)

    console.log(samples)
  })
})
