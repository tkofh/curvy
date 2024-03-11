import { describe, expect, test } from 'vitest'
import { createCurve } from '../src/curve'
import { createBezierCoefficients } from '../src/splines'

describe('createCurve', () => {
  test('creates a curve', () => {
    const curve = createCurve(
      [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
      createBezierCoefficients,
    )

    console.log(curve)

    expect(curve).toBeDefined()

    for (const i of Array.from({ length: 101 }, (_, i) => i / 100)) {
      console.log(i, curve.solveWhere('x', i))
    }
  })
})
