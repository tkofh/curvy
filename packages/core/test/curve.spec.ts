import { describe, expect, test } from 'vitest'
import {
  createBasisCurve,
  createBezierCurve,
  createCardinalCurve,
  createCatmullRomCurve,
  createCurve,
  createHermiteCurve,
} from '../src/curve'
import { bezier, toBezierSegments } from '../src/splines'

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
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).min,
    ).toEqual(0)
  })

  test('0 for [0, 0, 0, 0, 0, 0, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0])).min,
    ).toEqual(0)
  })

  test('-0.75 for [0, -1, -1, 0, 1, 1, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, -1, -1, 0, 1, 1, 0])).min,
    ).toEqual(-0.75)
  })
})

describe('max', () => {
  test('6 for [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).max,
    ).toEqual(6)
  })

  test('0 for [0, 0, 0, 0, 0, 0, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 0, 0, 0, 0, 0, 0])).max,
    ).toEqual(0)
  })

  test('0.75 for [0, -1, -1, 0, 1, 1, 0]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, -1, -1, 0, 1, 1, 0])).max,
    ).toEqual(0.75)
  })
})

describe('solve', () => {
  test('0 for t=0 with [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).solve(0),
    ).toEqual(0)
  })

  test('6 for t=1 with [0, 1, 2, 3, 4, 5, 6]', () => {
    expect(
      createCurve(bezier, toBezierSegments([0, 1, 2, 3, 4, 5, 6])).solve(1),
    ).toEqual(6)
  })
})

describe('bezier segment', () => {
  test('constructs a bezier segment', () => {
    const segment = createBezierCurve([0, 1, 0, 1])
    expect(segment.solve(0)).toBe(0)
    expect(segment.solve(0.5)).toBe(0.5)
    expect(segment.solve(1)).toBe(1)
  })
})

describe('hermite curve', () => {
  test('constructs a hermite curve', () => {
    const segment = createHermiteCurve([0, 0, 1, 0])
    expect(segment.solve(0)).toBe(0)
    expect(segment.solve(0.5)).toBe(0.5)
    expect(segment.solve(1)).toBe(1)
  })
})

describe('cardinal curve', () => {
  test('constructs a cardinal curve', () => {
    const segment = createCardinalCurve([0, 1], {
      a: 0.5,
      duplicateEndpoints: true,
    })
    expect(segment.solve(0)).toBe(0)
    expect(segment.solve(0.5)).toBe(0.5)
    expect(segment.solve(1)).toBe(1)
  })
})

describe('catmull rom curve', () => {
  test('constructs a catmull rom curve', () => {
    const segment = createCatmullRomCurve([0, 1], { duplicateEndpoints: true })
    expect(segment.solve(0)).toBe(0)
    expect(segment.solve(0.5)).toBe(0.5)
    expect(segment.solve(1)).toBe(1)
  })
})

describe('bspline curve', () => {
  test('constructs a basis curve', () => {
    const segment = createBasisCurve([0, 1], { triplicateEndpoints: true })
    expect(segment.solve(0)).toBe(0)
    expect(segment.solve(0.5)).toBe(0.5)
    expect(segment.solve(1)).toBe(1)
  })
})
