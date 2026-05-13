import { describe, expect, test } from 'vitest'
import * as box2d from '../src/box/box2d'
import * as cubic2d from '../src/curve/cubic2d'
import * as linear2d from '../src/curve/linear2d'
import * as quadratic2d from '../src/curve/quadratic2d'
import * as interval from '../src/interval/interval'
import * as cubicPath2d from '../src/path/cubic2d'
import * as linearPath2d from '../src/path/linear2d'
import * as quadraticPath2d from '../src/path/quadratic2d'
import * as vector2 from '../src/vector/vector2'

describe('box2d', () => {
  test('make builds from two intervals', () => {
    const b = box2d.make(interval.make(0, 10), interval.make(-5, 5))
    expect(b.x.start).toBe(0)
    expect(b.x.end).toBe(10)
    expect(b.y.start).toBe(-5)
    expect(b.y.end).toBe(5)
  })

  test('isBox2d identifies boxes', () => {
    const b = box2d.make(interval.make(0, 1), interval.make(0, 1))
    expect(box2d.isBox2d(b)).toBe(true)
    expect(box2d.isBox2d({ x: interval.make(0, 1), y: interval.make(0, 1) })).toBe(false)
    expect(box2d.isBox2d(null)).toBe(false)
  })

  test('fromCorners is order-independent', () => {
    const a = box2d.fromCorners(vector2.make(0, 0), vector2.make(10, 5))
    const b = box2d.fromCorners(vector2.make(10, 5), vector2.make(0, 0))
    expect(box2d.equals(a, b)).toBe(true)
    expect(a.x.start).toBe(0)
    expect(a.x.end).toBe(10)
    expect(a.y.start).toBe(0)
    expect(a.y.end).toBe(5)
  })

  test('fromCorners handles negative-spanning corners', () => {
    const b = box2d.fromCorners(vector2.make(-3, 7), vector2.make(5, -2))
    expect(b.x.start).toBe(-3)
    expect(b.x.end).toBe(5)
    expect(b.y.start).toBe(-2)
    expect(b.y.end).toBe(7)
  })

  test('fromVectors encloses all input points', () => {
    const b = box2d.fromVectors(
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
    expect(() => box2d.fromVectors()).toThrowError()
  })

  test('containsVector respects both axes', () => {
    const b = box2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(box2d.containsVector(b, vector2.make(5, 5))).toBe(true)
    expect(box2d.containsVector(b, vector2.make(0, 0))).toBe(true)
    expect(box2d.containsVector(b, vector2.make(10, 10))).toBe(true)
    expect(box2d.containsVector(b, vector2.make(-1, 5))).toBe(false)
    expect(box2d.containsVector(b, vector2.make(5, 11))).toBe(false)
  })

  test('containsVector respects openness per axis', () => {
    // Closed x, open y.
    const b = box2d.make(interval.make(0, 10), interval.makeOpen(0, 10))
    // (5, 0) — closed x accepts, open y rejects 0.
    expect(box2d.containsVector(b, vector2.make(5, 0))).toBe(false)
    // (0, 5) — closed x accepts 0, open y accepts interior.
    expect(box2d.containsVector(b, vector2.make(0, 5))).toBe(true)
  })

  test('containsBox respects both axes', () => {
    const outer = box2d.make(interval.make(0, 10), interval.make(0, 10))
    const inside = box2d.make(interval.make(2, 8), interval.make(3, 7))
    const partial = box2d.make(interval.make(2, 12), interval.make(3, 7))
    const same = box2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(box2d.containsBox(outer, inside)).toBe(true)
    expect(box2d.containsBox(outer, partial)).toBe(false)
    expect(box2d.containsBox(outer, same)).toBe(true)
  })

  test('containsBox respects openness at shared endpoints', () => {
    // Outer is open, inner is closed at same endpoints — inner extends past
    // outer's excluded boundary, so containment fails.
    const outer = box2d.make(interval.makeOpen(0, 10), interval.makeOpen(0, 10))
    const innerClosed = box2d.make(interval.make(0, 10), interval.make(0, 10))
    expect(box2d.containsBox(outer, innerClosed)).toBe(false)
    // But if the inner is also open at the shared endpoints, it's a true subset.
    const innerOpen = box2d.make(interval.makeOpen(0, 10), interval.makeOpen(0, 10))
    expect(box2d.containsBox(outer, innerOpen)).toBe(true)
  })

  test('size returns width and height', () => {
    const b = box2d.make(interval.make(1, 4), interval.make(2, 10))
    expect(box2d.size(b)).toBeCloseToValue(vector2.make(3, 8))
  })

  test('equals requires matching kinds', () => {
    const a = box2d.make(interval.make(0, 1), interval.make(0, 1))
    const b = box2d.make(interval.make(0, 1), interval.makeOpen(0, 1))
    expect(box2d.equals(a, a)).toBe(true)
    expect(box2d.equals(a, b)).toBe(false)
  })

  test('union encloses both inputs', () => {
    const a = box2d.make(interval.make(0, 5), interval.make(0, 5))
    const b = box2d.make(interval.make(3, 10), interval.make(-2, 4))
    const u = box2d.union(a, b)
    expect(u.x.start).toBe(0)
    expect(u.x.end).toBe(10)
    expect(u.y.start).toBe(-2)
    expect(u.y.end).toBe(5)
  })
})

describe('curve boundingBox', () => {
  test('LinearCurve2d encloses endpoints', () => {
    const c = linear2d.fromBezierPoints(vector2.make(1, 2), vector2.make(5, -3))
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
      expect(box2d.containsVector(b, p)).toBe(true)
    }
  })
})

describe('path boundingBox', () => {
  test('LinearPath2d is union of segment bboxes', () => {
    const p = linearPath2d.make(
      linear2d.fromBezierPoints(vector2.make(0, 0), vector2.make(2, 5)),
      linear2d.fromBezierPoints(vector2.make(2, 5), vector2.make(-1, 3)),
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
      expect(box2d.containsVector(b, point)).toBe(true)
    }
  })
})
