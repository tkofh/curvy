import { describe, test } from 'vitest'
import type { Bounds } from '@curvy/types'
import { createCubicBezierSpline } from '@curvy/bezier'
import { compareBounds, compareSplineBounds } from '../src'

describe('compareBounds', () => {
  test('it compares bounds', ({ expect }) => {
    const a: Bounds<'x' | 'y'> = {
      x: {
        min: 0,
        max: 10,
      },
      y: {
        min: 0,
        max: 10,
      },
    }
    const b: Bounds<'x' | 'y'> = {
      x: {
        min: -1,
        max: 1,
      },
      y: {
        min: -1,
        max: 1,
      },
    }
    expect(compareBounds(a, a)).toBe(true)
    expect(compareBounds(a, b)).toBe(false)
  })
})

describe('compareSplineBounds', () => {
  test('it compares spline bounds', ({ expect }) => {
    const splineA = createCubicBezierSpline([
      [0, 0],
      [0.25, 5],
      [0.75, 4],
      [1, 1],
    ])
    const splineB = createCubicBezierSpline([
      [0, 0],
      [0.75, 0],
      [0.25, 1],
      [1, 1],
    ])
    const splineC = createCubicBezierSpline([
      [0, 0],
      [0.5, 8],
      [0.75, 1.1],
      [1, 1],
    ])

    expect(compareSplineBounds(splineA, splineA)).toBe(true)
    expect(compareSplineBounds(splineA, splineB)).toBe(false)
    expect(compareSplineBounds(splineA, splineC)).toBe(false)
    expect(compareSplineBounds(splineA, splineA, splineA)).toBe(true)
    expect(compareSplineBounds(splineA, splineB, splineC)).toBe(false)
  })

  test('it returns true when no comparisons are provided', ({ expect }) => {
    const splineA = createCubicBezierSpline([
      [0, 0],
      [0.25, 5],
      [0.75, 4],
      [1, 1],
    ])

    expect(compareSplineBounds(splineA)).toBe(true)
  })
})
