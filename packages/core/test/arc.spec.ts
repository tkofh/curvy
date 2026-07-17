import { describe, expect, test } from 'vitest'
import * as Arc from '../src/arc/arc.ts'
import * as CoordinateSystem from '../src/coordinates/coordinateSystem.ts'
import type * as RationalCubicCurve2d from '../src/curve/rationalCubic2d.ts'
import * as RationalCubicPath2d from '../src/path/rationalCubic2d.ts'
import * as Vector2 from '../src/vector/vector2.ts'

const TWO_PI = 2 * Math.PI

const count = (d: string) => (d.match(/ A /g) ?? []).length

describe('circular', () => {
  test('circular applies config defaults', () => {
    const circle = Arc.circular({ radius: 50 })
    expect(circle.kind).toBe('circular')
    expect(circle.center).toBeCloseToValue(Vector2.make(0, 0))
    expect(circle.radius).toBe(50)
    expect(circle.startAngle).toBe(0)
    expect(circle.sweep).toBe(TWO_PI)
  })

  test('isCircular recognizes arcs', () => {
    expect(Arc.isCircular(Arc.circular({ radius: 1 }))).toBe(true)
    expect(Arc.isCircular({ kind: 'circular' })).toBe(false)
    expect(Arc.isCircular(null)).toBe(false)
  })

  test('constructor invariants throw', () => {
    expect(() => Arc.circular({ radius: -1 })).toThrow()
    expect(() => Arc.circular({ radius: Number.NaN })).toThrow()
    expect(() => Arc.circular({ radius: 1, startAngle: Number.POSITIVE_INFINITY })).toThrow()
    expect(() => Arc.circular({ radius: 1, sweep: Number.NaN })).toThrow()
  })

  test('equals compares fields with tolerance, structurally', () => {
    const a = Arc.circular({ center: Vector2.make(1, 2), radius: 3, startAngle: 0.5, sweep: 1 })
    expect(
      Arc.equals(
        a,
        Arc.circular({ center: Vector2.make(1, 2), radius: 3, startAngle: 0.5, sweep: 1 }),
      ),
    ).toBe(true)
    expect(
      Arc.equals(
        a,
        Arc.circular({ center: Vector2.make(1, 2), radius: 3, startAngle: 0.5, sweep: 2 }),
      ),
    ).toBe(false)

    // same points, different description: unequal
    const circle = Arc.circular({ radius: 1 })
    const shifted = Arc.circular({ radius: 1, startAngle: TWO_PI })
    expect(Arc.equals(circle, shifted)).toBe(false)
    expect(Arc.equals(circle, Arc.reverse(circle))).toBe(false)
  })

  test('startPoint, endPoint, and solve evaluate exactly', () => {
    const a = Arc.circular({ center: Vector2.make(2, 3), radius: 5, startAngle: 0.25, sweep: 1.25 })
    expect(Arc.startPoint(a)).toBeCloseToValue(
      Vector2.make(2 + 5 * Math.cos(0.25), 3 + 5 * Math.sin(0.25)),
    )
    expect(Arc.endPoint(a)).toBeCloseToValue(
      Vector2.make(2 + 5 * Math.cos(1.5), 3 + 5 * Math.sin(1.5)),
    )
    expect(Arc.solve(a, 0.5)).toBeCloseToValue(
      Vector2.make(2 + 5 * Math.cos(0.875), 3 + 5 * Math.sin(0.875)),
    )
  })

  test('solve is uniform in arc length and unclamped', () => {
    const a = Arc.circular({ radius: 2, sweep: Math.PI / 2 })
    for (let i = 0; i < 4; i++) {
      const p = Arc.solve(a, i / 4)
      const q = Arc.solve(a, (i + 1) / 4)
      expect(Math.atan2(q.y, q.x) - Math.atan2(p.y, p.x)).toBeCloseTo(Math.PI / 8, 12)
    }
    expect(Arc.solve(a, 2)).toBeCloseToValue(
      Vector2.make(2 * Math.cos(Math.PI), 2 * Math.sin(Math.PI)),
    )
  })

  test('length is radius times the swept angle', () => {
    expect(Arc.length(Arc.circular({ radius: 2, sweep: Math.PI / 2 }))).toBe(Math.PI)
    expect(Arc.length(Arc.circular({ radius: 3, sweep: -Math.PI }))).toBe(3 * Math.PI)
    expect(Arc.length(Arc.circular({ radius: 1, sweep: 4 * Math.PI }))).toBe(4 * Math.PI)
    expect(Arc.length(Arc.circular({ radius: 0, sweep: 1 }))).toBe(0)
  })

  test('reverse traces the same points backward', () => {
    const a = Arc.circular({ center: Vector2.make(1, -2), radius: 4, startAngle: 0.2, sweep: 2.5 })
    const r = Arc.reverse(a)
    expect(Arc.startPoint(r)).toBeCloseToValue(Arc.endPoint(a))
    expect(Arc.endPoint(r)).toBeCloseToValue(Arc.startPoint(a))
    for (const t of [0, 0.25, 0.6, 1]) {
      expect(Arc.solve(r, t)).toBeCloseToValue(Arc.solve(a, 1 - t))
    }
  })

  test('arcs are pipeable', () => {
    expect(Arc.circular({ radius: 2, sweep: Math.PI }).pipe(Arc.length)).toBe(2 * Math.PI)
    expect(Arc.circular({ radius: 1, sweep: Math.PI / 2 }).pipe(Arc.solve(1))).toBeCloseToValue(
      Vector2.make(0, 1),
    )
  })
})

