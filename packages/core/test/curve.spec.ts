import { describe, expect, test } from 'vitest'
import {
  createBasisCurve,
  createBezierCurve,
  createCardinalCurve,
  createCatmullRomCurve,
  createCurve,
  createHermiteCurve,
} from '../src/curve'
import { bezier, toBasisSegments, toBezierSegments } from '../src/splines'

describe('monotonicity', () => {
  test('constant for [0, 0, 0, 0, 0, 0, 0] (horizontal line at y=0', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0])).monotonicity,
    ).toBe('constant')
  })

  test('increasing for [0, 1, 2, 3, 4, 5, 6] (diagonal line from bottom left to top right', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).monotonicity,
    ).toBe('increasing')
  })

  test('decreasing for [6, 5, 4, 3, 2, 1, 0] (diagonal line from bottom left to top right', () => {
    expect(
      createCurve(bezier, toBezierSegments([6, 5, 4, 3, 2, 1, 0])).monotonicity,
    ).toBe('decreasing')
  })

  test('none for [1, 0, 0, 1, 0, 0, 1] (w shape, each segment is none)', () => {
    expect(
      createCurve(bezier, toBezierSegments([1, 0, 0, 1, 0, 0, 1])).monotonicity,
    ).toBe('none')
  })
  test('none for [1, 0, 0, 0, 0, 0, 1] (u shape, segments are decreasing then increasing', () => {
    expect(
      createCurve(bezier, toBezierSegments([1, 0, 0, 0, 0, 0, 1])).monotonicity,
    ).toBe('none')
  })
})

describe('extrema', () => {
  test('endpoints only for [0, 1, 2, 3, 4, 5, 6]', () => {
    const segment = createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6]))
    expect(segment.extrema.size).toEqual(2)
    expect(segment.extrema.get(0)).toEqual(0)
    expect(segment.extrema.get(1)).toEqual(6)
  })
  test('endpoints only for [0, 0, 0, 0, 0, 0, 0]', () => {
    const segment = createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0]))
    expect(segment.extrema.size).toEqual(2)
    expect(segment.extrema.get(0)).toEqual(0)
    expect(segment.extrema.get(1)).toEqual(0)
  })
  test('endpoints only for [6, 5, 4, 3, 2, 1, 0]', () => {
    const segment = createCurve(bezier, toBezierSegments([6, 5, 4, 3, 2, 1, 0]))
    expect(segment.extrema.size).toEqual(2)
    expect(segment.extrema.get(0)).toEqual(6)
    expect(segment.extrema.get(1)).toEqual(0)
  })

  test('points along the u for [1, 0, 0, 0, 0, 0, 1]', () => {
    const segment = createCurve(bezier, toBezierSegments([1, 0, 0, 0, 0, 0, 1]))
    expect(segment.extrema.size).toEqual(3)
    expect(segment.extrema.get(0)).toEqual(1)
    expect(segment.extrema.get(0.5)).toEqual(0)
    expect(segment.extrema.get(1)).toEqual(1)
  })

  test('points along w for [1, 0, 0, 1, 0, 0, 1]', () => {
    const segment = createCurve(bezier, toBezierSegments([1, 0, 0, 1, 0, 0, 1]))
    expect(segment.extrema.size).toEqual(5)
    expect(segment.extrema.get(0)).toEqual(1)
    expect(segment.extrema.get(0.25)).toEqual(0.25)
    expect(segment.extrema.get(0.5)).toEqual(1)
    expect(segment.extrema.get(0.75)).toEqual(0.25)
    expect(segment.extrema.get(1)).toEqual(1)
  })
})

describe('min', () => {
  test('0 for [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).range[0],
    ).toEqual(0)
  })

  test('0 for [0, 0, 0, 0, 0, 0, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0])).range[0],
    ).toEqual(0)
  })

  test('-0.75 for [0, -1, -1, 0, 1, 1, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, -1, -1, 0, 1, 1, 0])).range[0],
    ).toEqual(-0.75)
  })
})

describe('max', () => {
  test('6 for [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).range[1],
    ).toEqual(6)
  })

  test('0 for [0, 0, 0, 0, 0, 0, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0])).range[1],
    ).toEqual(0)
  })

  test('0.75 for [0, -1, -1, 0, 1, 1, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, -1, -1, 0, 1, 1, 0])).range[1],
    ).toEqual(0.75)
  })
})

describe('positionAt', () => {
  test('0 for t=0 with [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).positionAt(
        0,
      ),
    ).toEqual(0)
  })

  test('6 for t=1 with [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).positionAt(
        1,
      ),
    ).toEqual(6)
  })
})

describe('velocityAt', () => {
  test('0 for t=0 with [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurve(bezier, toBasisSegments([0, 0, 1, 1, 1, 0, 0])).velocityAt(0),
    ).toEqual(0)
  })

  test('>0 for t=0.25 with [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurve(bezier, toBasisSegments([0, 0, 1, 1, 1, 0, 0])).velocityAt(
        0.25,
      ),
    ).toBeGreaterThan(0)
  })

  test('0 for t=0.5 with [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurve(bezier, toBasisSegments([0, 0, 1, 1, 1, 0, 0])).velocityAt(
        0.5,
      ),
    ).toEqual(0)
  })

  test('>0 for t=0.75 with [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurve(bezier, toBasisSegments([0, 0, 1, 1, 1, 0, 0])).velocityAt(
        0.25,
      ),
    ).toBeGreaterThan(0)
  })

  test('0 for t=0.5 with [0, 0, 1, 1, 1, 0, 0]', () => {
    expect(
      createCurve(bezier, toBasisSegments([0, 0, 1, 1, 1, 0, 0])).velocityAt(1),
    ).toEqual(0)
  })
})

describe('bezier segment', () => {
  test('constructs a bezier segment', () => {
    const segment = createBezierCurve([0, 1, 0, 1])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('hermite curve', () => {
  test('constructs a hermite curve', () => {
    const segment = createHermiteCurve([0, 0, 1, 0])
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('cardinal curve', () => {
  test('constructs a cardinal curve', () => {
    const segment = createCardinalCurve([0, 1], {
      a: 0.5,
      duplicateEndpoints: true,
    })
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('catmull rom curve', () => {
  test('constructs a catmull rom curve', () => {
    const segment = createCatmullRomCurve([0, 1], { duplicateEndpoints: true })
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})

describe('bspline curve', () => {
  test('constructs a basis curve', () => {
    const segment = createBasisCurve([0, 1], { triplicateEndpoints: true })
    expect(segment.positionAt(0)).toBe(0)
    expect(segment.positionAt(0.5)).toBe(0.5)
    expect(segment.positionAt(1)).toBe(1)
  })
})
