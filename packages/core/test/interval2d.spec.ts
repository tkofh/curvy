import { describe, expect, test } from 'vitest'
import * as interval2d from '../src/interval/interval2d.ts'
import * as cubic2d from '../src/curve/cubic2d.ts'
import * as linear2d from '../src/curve/linear2d.ts'
import * as quadratic2d from '../src/curve/quadratic2d.ts'
import * as interval from '../src/interval/interval.ts'
import * as cubicPath2d from '../src/path/cubic2d.ts'
import * as linearPath2d from '../src/path/linear2d.ts'
import * as quadraticPath2d from '../src/path/quadratic2d.ts'
import * as vector2 from '../src/vector/vector2.ts'

describe('interval2d', () => {
  test('make builds from two intervals', () => {
    const b = interval2d.make(interval.make(0, 10), interval.make(-5, 5))
    expect(b.x.start).toBe(0)
    expect(b.x.end).toBe(10)
    expect(b.y.start).toBe(-5)
    expect(b.y.end).toBe(5)
  })

  test('isInterval2d identifies boxes', () => {
    const b = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    expect(interval2d.isInterval2d(b)).toBe(true)
    expect(interval2d.isInterval2d({ x: interval.make(0, 1), y: interval.make(0, 1) })).toBe(false)
    expect(interval2d.isInterval2d(null)).toBe(false)
  })

  test('fromCorners is order-independent', () => {
    const a = interval2d.fromCorners(vector2.make(0, 0), vector2.make(10, 5))
    const b = interval2d.fromCorners(vector2.make(10, 5), vector2.make(0, 0))
    expect(interval2d.equals(a, b)).toBe(true)
    expect(a.x.start).toBe(0)
    expect(a.x.end).toBe(10)
    expect(a.y.start).toBe(0)
    expect(a.y.end).toBe(5)
  })

  test('fromCorners handles negative-spanning corners', () => {
    const b = interval2d.fromCorners(vector2.make(-3, 7), vector2.make(5, -2))
    expect(b.x.start).toBe(-3)
    expect(b.x.end).toBe(5)
    expect(b.y.start).toBe(-2)
    expect(b.y.end).toBe(7)
  })

  test('fromVectors encloses all input points', () => {
    const b = interval2d.fromVectors(
      vector2.make(1, 1),
      vector2.make(-2, 3),
      vector2.make(5, -1),
      vector2.make(0, 0),
    )
    expect(b.x.start).toBe(-2)
    expect(b.x.end).toBe(5)
    expect(b.y.start).toBe(-1)
    expect(b.y.end).toBe(3)
  })

  test('fromVectors rejects empty input', () => {
    expect(() => interval2d.fromVectors()).toThrowError()
  })

  test('containsVector respects both axes', () => {
    const b = interval2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(interval2d.containsVector(b, vector2.make(5, 5))).toBe(true)
    expect(interval2d.containsVector(b, vector2.make(0, 0))).toBe(true)
    expect(interval2d.containsVector(b, vector2.make(10, 10))).toBe(true)
    expect(interval2d.containsVector(b, vector2.make(-1, 5))).toBe(false)
    expect(interval2d.containsVector(b, vector2.make(5, 11))).toBe(false)
  })

  test('containsVector respects openness per axis', () => {
    // Closed x, open y.
    const b = interval2d.make(interval.make(0, 10), interval.makeOpen(0, 10))
    // (5, 0) — closed x accepts, open y rejects 0.
    expect(interval2d.containsVector(b, vector2.make(5, 0))).toBe(false)
    // (0, 5) — closed x accepts 0, open y accepts interior.
    expect(interval2d.containsVector(b, vector2.make(0, 5))).toBe(true)
  })

  test('containsInterval2d respects both axes', () => {
    const outer = interval2d.make(interval.make(0, 10), interval.make(0, 10))
    const inside = interval2d.make(interval.make(2, 8), interval.make(3, 7))
    const partial = interval2d.make(interval.make(2, 12), interval.make(3, 7))
    const same = interval2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(interval2d.containsInterval2d(outer, inside)).toBe(true)
    expect(interval2d.containsInterval2d(outer, partial)).toBe(false)
    expect(interval2d.containsInterval2d(outer, same)).toBe(true)
  })

  test('containsInterval2d respects openness at shared endpoints', () => {
    // Outer is open, inner is closed at same endpoints — inner extends past
    // outer's excluded boundary, so containment fails.
    const outer = interval2d.make(interval.makeOpen(0, 10), interval.makeOpen(0, 10))
    const innerClosed = interval2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(interval2d.containsInterval2d(outer, innerClosed)).toBe(false)
    // But if the inner is also open at the shared endpoints, it's a true subset.
    const innerOpen = interval2d.make(interval.makeOpen(0, 10), interval.makeOpen(0, 10))
    expect(interval2d.containsInterval2d(outer, innerOpen)).toBe(true)
  })

  test('size returns width and height', () => {
    const b = interval2d.make(interval.make(1, 4), interval.make(2, 10))
    expect(interval2d.size(b)).toBeCloseToValue(vector2.make(3, 8))
  })

  test('equals requires matching kinds', () => {
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(0, 1), interval.makeOpen(0, 1))
    expect(interval2d.equals(a, a)).toBe(true)
    expect(interval2d.equals(a, b)).toBe(false)
  })

  test('union encloses both inputs', () => {
    const a = interval2d.make(interval.make(0, 5), interval.make(0, 5))
    const b = interval2d.make(interval.make(3, 10), interval.make(-2, 4))
    const u = interval2d.union(a, b)
    expect(u.x.start).toBe(0)
    expect(u.x.end).toBe(10)
    expect(u.y.start).toBe(-2)
    expect(u.y.end).toBe(5)
  })

  test('union of two closed boxes is closed', () => {
    const a = interval2d.make(interval.make(0, 5), interval.make(0, 5))
    const b = interval2d.make(interval.make(3, 10), interval.make(-2, 4))
    const u = interval2d.union(a, b)
    expect(u.x.kind).toBe('closed')
    expect(u.y.kind).toBe('closed')
  })

  test('union of two open boxes is open when endpoints differ', () => {
    const a = interval2d.make(interval.makeOpen(0, 5), interval.makeOpen(0, 5))
    const b = interval2d.make(interval.makeOpen(3, 10), interval.makeOpen(-2, 4))
    const u = interval2d.union(a, b)
    expect(u.x.kind).toBe('open')
    expect(u.y.kind).toBe('open')
  })

  test('union with shared endpoint promotes to closed when one side includes it', () => {
    // x endpoints: a's start (closed) at 0, b's end (open) at 5.
    const a = interval.make(0, 5) // [0, 5]
    const b = interval.makeOpen(0, 5) // (0, 5)
    const u = interval.union(a, b)
    // Both starts at 0, a includes it → result includes start.
    // Both ends at 5, a includes it → result includes end.
    expect(u.kind).toBe('closed')
  })

  test('union picks contributing endpoint kind when endpoints differ', () => {
    // a = [0, 5], b = (3, 10] → min start from a (closed), max end from b (closed).
    const a = interval.make(0, 5)
    const b = interval.makeOpenStart(3, 10)
    const u = interval.union(a, b)
    expect(u.start).toBe(0)
    expect(u.end).toBe(10)
    expect(u.kind).toBe('closed')
  })

  test('union preserves open boundary from contributing side', () => {
    // a = (0, 5], b = [3, 10) — start comes from a (open), end from b (open).
    const a = interval.makeOpenStart(0, 5)
    const b = interval.makeOpenEnd(3, 10)
    const u = interval.union(a, b)
    expect(u.start).toBe(0)
    expect(u.end).toBe(10)
    expect(u.kind).toBe('open')
  })

  test('minDistance is zero for overlapping boxes', () => {
    const a = interval2d.make(interval.make(0, 10), interval.make(0, 10))
    const b = interval2d.make(interval.make(5, 15), interval.make(5, 15))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(0, 10)
  })

  test('minDistance is zero for touching boxes', () => {
    // Boxes share an edge — closest points coincide.
    const a = interval2d.make(interval.make(0, 5), interval.make(0, 5))
    const b = interval2d.make(interval.make(5, 10), interval.make(0, 5))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(0, 10)
  })

  test('minDistance is the gap when boxes are axis-separated', () => {
    // x-separated by 5, y-overlapping → min distance is 5.
    const a = interval2d.make(interval.make(0, 5), interval.make(0, 10))
    const b = interval2d.make(interval.make(10, 15), interval.make(3, 7))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(5, 10)
  })

  test('minDistance is corner-to-corner Euclidean when boxes are diagonally separated', () => {
    // a = [0,1]×[0,1], b = [4,5]×[5,6] — closest corners (1,1) and (4,5), distance hypot(3,4) = 5.
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(4, 5), interval.make(5, 6))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(5, 10)
  })

  test('minDistance is symmetric', () => {
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(4, 5), interval.make(5, 6))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(interval2d.minDistance(b, a), 10)
  })

  test('minDistance ignores endpoint kind', () => {
    // Touching closed and open boxes: closest points still coincide geometrically.
    const a = interval2d.make(interval.make(0, 5), interval.make(0, 5))
    const b = interval2d.make(interval.makeOpen(5, 10), interval.makeOpen(0, 5))
    expect(interval2d.minDistance(a, b)).toBeCloseTo(0, 10)
  })

  test('maxDistance equals diagonal of identical box', () => {
    // 3×4 box, diagonal = 5.
    const a = interval2d.make(interval.make(0, 3), interval.make(0, 4))
    expect(interval2d.maxDistance(a, a)).toBeCloseTo(5, 10)
  })

  test('maxDistance is the union-AABB diagonal', () => {
    // a = [0,1]×[0,1], b = [4,5]×[5,6] — union AABB is [0,5]×[0,6], diagonal hypot(5,6).
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(4, 5), interval.make(5, 6))
    expect(interval2d.maxDistance(a, b)).toBeCloseTo(Math.hypot(5, 6), 10)
  })

  test('maxDistance is symmetric', () => {
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(4, 5), interval.make(5, 6))
    expect(interval2d.maxDistance(a, b)).toBeCloseTo(interval2d.maxDistance(b, a), 10)
  })

  test('min and max distance bracket the curried form', () => {
    const a = interval2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = interval2d.make(interval.make(4, 5), interval.make(5, 6))
    expect(interval2d.minDistance(b)(a)).toBeCloseTo(interval2d.minDistance(a, b), 10)
    expect(interval2d.maxDistance(b)(a)).toBeCloseTo(interval2d.maxDistance(a, b), 10)
  })
})