describe('boundingBox', () => {
  test('saturates only at crossed axis directions', () => {
    // first-quadrant quarter turn: +y is crossed, -x / -y / +x are not
    const quarter = Arc.boundingBox(Arc.circular({ radius: 1, sweep: Math.PI / 2 }))
    expect(quarter.x.start).toBeCloseTo(0, 12)
    expect(quarter.x.end).toBe(1)
    expect(quarter.y.start).toBe(0)
    expect(quarter.y.end).toBe(1)

    // an arc inside the first quadrant: the box comes from the endpoints
    const inside = Arc.boundingBox(Arc.circular({ radius: 1, startAngle: 0.25, sweep: 0.5 }))
    expect(inside.x.start).toBe(Math.cos(0.75))
    expect(inside.x.end).toBe(Math.cos(0.25))
    expect(inside.y.start).toBe(Math.sin(0.25))
    expect(inside.y.end).toBe(Math.sin(0.75))
  })

  test('handles direction, full turns, and degenerate radii', () => {
    // sweeping backward across -y from just past +x
    const backward = Arc.boundingBox(
      Arc.circular({ radius: 2, startAngle: -Math.PI / 4, sweep: -Math.PI }),
    )
    expect(backward.y.start).toBe(-2)

    const full = Arc.boundingBox(Arc.circular({ center: Vector2.make(1, 1), radius: 2 }))
    expect(full.x.start).toBe(-1)
    expect(full.x.end).toBe(3)
    expect(full.y.start).toBe(-1)
    expect(full.y.end).toBe(3)

    // multi-turn sweeps cover the whole circle
    const laps = Arc.boundingBox(Arc.circular({ radius: 1, startAngle: 0.3, sweep: 3 * Math.PI }))
    expect(laps.x.start).toBe(-1)
    expect(laps.x.end).toBe(1)

    const point = Arc.boundingBox(Arc.circular({ center: Vector2.make(4, 5), radius: 0 }))
    expect(point.x.start).toBe(4)
    expect(point.x.end).toBe(4)
    expect(point.y.start).toBe(5)
    expect(point.y.end).toBe(5)
  })
})

