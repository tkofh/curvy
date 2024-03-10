import { describe, expect, test } from 'vitest'
import {
  createBasisSegment,
  createBezierSegment,
  createCardinalSegment,
  createCatmullRomSegment,
  createCurveSegment,
  createHermiteSegment,
  solveSegmentT,
} from '../src/segment'
import { bezier } from '../src/splines'

describe('monotonicity', () => {
  test('constant for [0, 0, 0, 0] (horizontal line at y=0)', () => {
    expect(createCurveSegment(bezier, [0, 0, 0, 0]).monotonicity).toBe(
      'constant',
    )
  })
  test('constant for [5, 5, 5, 5] (horizontal line at y=5)', () => {
    expect(createCurveSegment(bezier, [5, 5, 5, 5]).monotonicity).toBe(
      'constant',
    )
  })

  test('increasing for [0, 1, 2, 3] (diagonal line from bottom left to top right)', () => {
    expect(createCurveSegment(bezier, [0, 1, 2, 3]).monotonicity).toBe(
      'increasing',
    )
  })
  test('increasing for [0, 0, 1, 1] (ease in out from bottom left to top right)', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).monotonicity).toBe(
      'increasing',
    )
  })
  test('increasing for [0, 1, 0, 1] (flattens out at 0.5 but keeps climbing)', () => {
    expect(createCurveSegment(bezier, [0, 1, 0, 1]).monotonicity).toBe(
      'increasing',
    )
  })
  test('increasing for [0.1, 0.2, 0.5, 1] (ease-in from bottom left to top right, sets derivative a=0)', () => {
    expect(createCurveSegment(bezier, [0.1, 0.2, 0.5, 1]).monotonicity).toBe(
      'increasing',
    )
  })
  test('increasing for [-0.2, 0.3, 0.8, 1] (slightly eased from bottom left to top right, sets derivative b=0)', () => {
    expect(createCurveSegment(bezier, [-0.2, 0.3, 0.8, 1]).monotonicity).toBe(
      'increasing',
    )
  })

  test('decreasing for [3, 2, 1, 0] (diagonal line from top left to bottom right)', () => {
    expect(createCurveSegment(bezier, [3, 2, 1, 0]).monotonicity).toBe(
      'decreasing',
    )
  })
  test('decreasing for [1, 1, 0, 0] (ease in out from top left to bottom right)', () => {
    expect(createCurveSegment(bezier, [1, 1, 0, 0]).monotonicity).toBe(
      'decreasing',
    )
  })
  test('decreasing for [1, 0, 1, 0] (flattens out at 0.5 but keeps falling)', () => {
    expect(createCurveSegment(bezier, [1, 0, 1, 0]).monotonicity).toBe(
      'decreasing',
    )
  })
  test('decreasing for [1.7, 1.3, 0.1, -1.9] (ease-in from top left to bottom right, sets derivative a=0)', () => {
    expect(createCurveSegment(bezier, [1.7, 1.3, 0.1, -1.9]).monotonicity).toBe(
      'decreasing',
    )
  })
  test('decreasing for [2.6, 1.6, 0.9, 0.5] (slightly eased from top left to bottom right, sets derivative b=0)', () => {
    expect(createCurveSegment(bezier, [2.6, 1.6, 0.9, 0.5]).monotonicity).toBe(
      'decreasing',
    )
  })

  test('none for [1, 0, 0, 1] (u shape)', () => {
    expect(createCurveSegment(bezier, [1, 0, 0, 1]).monotonicity).toBe('none')
  })
  test('none for [0, 1, 1, 0] (upside down u shape)', () => {
    expect(createCurveSegment(bezier, [0, 1, 1, 0]).monotonicity).toBe('none')
  })
  test('none for [0, 2, -1, 1] (backwards n shape, rise-fall-rise)', () => {
    expect(createCurveSegment(bezier, [0, 2, -1, 1]).monotonicity).toBe('none')
  })
  test('none for [1, -1, 2, 0] (n shape, fall-rise-fall', () => {
    expect(createCurveSegment(bezier, [1, -1, 2, 0]).monotonicity).toBe('none')
  })
})