describe('curve boundingBox', () => {
  test('LinearCurve2d encloses endpoints', () => {
    const c = linear2d.fromEndpoints(vector2.make(1, 2), vector2.make(5, -3))
    const b = linear2d.boundingBox(c)
    expect(b.x.start).toBeCloseTo(1, 10)
    expect(b.x.end).toBeCloseTo(5, 10)
    expect(b.y.start).toBeCloseTo(-3, 10)
    expect(b.y.end).toBeCloseTo(2, 10)
  })

  test('QuadraticCurve2d catches interior extrema', () => {
    // Symmetric "tent" — peaks at t = 0.5.
    const c = quadratic2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(1, 4),
      vector2.make(2, 0),
    )
    const b = quadratic2d.boundingBox(c)
    expect(b.x.start).toBeCloseTo(0, 10)
    expect(b.x.end).toBeCloseTo(2, 10)
    expect(b.y.start).toBeCloseTo(0, 10)
    // y peak at t=0.5 is (p0 + 2·p1 + p2)/4 = (0 + 8 + 0)/4 = 2.
    expect(b.y.end).toBeCloseTo(2, 10)
  })

  test('CubicCurve2d catches interior extrema', () => {
    // S-curve: p0=(0,0), p1=(0,1), p2=(1,1), p3=(1,0). Bbox is [0,1] × [0, 0.75].
    const c = cubic2d.fromBezierPoints(
      vector2.make(0, 0),
      vector2.make(0, 1),
      vector2.make(1, 1),
      vector2.make(1, 0),
    )
    const b = cubic2d.boundingBox(c)
    expect(b.x.start).toBeCloseTo(0, 10)
    expect(b.x.end).toBeCloseTo(1, 10)
    expect(b.y.start).toBeCloseTo(0, 10)
    expect(b.y.end).toBeCloseTo(0.75, 10)
  })

  test('boundingBox bounds are tight: sampled curve points all fall inside', () => {
    const c = cubic2d.fromBezierPoints(
      vector2.make(-2, 1),
      vector2.make(3, 5),
      vector2.make(7, -3),
      vector2.make(4, 2),
    )
    const b = cubic2d.boundingBox(c)
    for (let i = 0; i <= 200; i++) {
      const p = cubic2d.solve(c, i / 200)
      expect(interval2d.containsVector(b, p)).toBe(true)
    }
  })
})

