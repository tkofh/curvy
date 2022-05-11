import { describe, test } from 'vitest'
import { roundTo } from '@curvy/math'
import { createCubicBezierSpline } from '../src'

describe('createCubicBezierSpline', () => {
  describe('validation', () => {
    test('throws on too few points', ({ expect }) => {
      expect(() => createCubicBezierSpline([[0, 0]])).toThrowError(
        'At least one cubic segment (four points) must be provided'
      )
    })

    test('throws on invalid number of points', ({ expect }) => {
      expect(() =>
        createCubicBezierSpline([
          [0, 0],
          [10, 10],
          [20, 20],
          [30, 30],
          [40, 40],
        ])
      ).toThrowError('Invalid number of points provided (must have 3n+1 points)')
    })
  })

  describe('precision', () => {
    test('accepts a precision', ({ expect }) => {
      const precision = 2

      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [0, 50],
          [50, 0],
          [50, 50],
          [50, 100],
          [100, 50],
          [100, 100],
        ],
        { precision }
      )

      for (let i = 0; i <= 100; i++) {
        expect(spline.solveY(i)).toBe(roundTo(spline.solveY(i)!, precision))
        expect(spline.solveX(i)).toBe(roundTo(spline.solveX(i)!, precision))
      }
    })

    test('accepts independent precision for x and y', ({ expect }) => {
      const precisionX = 0
      const precisionY = 2

      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [0, 50],
          [50, 0],
          [50, 50],
          [50, 100],
          [100, 50],
          [100, 100],
        ],
        { precisionX, precisionY }
      )

      for (let i = 0; i <= 100; i++) {
        expect(spline.solveY(i)).toBe(roundTo(spline.solveY(i)!, precisionY))
        expect(spline.solveX(i)).toBe(roundTo(spline.solveX(i)!, precisionX))
      }
    })
  })

  describe('monotonicity', () => {
    test('detects consistent monotonicity', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 0],
        [10, 10],
        [40, 40],
        [50, 50],
        [60, 60],
        [90, 90],
        [100, 100],
      ])
      expect(spline1.monotonicityX).toBe('positive')
      expect(spline1.monotonicityY).toBe('positive')

      const spline2 = createCubicBezierSpline([
        [0, 0],
        [-10, -10],
        [-40, -40],
        [-50, -50],
        [-60, -60],
        [-90, -90],
        [-100, -100],
      ])
      expect(spline2.monotonicityX).toBe('negative')
      expect(spline2.monotonicityY).toBe('negative')
    })

    test('handles inconsistent monotonicity', ({ expect }) => {
      const spline = createCubicBezierSpline([
        [0, 0],
        [50, 0],
        [100, 0],
        [100, 50],
        [100, 100],
        [50, 100],
        [0, 0],
      ])
      expect(spline.monotonicityX).toBe('none')
      expect(spline.monotonicityY).toBe('none')
    })
  })

  describe('bounds and extrema', () => {
    test('finds bounds and extrema of line segment', ({ expect }) => {
      const spline = createCubicBezierSpline([
        [0, 0],
        [10, 10],
        [40, 40],
        [50, 50],
        [60, 60],
        [90, 90],
        [100, 100],
      ])

      expect(spline.boundingBox).toStrictEqual({ minX: 0, maxX: 100, minY: 0, maxY: 100 })
      expect(spline.extrema).toStrictEqual([
        [0, 0],
        [100, 100],
      ])
    })

    test('finds bounds and extrema of parabola', ({ expect }) => {
      const spline = createCubicBezierSpline([
        [0, 0],
        [50, 0],
        [100, 0],
        [100, 50],
        [100, 100],
        [50, 100],
        [0, 100],
      ])
      expect(spline.boundingBox).toStrictEqual({ minX: 0, maxX: 100, minY: 0, maxY: 100 })
      expect(spline.extrema).toStrictEqual([
        [0, 0],
        [100, 50],
        [0, 100],
      ])
    })
  })

  describe('solving', () => {
    test('solves y and x for each other', ({ expect }) => {
      const precision = 12
      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [25, 0],
          [50, 25],
          [50, 50],
          [50, 75],
          [75, 100],
          [100, 100],
        ],
        { precision }
      )

      for (let i = 0; i <= 100; i++) {
        expect(roundTo(spline.solveY(spline.solveX(i)!)!, precision - 2)).toBe(i)
        expect(roundTo(spline.solveX(spline.solveY(i)!)!, precision - 2)).toBe(i)
      }
    })

    test('returns undefined for out of bounds inputs', ({ expect }) => {
      const spline = createCubicBezierSpline([
        [0, 0],
        [10, 10],
        [40, 40],
        [50, 50],
        [60, 60],
        [90, 90],
        [100, 100],
      ])

      expect(spline.solveX(-1)).toBeUndefined()
      expect(spline.solveX(101)).toBeUndefined()
      expect(spline.solveY(-1)).toBeUndefined()
      expect(spline.solveY(101)).toBeUndefined()
    })

    test('respects constraints on output', ({ expect }) => {
      const spline1 = createCubicBezierSpline(
        [
          [0, 0],
          [0, 25],
          [25, 100],
          [50, 100],
          [75, 100],
          [100, 25],
          [100, 0],
        ],
        { precision: 1 }
      )

      expect(spline1.solveX(60, 0, 15.8)).toBeUndefined()
      expect(spline1.solveX(60, 15.8, 16)).toBe(15.9)
      expect(spline1.solveX(60, 16, 84)).toBeUndefined()
      expect(spline1.solveX(60, 84, 84.2)).toBe(84.1)
      expect(spline1.solveX(60, 84.2)).toBeUndefined()

      const spline2 = createCubicBezierSpline(
        [
          [0, 0],
          [25, 0],
          [100, 25],
          [100, 50],
          [100, 75],
          [25, 100],
          [0, 100],
        ],
        { precision: 1 }
      )

      expect(spline2.solveY(60, 0, 15.8)).toBeUndefined()
      expect(spline2.solveY(60, 15.8, 16)).toBe(15.9)
      expect(spline2.solveY(60, 16, 84)).toBeUndefined()
      expect(spline2.solveY(60, 84, 84.2)).toBe(84.1)
      expect(spline2.solveY(60, 84.2)).toBeUndefined()
    })
  })
})