describe('extrema', () => {
  test('only the endpoints for [0, 0, 1, 1] (ease in out from bottom left to top right)', () => {
    const segment = createCurveSegment(bezier, [0, 0, 1, 1])
    expect(segment.extrema.size).toBe(2)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })

  test('only the endpoints for [1, 1, 0, 0] (ease in out from top left to bottom right)', () => {
    const segment = createCurveSegment(bezier, [1, 1, 0, 0])
    expect(segment.extrema.size).toBe(2)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })

  test('only the endpoints for [0, 1, 0, 1] (flattens out at 0.5 but keeps climbing)', () => {
    const segment = createCurveSegment(bezier, [0, 1, 0, 1])
    expect(segment.extrema.size).toBe(2)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })
  test('only the endpoints for [1, 0, 1, 0] (flattens out at 0.5 but keeps falling)', () => {
    const segment = createCurveSegment(bezier, [1, 0, 1, 0])
    expect(segment.extrema.size).toBe(2)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })

  test('endpoints and midpoint for [1, 0, 0, 1] (u shaped)', () => {
    const segment = createCurveSegment(bezier, [1, 0, 0, 1])
    expect(segment.extrema.size).toBe(3)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
    expect(segment.extrema.get(0.5)).toBeDefined()
  })
  test('endpoints and midpoint for [0, 1, 1, 0] (upside down u shaped)', () => {
    const segment = createCurveSegment(bezier, [0, 1, 1, 0])
    expect(segment.extrema.size).toBe(3)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
    expect(segment.extrema.get(0.5)).toBeDefined()
  })
  test('endpoints and midpoints for [0, 1.5, 0.5, 1] (backwards n shape, rise-fall-rise)', () => {
    const segment = createCurveSegment(bezier, [0, 1.5, 0.5, 1])
    expect(segment.extrema.size).toBe(4)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(0.5)).toBeDefined()
    expect(segment.extrema.get(0.75)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })
  test('endpoints and midpoints for [1, -0.5, 0.5, 0] (n shape, fall-rise-fall)', () => {
    const segment = createCurveSegment(bezier, [1, -0.5, 0.5, 0])
    expect(segment.extrema.size).toBe(4)
    expect(segment.extrema.get(0)).toBeDefined()
    expect(segment.extrema.get(0.5)).toBeDefined()
    expect(segment.extrema.get(0.75)).toBeDefined()
    expect(segment.extrema.get(1)).toBeDefined()
  })
})

describe('min', () => {
  test('min is start for [0, 0, 1, 1] (ease in out from bottom left to top right)', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).range[0]).toBe(0)
  })
  test('min is end for [1, 1, 0, 0] (ease in out from top left to bottom right)', () => {
    expect(createCurveSegment(bezier, [1, 1, 0, 0]).range[0]).toBe(0)
  })

  test('min is start for [0, 1, 1, 0.5] (upside down u shape with raised end)', () => {
    expect(createCurveSegment(bezier, [0, 1, 1, 0.5]).range[0]).toBe(0)
  })
  test('min is middle for [0, -1, -1, 0] (u shape)', () => {
    expect(createCurveSegment(bezier, [0, -1, -1, 0]).range[0]).toBe(-0.75)
  })
  test('min is end for [0.5, 1, 1, 0] (upside down u shape with raised start)', () => {
    expect(createCurveSegment(bezier, [0.5, 1, 1, 0]).range[0]).toBe(0)
  })

  test('min is start for [0, 1.5, 0.5, 1] (backwards n shape, rise-fall-rise)', () => {
    expect(createCurveSegment(bezier, [0, 1.5, 0.5, 1]).range[0]).toBe(0)
  })
  test('min is first root for [0, -2, 1, 1] (u shape)', () => {
    expect(createCurveSegment(bezier, [0, -2, 1, 1]).range[0]).toBe(-0.6875)
  })
  test('min is second root for [1, 1, -2, 0] (upside down u shape)', () => {
    expect(createCurveSegment(bezier, [1, 1, -2, 0]).range[0]).toBe(-0.6875)
  })
  test('min is end for [1, 0.5, 1.5, 0] (n shape, fall-rise-fall)', () => {
    expect(createCurveSegment(bezier, [1, 0.5, 1.5, 0]).range[0]).toBe(0)
  })
})