describe('toPath', () => {
  test('stays on the circle and meets the arc endpoints', () => {
    const a = Arc.circular({ center: Vector2.make(2, 3), radius: 5, startAngle: 0.3, sweep: 1.1 })
    const path = Arc.toPath(a)
    for (let i = 0; i <= 20; i++) {
      const p = RationalCubicPath2d.solve(path, i / 20)
      expect(Math.hypot(p.x - 2, p.y - 3) / 5).toBeCloseTo(1, 12)
    }
    expect(RationalCubicPath2d.solve(path, 0)).toBeCloseToValue(Arc.startPoint(a))
    expect(RationalCubicPath2d.solve(path, 1)).toBeCloseToValue(Arc.endPoint(a))
  })

  test('splits into quarter-turn segments, multi-turn included', () => {
    const segments = (sweep: number) => [...Arc.toPath(Arc.circular({ radius: 1, sweep }))].length
    expect(segments(Math.PI / 2)).toBe(1)
    expect(segments(Math.PI)).toBe(2)
    expect(segments(-Math.PI)).toBe(2)
    expect(segments(TWO_PI)).toBe(4)
    expect(segments(4 * Math.PI)).toBe(8)
  })

  test('matches CoordinateSystem.arc segment for segment', () => {
    const viaSystem = [
      ...CoordinateSystem.arc(CoordinateSystem.polar(), { start: 0.25, end: 1.5 }, 5),
    ]
    const viaArc = [...Arc.toPath(Arc.circular({ radius: 5, startAngle: 0.25, sweep: 1.25 }))]
    expect(viaArc.length).toBe(viaSystem.length)
    for (let i = 0; i < viaArc.length; i++) {
      const ours = viaArc[i] as RationalCubicCurve2d.RationalCubicCurve2d
      const theirs = viaSystem[i] as RationalCubicCurve2d.RationalCubicCurve2d
      expect(ours.x).toBeCloseToValue(theirs.x)
      expect(ours.y).toBeCloseToValue(theirs.y)
      expect(ours.w).toBeCloseToValue(theirs.w)
    }
  })
})

describe('toPathData', () => {
  test('emits exact A commands', () => {
    expect(Arc.toPathData(Arc.circular({ radius: 2, sweep: Math.PI }))).toBe(
      `M 2,0 A 2 2 0 0 1 ${2 * Math.cos(Math.PI)},${2 * Math.sin(Math.PI)}`,
    )
    expect(
      Arc.toPathData(Arc.circular({ radius: 1, startAngle: Math.PI / 2, sweep: -Math.PI / 2 })),
    ).toContain('A 1 1 0 0 0 ')
  })

  test('piece counts, full-circle closure, and clamping', () => {
    const circle = Arc.toPathData(Arc.circular({ radius: 1 }))
    expect(count(circle)).toBe(2)
    expect(circle.startsWith('M 1,0 ')).toBe(true)
    expect(circle.endsWith(' 1,0')).toBe(true)

    expect(count(Arc.toPathData(Arc.circular({ radius: 1, sweep: (3 * Math.PI) / 2 })))).toBe(2)
    // toPath keeps orbiting past a full turn; path data clamps to one circle
    expect(count(Arc.toPathData(Arc.circular({ radius: 1, sweep: 5 * Math.PI })))).toBe(2)
  })

  test('degenerate contracts', () => {
    expect(Arc.toPathData(Arc.circular({ radius: 1, sweep: 0 }))).toBe('M 1,0')
    expect(Arc.toPathData(Arc.circular({ center: Vector2.make(4, 5), radius: 0 }))).toBe('M 4,5')
  })

  test('agrees with CoordinateSystem.arcPathData', () => {
    const unitPolar = CoordinateSystem.polar()
    expect(Arc.toPathData(Arc.circular({ radius: 3, startAngle: 0.25, sweep: 1.25 }))).toBe(
      CoordinateSystem.arcPathData(unitPolar, { start: 0.25, end: 1.5 }, 3),
    )
    expect(Arc.toPathData(Arc.circular({ radius: 1 }))).toBe(
      CoordinateSystem.arcPathData(unitPolar, { start: 0, end: TWO_PI }, 1),
    )
  })
})
