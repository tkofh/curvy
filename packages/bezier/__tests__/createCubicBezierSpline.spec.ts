import { describe, test } from 'vitest'
import { roundTo } from '@squiggles/math'
import { createCubicBezierSpline } from '../src/createCubicBezierSpline'

describe('createCubicBezierSpline', () => {
  describe('precision', () => {
    test('accepts a precision', ({ expect }) => {
      const precision = 2

      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [75, 0],
          [25, 100],
          [100, 100],
        ],
        { precision }
      )
      for (let i = 0; i <= 100; i++) {
        expect(spline.solveY(i)).toBe(roundTo(spline.solveY(i)!, precision))
        expect(spline.solveX(i)).toBe(roundTo(spline.solveX(i)!, precision))
      }
    })

    test('accepts independent precisions for x and y', ({ expect }) => {
      const precisionX = 0
      const precisionY = 2

      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [75, 0],
          [25, 100],
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
    test('detects positive monotonicity', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ])
      expect(spline1.monotonicityX).toBe('positive')
      expect(spline1.monotonicityY).toBe('positive')

      const spline2 = createCubicBezierSpline([
        [0, 0],
        [0, 100],
        [100, 0],
        [100, 100],
      ])
      expect(spline2.monotonicityX).toBe('positive')
      expect(spline2.monotonicityY).toBe('positive')
    })

    test('detects negative monotonicity', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 0],
        [-100, 0],
        [0, -100],
        [-100, -100],
      ])
      expect(spline1.monotonicityX).toBe('negative')
      expect(spline1.monotonicityY).toBe('negative')

      const spline2 = createCubicBezierSpline([
        [100, 100],
        [100, 0],
        [0, 100],
        [0, 0],
      ])
      expect(spline2.monotonicityX).toBe('negative')
      expect(spline2.monotonicityY).toBe('negative')
    })

    test('detects no monotonicity', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 20],
        [0, -50],
        [-50, 0],
        [20, 0],
      ])
      expect(spline1.monotonicityX).toBe('none')
      expect(spline1.monotonicityY).toBe('none')

      const spline2 = createCubicBezierSpline([
        [20, 0],
        [-50, 0],
        [0, -50],
        [0, 20],
      ])
      expect(spline2.monotonicityX).toBe('none')
      expect(spline2.monotonicityY).toBe('none')
    })
  })

  describe('bounds and extrema', () => {
    test('finds bounds and extrema of line segment', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 0],
        [25, 25],
        [75, 75],
        [100, 100],
      ])

      expect(spline1.boundingBox).toStrictEqual({
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
      })
      expect(spline1.extrema).toStrictEqual([
        [0, 0],
        [100, 100],
      ])
    })

    test('finds bounds and extrema of parabola', ({ expect }) => {
      const spline1 = createCubicBezierSpline([
        [0, 0],
        [0, 200],
        [100, 200],
        [100, 0],
      ])

      expect(spline1.extrema).toStrictEqual([
        [0, 0],
        [50, 150],
        [100, 0],
      ])
      expect(spline1.boundingBox).toStrictEqual({ minX: 0, maxX: 100, minY: 0, maxY: 150 })

      const spline2 = createCubicBezierSpline([
        [0, 0],
        [200, 0],
        [200, 100],
        [0, 100],
      ])

      expect(spline2.extrema).toStrictEqual([
        [0, 0],
        [150, 50],
        [0, 100],
      ])
      expect(spline2.boundingBox).toStrictEqual({ minX: 0, maxX: 150, minY: 0, maxY: 100 })
    })

    test('finds bounds and extrema of loops', ({ expect }) => {
      const spline1 = createCubicBezierSpline(
        [
          [0, 20],
          [0, -50],
          [-50, 0],
          [20, 0],
        ],
        { precision: 2 }
      )

      expect(spline1.extrema).toStrictEqual([
        [0, 20],
        [-13.56, -17.3],
        [-17.3, -13.56],
        [20, 0],
      ])
      expect(spline1.boundingBox).toStrictEqual({ minX: -17.3, maxX: 20, minY: -17.3, maxY: 20 })

      const spline2 = createCubicBezierSpline([
        [20, 0],
        [-50, 0],
        [0, -50],
        [0, 20],
      ])
      expect(spline2.extrema).toStrictEqual([
        [20, 0],
        [-17.301038062283737, -13.564013840830452],
        [-13.56401384083046, -17.301038062283734],
        [0, 20],
      ])

      expect(spline2.boundingBox).toStrictEqual({
        minX: -17.301038062283737,
        maxX: 20,
        minY: -17.301038062283734,
        maxY: 20,
      })
    })
  })

  describe('solving', () => {
    test('solves y and x for each other', ({ expect }) => {
      const precision = 12
      const spline = createCubicBezierSpline(
        [
          [0, 0],
          [0, 75],
          [100, 25],
          [100, 100],
        ],
        { precision }
      )

      /**
       * Reducing the precision on the double solved answer because by the time
       * we've increased precision enough to avoid the double rounding problems,
       * we're running into regular floating-point imprecision
       */
      for (let i = 0; i <= 100; i++) {
        expect(roundTo(spline.solveY(spline.solveX(i)!)!, precision - 2)).toBe(i)
        expect(roundTo(spline.solveX(spline.solveY(i)!)!, precision - 2)).toBe(i)
      }
    })

    test('returns undefined for out of bounds inputs', ({ expect }) => {
      const spline = createCubicBezierSpline([
        [0, 0],
        [25, 25],
        [75, 75],
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
          [0, 100],
          [100, 100],
          [100, 0],
        ],
        { precision: 1 }
      )

      expect(spline1.solveX(60, 0, 18.6)).toBeUndefined()
      expect(spline1.solveX(60, 18.6, 18.8)).toBe(18.7)
      expect(spline1.solveX(60, 18.8, 81.2)).toBeUndefined()
      expect(spline1.solveX(60, 81.2, 81.4)).toBe(81.3)
      expect(spline1.solveX(60, 81.4, 100)).toBeUndefined()

      const spline2 = createCubicBezierSpline(
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ],
        { precision: 2 }
      )

      expect(spline2.solveY(60, 0, 18.6)).toBeUndefined()
      expect(spline2.solveY(60, 18.6, 18.8)).toBe(18.7)
      expect(spline2.solveY(60, 18.8, 81.2)).toBeUndefined()
      expect(spline2.solveY(60, 81.2, 81.4)).toBe(81.3)
      expect(spline2.solveY(60, 81.4, 100)).toBeUndefined()
    })
  })
})
