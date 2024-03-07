import { describe, expect, test } from 'vitest'
import { createCatmullRomCurve, round } from '../dist/index.mjs'
import { createNormalizedLengthSolver } from '../src/solver'

describe('createTSpaceSolver', () => {
  test('should create a solver', () => {
    expect(true).toBe(true)
    const curve = createCatmullRomCurve([0, 2, 1, 3, 2, 4])

    const solver = createNormalizedLengthSolver(curve, { maxError: 0.00001 })

    for (let i = 0; i <= 1.01; i += 0.01) {
      console.log({ x: round(i), y: solver(i) })
    }
  })
})