describe('path boundingBox', () => {
  test('LinearPath2d is union of segment bboxes', () => {
    const p = linearPath2d.make(
      linear2d.fromEndpoints(vector2.make(0, 0), vector2.make(2, 5)),
      linear2d.fromEndpoints(vector2.make(2, 5), vector2.make(-1, 3)),
    )
    const b = linearPath2d.boundingBox(p)
    expect(b.x.start).toBeCloseTo(-1, 10)
    expect(b.x.end).toBeCloseTo(2, 10)
    expect(b.y.start).toBeCloseTo(0, 10)
    expect(b.y.end).toBeCloseTo(5, 10)
  })

  test('QuadraticPath2d unions over segments', () => {
    const p = quadraticPath2d.make(
      quadratic2d.fromBezierPoints(vector2.make(0, 0), vector2.make(1, 4), vector2.make(2, 0)),
      quadratic2d.fromBezierPoints(vector2.make(2, 0), vector2.make(3, -4), vector2.make(4, 0)),
    )
    const b = quadraticPath2d.boundingBox(p)
    expect(b.x.start).toBeCloseTo(0, 10)
    expect(b.x.end).toBeCloseTo(4, 10)
    expect(b.y.start).toBeCloseTo(-2, 10)
    expect(b.y.end).toBeCloseTo(2, 10)
  })

  test('CubicPath2d sampled points all fall inside', () => {
    const p = cubicPath2d.make(
      cubic2d.fromBezierPoints(
        vector2.make(0, 0),
        vector2.make(1, 2),
        vector2.make(3, 4),
        vector2.make(5, 0),
      ),
      cubic2d.fromBezierPoints(
        vector2.make(5, 0),
        vector2.make(7, -3),
        vector2.make(9, 1),
        vector2.make(10, 5),
      ),
    )
    const b = cubicPath2d.boundingBox(p)
    for (let i = 0; i <= 200; i++) {
      const point = cubicPath2d.solve(p, i / 200)
      expect(interval2d.containsVector(b, point)).toBe(true)
    }
  })
})