describe('max', () => {
  test('max is start for [0, 0, 1, 1] (ease in out from bottom left to top right)', () => {
    expect(createCurveSegment(bezier, [0, 0, -1, -1]).range[1]).toBe(0)
  })
  test('max is end for [1, 1, 0, 0] (ease in out from top left to bottom right)', () => {
    expect(createCurveSegment(bezier, [-1, -1, 0, 0]).range[1]).toBe(0)
  })

  test('max is start for [0, 1, 1, 0.5] (upside down u shape with raised end)', () => {
    expect(createCurveSegment(bezier, [0, -1, -1, -0.5]).range[1]).toBe(0)
  })
  test('max is middle for [0, -1, -1, 0] (u shape)', () => {
    expect(createCurveSegment(bezier, [0, 1, 1, 0]).range[1]).toBe(0.75)
  })
  test('max is end for [0.5, 1, 1, 0] (upside down u shape with raised start)', () => {
    expect(createCurveSegment(bezier, [-0.5, -1, -1, 0]).range[1]).toBe(0)
  })

  test('max is start for [0, 1.5, 0.5, 1] (backwards n shape, rise-fall-rise)', () => {
    expect(createCurveSegment(bezier, [0, -1.5, -0.5, -1]).range[1]).toBe(0)
  })
  test('max is first root for [0, -2, 1, 1] (u shape)', () => {
    expect(createCurveSegment(bezier, [0, 2, -1, -1]).range[1]).toBe(0.6875)
  })
  test('max is second root for [1, 1, -2, 0] (upside down u shape)', () => {
    expect(createCurveSegment(bezier, [-1, -1, 2, 0]).range[1]).toBe(0.6875)
  })
  test('max is end for [1, 0.5, 1.5, 0] (n shape, fall-rise-fall)', () => {
    expect(createCurveSegment(bezier, [-1, -0.5, -1.5, 0]).range[1]).toBe(0)
  })
})

describe('positionAt', () => {
  test('0 at t=0 with [0, 0, 1, 1]', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).positionAt(0)).toBe(0)
  })

  test('0.5 at t=0.5 with [0, 0, 1, 1]', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).positionAt(0.5)).toBe(0.5)
  })

  test('1 at t=1 with [0, 0, 1, 1]', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).positionAt(1)).toBe(1)
  })
})

describe('velocityAt', () => {
  test('0 at t=0 with [0, 0, 1, 1]', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).velocityAt(0)).toBe(0)
  })

  test('>0 at t=0.5 with [0, 0, 1, 1]', () => {
    console.log(createCurveSegment(bezier, [0, 0, 1, 1]).velocityAt(0.5))
    expect(
      createCurveSegment(bezier, [0, 0, 1, 1]).velocityAt(0.5),
    ).toBeGreaterThan(0)
  })

  test('0 at t=1 with [0, 0, 1, 1]', () => {
    expect(createCurveSegment(bezier, [0, 0, 1, 1]).velocityAt(1)).toBe(0)
  })
})

describe('bezier segment', () => {
  test('constructs a bezier segment', () => {
    const segment = createBezierSegment([0, 1, 0, 1])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('hermite segment', () => {
  test('constructs a hermite segment', () => {
    const segment = createHermiteSegment([0, 0, 1, 0])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('cardinal segment', () => {
  test('constructs a cardinal segment', () => {
    const segment = createCardinalSegment([-2, 0, 1, 3], 0.5)
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('catmull rom segment', () => {
  test('constructs a catmull rom segment', () => {
    const segment = createCatmullRomSegment([-2, 0, 1, 3])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('bspline segment', () => {
  test('constructs a bspline segment', () => {
    const segment = createBasisSegment([-1, 0, 1, 2])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('solveSegmentT', () => {
  test('finds t for y=0.5 with [0, 0, 1, 1]', () => {
    const segment = createCurveSegment(bezier, [0, 0, 1, 1])
    expect(solveSegmentT(segment, 0.5)).toStrictEqual([0.5])
  })

  test('finds t within [0, 0.33] for y=0 with [-1, 3, -2, 1]', () => {
    const segment = createCurveSegment(bezier, [-1, 2, -2, 1])
    const t = solveSegmentT(segment, 0, [0, 0.33])
    expect(t).toHaveLength(1)
    expect(segment.positionAt(t[0])).toBe(0)
  })

  test('finds t within [0.33, 0.66] for y=0 with [-1, 3, -2, 1]', () => {
    const segment = createCurveSegment(bezier, [-1, 2, -2, 1])
    const t = solveSegmentT(segment, 0, [0.33, 0.66])
    expect(t).toHaveLength(1)
    expect(segment.positionAt(t[0])).toBe(0)
  })

  test('finds t within [0.66, 1] for y=0 with [-1, 3, -2, 1]', () => {
    const segment = createCurveSegment(bezier, [-1, 2, -2, 1])
    const t = solveSegmentT(segment, 0, [0.66, 1])
    expect(t).toHaveLength(1)
    expect(segment.positionAt(t[0])).toBe(0)
  })

  test('finds all t for y=0 with [-1, 3, -2, 1]', () => {
    const segment = createCurveSegment(bezier, [-1, 2, -2, 1])
    const t = solveSegmentT(segment, 0)
    expect(t).toHaveLength(3)
    expect(segment.positionAt(t[0])).toBe(0)
    expect(segment.positionAt(t[1])).toBe(0)
    expect(segment.positionAt(t[2])).toBe(0)
  })
})
