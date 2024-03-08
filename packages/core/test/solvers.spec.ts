import { describe, expect, test } from 'vitest'
import { createCatmullRomCurve } from '../src/curve'
import { createSolver } from '../src/solver'

describe('createSolver', () => {
  test('should create a solver', () => {
    expect(true).toBe(true)
    const curve = createCatmullRomCurve([
      0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9,
    ])

    const solver = createSolver(curve)

    console.log(
      solver.lengthSamples.size,
      JSON.stringify(Object.fromEntries(solver.lengthSamples), null, 2),
    )

    // for (let i = 0; i <= 1.01; i += 0.01) {
    //   console.log({
    //     x: round(i),
    //     yLength: solver.solve(i, 1),
    //     yT: solver.solve(i, 0),
    //   })
    // }
  })
})
