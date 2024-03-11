import { describe, expect, test } from 'vitest'
import { createBezierCurve } from '../src/curve'

describe('createCurve', () => {
  test('creates a curve', () => {
    const curve = createBezierCurve([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ])

    // console.log(curve)

    expect(curve).toBeDefined()

    // for (const i of Array.from({ length: 101 }, (_, i) => i / 100)) {
    //   console.log(i, curve.solveWhere('x', i))
    // }
  })
})
