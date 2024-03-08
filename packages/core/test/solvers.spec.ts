import { describe, expect, test } from 'vitest'
import { createCatmullRomCurve, round } from '../dist/index.mjs'
import { createSolver } from '../src/solver.js'

describe('createSolver', () => {
  test('should create a solver', () => {
    expect(true).toBe(true)
    const curve = createCatmullRomCurve([0, 2, 1, 3, 2, 4])

    const solver = createSolver(curve, { maxError: 0.0001 })

    for (let i = 0; i <= 1.01; i += 0.01) {
      console.log({ x: round(i), yLength: solver(i, 1), yT: solver(i, 0) })
    }
  })
})
