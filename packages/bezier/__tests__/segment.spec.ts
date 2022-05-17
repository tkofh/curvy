import { describe, test } from 'vitest'
import { roundTo } from '@curvy/math'
import { createSegment } from '../src/lib'

describe('segments', () => {
  describe('precision', () => {
    test('accepts a precision', ({ expect }) => {
      const precision = 2

      const segment = createSegment(
        [
          [0, 0],
          [75, 0],
          [25, 100],
          [100, 100],
        ],
        { precision }
      )
      for (let i = 0; i <= 100; i++) {
        expect(segment.solveY(i)).toBe(roundTo(segment.solveY(i)!, precision))
        expect(segment.solveX(i)).toBe(roundTo(segment.solveX(i)!, precision))
      }
    })

    test('accepts independent precisions for x and y', ({ expect }) => {
      const precisionX = 0
      const precisionY = 2

      const segment = createSegment(
        [
          [0, 0],
          [75, 0],
          [25, 100],
          [100, 100],
        ],
        { precisionX, precisionY }
      )

      for (let i = 0; i <= 100; i++) {
        expect(segment.solveY(i)).toBe(roundTo(segment.solveY(i)!, precisionY))
        expect(segment.solveX(i)).toBe(roundTo(segment.solveX(i)!, precisionX))
      }
    })
  })

  describe('monotonicity', () => {
    test('detects positive getAxisMonotonicity', ({ expect }) => {
      const segment1 = createSegment([
        [0, 0],
        [100, 0],
        [0, 100],
        [100, 100],
      ])
      expect(segment1.monotonicityX).toBe('positive')
      expect(segment1.monotonicityY).toBe('positive')

      const segment2 = createSegment([
        [0, 0],
        [0, 100],
        [100, 0],
        [100, 100],
      ])
      expect(segment2.monotonicityX).toBe('positive')
      expect(segment2.monotonicityY).toBe('positive')
    })

    test('detects negative getAxisMonotonicity', ({ expect }) => {
      const segment1 = createSegment([
        [0, 0],
        [-100, 0],
        [0, -100],
        [-100, -100],
      ])
      expect(segment1.monotonicityX).toBe('negative')
      expect(segment1.monotonicityY).toBe('negative')

      const segment2 = createSegment([
        [100, 100],
        [100, 0],
        [0, 100],
        [0, 0],
      ])
      expect(segment2.monotonicityX).toBe('negative')
      expect(segment2.monotonicityY).toBe('negative')
    })

    test('detects no getAxisMonotonicity', ({ expect }) => {
      const segment1 = createSegment([
        [0, 20],
        [0, -50],
        [-50, 0],
        [20, 0],
      ])
      expect(segment1.monotonicityX).toBe('none')
      expect(segment1.monotonicityY).toBe('none')

      const segment2 = createSegment([
        [20, 0],
        [-50, 0],
        [0, -50],
        [0, 20],
      ])
      expect(segment2.monotonicityX).toBe('none')
      expect(segment2.monotonicityY).toBe('none')
    })
  })

  describe('bounds and getExtrema', () => {
    test('finds bounds and getExtrema of line segment', ({ expect }) => {
      const segment1 = createSegment([
        [0, 0],
        [25, 25],
        [75, 75],
        [100, 100],
      ])

      expect(segment1.boundingBox).toStrictEqual({
        minX: 0,
        maxX: 100,
        minY: 0,
        maxY: 100,
      })
      expect(segment1.extrema).toStrictEqual([
        [0, 0],
        [100, 100],
      ])
    })

    test('finds bounds and getExtrema of parabola', ({ expect }) => {
      const segment1 = createSegment([
        [0, 0],
        [0, 200],
        [100, 200],
        [100, 0],
      ])

      expect(segment1.extrema).toStrictEqual([
        [0, 0],
        [50, 150],
        [100, 0],
      ])
      expect(segment1.boundingBox).toStrictEqual({ minX: 0, maxX: 100, minY: 0, maxY: 150 })

      const segment2 = createSegment([
        [0, 0],
        [200, 0],
        [200, 100],
        [0, 100],
      ])

      expect(segment2.extrema).toStrictEqual([
        [0, 0],
        [150, 50],
        [0, 100],
      ])
      expect(segment2.boundingBox).toStrictEqual({ minX: 0, maxX: 150, minY: 0, maxY: 100 })
    })

    test('finds bounds and getExtrema of loops', ({ expect }) => {
      const segment1 = createSegment(
        [
          [0, 20],
          [0, -50],
          [-50, 0],
          [20, 0],
        ],
        { precision: 2 }
      )

      expect(segment1.extrema).toStrictEqual([
        [0, 20],
        [-13.56, -17.3],
        [-17.3, -13.56],
        [20, 0],
      ])
      expect(segment1.boundingBox).toStrictEqual({ minX: -17.3, maxX: 20, minY: -17.3, maxY: 20 })

      const segment2 = createSegment([
        [20, 0],
        [-50, 0],
        [0, -50],
        [0, 20],
      ])
      expect(segment2.extrema).toStrictEqual([
        [20, 0],
        [-17.301038062283737, -13.564013840830452],
        [-13.56401384083046, -17.301038062283734],
        [0, 20],
      ])

      expect(segment2.boundingBox).toStrictEqual({
        minX: -17.301038062283737,
        maxX: 20,
        minY: -17.301038062283734,
        maxY: 20,
      })
    })
  })

  describe('length', () => {
    test('it calculates the length of a straight line', ({ expect }) => {
      const segment = createSegment([
        [0, 0],
        [0.25, 0.25],
        [0.75, 0.75],
        [1, 1],
      ])
      expect(roundTo(segment.length, 10)).toBe(roundTo(Math.sqrt(2), 10))
    })
  })

  describe('solving', () => {
    test('solves y and x for each other', ({ expect }) => {
      const precision = 12
      const segment = createSegment(
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
        expect(roundTo(segment.solveY(segment.solveX(i)!)!, precision - 2)).toBe(i)
        expect(roundTo(segment.solveX(segment.solveY(i)!)!, precision - 2)).toBe(i)
      }
    })

    test('returns undefined for out of bounds inputs', ({ expect }) => {
      const segment = createSegment([
        [0, 0],
        [25, 25],
        [75, 75],
        [100, 100],
      ])

      expect(segment.solveX(-1)).toBeUndefined()
      expect(segment.solveX(101)).toBeUndefined()
      expect(segment.solveY(-1)).toBeUndefined()
      expect(segment.solveY(101)).toBeUndefined()
    })

    test('respects constraints on output', ({ expect }) => {
      const segment1 = createSegment(
        [
          [0, 0],
          [0, 100],
          [100, 100],
          [100, 0],
        ],
        { precision: 1 }
      )

      expect(segment1.solveX(60, 0, 18.6)).toBeUndefined()
      expect(segment1.solveX(60, 18.6, 18.8)).toBe(18.7)
      expect(segment1.solveX(60, 18.8, 81.2)).toBeUndefined()
      expect(segment1.solveX(60, 81.2, 81.4)).toBe(81.3)
      expect(segment1.solveX(60, 81.4, 100)).toBeUndefined()

      const segment2 = createSegment(
        [
          [0, 0],
          [100, 0],
          [100, 100],
          [0, 100],
        ],
        { precision: 2 }
      )

      expect(segment2.solveY(60, 0, 18.6)).toBeUndefined()
      expect(segment2.solveY(60, 18.6, 18.8)).toBe(18.7)
      expect(segment2.solveY(60, 18.8, 81.2)).toBeUndefined()
      expect(segment2.solveY(60, 81.2, 81.4)).toBe(81.3)
      expect(segment2.solveY(60, 81.4, 100)).toBeUndefined()
    })

    test('solves point at length', ({ expect }) => {
      const segment = createSegment(
        [
          [0, 0],
          [0.25, 0.25],
          [0.75, 0.75],
          [1, 1],
        ],
        { precision: 2 }
      )

      for (let i = 0; i <= 1; i += 0.01) {
        const length = roundTo(i, 2)
        expect(segment.solvePointAtLength(Math.sqrt(2) * length)).toStrictEqual([length, length])
      }
    })
  })
})
