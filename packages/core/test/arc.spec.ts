import { describe, expect, test } from 'vitest'
import * as Arc from '../src/arc/arc.ts'
import * as CoordinateSystem from '../src/coordinates/coordinateSystem.ts'
import type * as RationalCubicCurve2d from '../src/curve/rationalCubic2d.ts'
import * as CubicPath2d from '../src/path/cubic2d.ts'
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

// Composite Simpson on the smooth integrand sqrt(rx^2 sin^2 + ry^2 cos^2).
const referenceLength = (rx: number, ry: number, a0: number, a1: number): number => {
  const n = 20000
  const h = (a1 - a0) / n
  const f = (t: number) => Math.hypot(rx * Math.sin(t), ry * Math.cos(t))
  let sum = f(a0) + f(a1)
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 1 ? 4 : 2) * f(a0 + i * h)
  }
  return Math.abs((sum * h) / 3)
}

// Maps a cartesian point into the ellipse's frame and returns its
// implicit value, which is 1 on the ellipse.
const implicit = (e: Arc.Elliptical, p: Vector2.Vector2): number => {
  const c = Math.cos(e.rotation)
  const s = Math.sin(e.rotation)
  const dx = p.x - e.center.x
  const dy = p.y - e.center.y
  return Math.hypot((dx * c + dy * s) / e.radiusX, (-dx * s + dy * c) / e.radiusY)
}

describe('elliptical', () => {
  const oval = Arc.elliptical({
    center: Vector2.make(10, -4),
    radiusX: 100,
    radiusY: 50,
    rotation: 0.6,
    startAngle: 0.2,
    sweep: 4,
  })

  test('elliptical applies config defaults', () => {
    const e = Arc.elliptical({ radiusX: 3, radiusY: 2 })
    expect(e.kind).toBe('elliptical')
    expect(e.center).toBeCloseToValue(Vector2.make(0, 0))
    expect(e.rotation).toBe(0)
    expect(e.startAngle).toBe(0)
    expect(e.sweep).toBe(TWO_PI)
  })

  test('guards recognize each kind', () => {
    const circle = Arc.circular({ radius: 1 })
    expect(Arc.isElliptical(oval)).toBe(true)
    expect(Arc.isElliptical(circle)).toBe(false)
    expect(Arc.isCircular(oval)).toBe(false)
    expect(Arc.isArc(oval)).toBe(true)
    expect(Arc.isArc(circle)).toBe(true)
    expect(Arc.isArc({ kind: 'elliptical' })).toBe(false)
  })

  test('constructor invariants throw', () => {
    expect(() => Arc.elliptical({ radiusX: -1, radiusY: 1 })).toThrow()
    expect(() => Arc.elliptical({ radiusX: 1, radiusY: Number.NaN })).toThrow()
    expect(() => Arc.elliptical({ radiusX: 1, radiusY: 1, rotation: Number.NaN })).toThrow()
    expect(() =>
      Arc.elliptical({ radiusX: 1, radiusY: 1, startAngle: Number.POSITIVE_INFINITY }),
    ).toThrow()
    expect(() => Arc.elliptical({ radiusX: 1, radiusY: 1, sweep: Number.NaN })).toThrow()
  })

  test('equals is structural and kind-aware', () => {
    expect(Arc.equals(oval, Arc.elliptical({ ...oval, radiusX: 100 + 1e-13 }))).toBe(true)
    expect(Arc.equals(oval, Arc.elliptical({ ...oval, rotation: 0.7 }))).toBe(false)
    expect(
      Arc.equals(Arc.elliptical({ radiusX: 1, radiusY: 1 }), Arc.circular({ radius: 1 })),
    ).toBe(false)
  })

  test('solve uses the parametric angle', () => {
    const quarter = Arc.elliptical({ radiusX: 100, radiusY: 50, sweep: Math.PI / 2 })
    const mid = Arc.solve(quarter, 0.5)
    expect(mid).toBeCloseToValue(Vector2.make(100 * Math.SQRT1_2, 50 * Math.SQRT1_2))
    expect((Math.atan2(mid.y, mid.x) * 180) / Math.PI).toBeCloseTo(26.565, 3)
    expect(Arc.startPoint(quarter)).toBeCloseToValue(Vector2.make(100, 0))
    expect(Arc.endPoint(quarter)).toBeCloseToValue(Vector2.make(0, 50))
    for (const t of [-0.5, 0, 0.3, 1, 1.7]) {
      expect(implicit(oval, Arc.solve(oval, t))).toBeCloseTo(1, 14)
    }
    expect(oval.pipe(Arc.solve(0.25))).toBeCloseToValue(Arc.solve(oval, 0.25))
  })

  test('rotation turns the ellipse +x toward +y', () => {
    const tilted = Arc.elliptical({ radiusX: 2, radiusY: 1, rotation: Math.PI / 2 })
    expect(Arc.startPoint(tilted)).toBeCloseToValue(Vector2.make(0, 2))
  })

  test('length matches the elliptic integral', () => {
    // 8 * E(0.75), the perimeter of a 2:1 ellipse.
    expect(Arc.length(Arc.elliptical({ radiusX: 2, radiusY: 1 }))).toBeCloseTo(9.68844822054768, 13)
    for (const [rx, ry] of [
      [2, 1],
      [1, 2],
      [5, 0.01],
      [100, 37],
    ] as const) {
      for (const [startAngle, sweep] of [
        [0.3, 1.1],
        [-2, -5.5],
        [1, 13],
      ] as const) {
        const got = Arc.length(Arc.elliptical({ radiusX: rx, radiusY: ry, startAngle, sweep }))
        const want = referenceLength(rx, ry, startAngle, startAngle + sweep)
        expect(Math.abs(got - want) / want).toBeLessThan(1e-11)
      }
    }
  })

  test('length handles flat ellipses and equal radii in closed form', () => {
    // radiusY 0: the point runs along x as 3 * cos(a), covering 3 * |sin|.
    const flat = Arc.elliptical({ radiusX: 3, radiusY: 0, startAngle: 1, sweep: 13 })
    const want = 3 * (2 * 4 + Math.cos(1) - Math.cos(14 - 4 * Math.PI))
    expect(Arc.length(flat)).toBeCloseTo(want, 12)
    expect(Arc.length(Arc.elliptical({ radiusX: 0, radiusY: 0 }))).toBe(0)
    expect(Arc.length(Arc.elliptical({ radiusX: 4, radiusY: 4, sweep: -3 }))).toBe(12)
  })

  test('reverse keeps the kind and traces backward', () => {
    const back = Arc.reverse(oval)
    expect(back.kind).toBe('elliptical')
    expect(back.rotation).toBe(oval.rotation)
    for (const t of [0, 0.4, 1]) {
      expect(Arc.solve(back, t)).toBeCloseToValue(Arc.solve(oval, 1 - t))
    }
  })

  test('boundingBox is tight against dense sampling', () => {
    for (const e of [
      oval,
      Arc.elliptical({ radiusX: 100, radiusY: 50, rotation: -2.1, startAngle: 1, sweep: -3 }),
      Arc.elliptical({ radiusX: 30, radiusY: 80 }),
      Arc.elliptical({ radiusX: 0, radiusY: 40, rotation: 0.3, startAngle: 0.1, sweep: 5 }),
    ]) {
      const box = Arc.boundingBox(e)
      let xLo = Number.POSITIVE_INFINITY
      let xHi = Number.NEGATIVE_INFINITY
      let yLo = Number.POSITIVE_INFINITY
      let yHi = Number.NEGATIVE_INFINITY
      for (let i = 0; i <= 20000; i++) {
        const p = Arc.solve(e, i / 20000)
        xLo = Math.min(xLo, p.x)
        xHi = Math.max(xHi, p.x)
        yLo = Math.min(yLo, p.y)
        yHi = Math.max(yHi, p.y)
      }
      const [bxLo, bxHi] = [Math.min(box.x.start, box.x.end), Math.max(box.x.start, box.x.end)]
      const [byLo, byHi] = [Math.min(box.y.start, box.y.end), Math.max(box.y.start, box.y.end)]
      for (const [boxEdge, sampled] of [
        [bxLo, xLo],
        [bxHi, xHi],
        [byLo, yLo],
        [byHi, yHi],
      ] as const) {
        expect(Math.abs(boxEdge - sampled)).toBeLessThan(1e-5)
      }
      expect(bxLo).toBeLessThanOrEqual(xLo)
      expect(bxHi).toBeGreaterThanOrEqual(xHi)
      expect(byLo).toBeLessThanOrEqual(yLo)
      expect(byHi).toBeGreaterThanOrEqual(yHi)
    }
  })

  test('boundingBox of an axis-aligned full ellipse is exact', () => {
    const box = Arc.boundingBox(
      Arc.elliptical({ center: Vector2.make(100, 50), radiusX: 100, radiusY: 50 }),
    )
    expect([box.x.start, box.x.end]).toEqual([0, 200])
    expect([box.y.start, box.y.end]).toEqual([0, 100])
  })

  test('toPath stays on the ellipse and meets the arc endpoints', () => {
    const path = Arc.toPath(oval)
    expect([...path].length).toBe(3)
    for (let i = 0; i <= 400; i++) {
      expect(implicit(oval, RationalCubicPath2d.solve(path, i / 400))).toBeCloseTo(1, 14)
    }
    expect(RationalCubicPath2d.solve(path, 0)).toBeCloseToValue(Arc.startPoint(oval))
    expect(RationalCubicPath2d.solve(path, 1)).toBeCloseToValue(Arc.endPoint(oval))
  })

  test('toPathData emits rotated A commands', () => {
    const d = Arc.toPathData(oval)
    expect(count(d)).toBe(2)
    expect(d).toContain(` A 100 50 ${(0.6 * 180) / Math.PI} 0 1 `)
    expect(Arc.toPathData(Arc.reverse(oval))).toContain(' 0 0 ')
  })

  test('toPathData closes full ellipses exactly and clamps multiple laps', () => {
    const full = Arc.toPathData(Arc.elliptical({ radiusX: 30, radiusY: 80, sweep: 3 * TWO_PI }))
    expect(full).toBe('M 30,0 A 30 80 0 0 1 -30,9.797174393178826e-15 A 30 80 0 0 1 30,0')
  })

  test('toPathData degenerate contracts', () => {
    expect(
      Arc.toPathData(Arc.elliptical({ center: Vector2.make(3, 4), radiusX: 0, radiusY: 0 })),
    ).toBe('M 3,4')
    expect(Arc.toPathData(Arc.elliptical({ radiusX: 5, radiusY: 2, sweep: 0 }))).toBe('M 5,0')
    // A flat ellipse traces its segment with lines through each reversal.
    const flat = (sweep: number) =>
      Arc.toPathData(Arc.elliptical({ radiusX: 50, radiusY: 0, startAngle: 0.5, sweep }))
    const start = 50 * Math.cos(0.5)
    expect(flat(4)).toBe(`M ${start},0 L -50,0 L ${50 * Math.cos(4.5)},0`)
    expect(flat(-4)).toBe(`M ${start},0 L 50,0 L -50,0 L ${50 * Math.cos(-3.5)},0`)
  })

  test('chart-space ellipses carry into a polar system through image', () => {
    // The ellipse inscribed in the chart rect theta in [0, pi/2], r in [2, 4].
    const chart = Arc.elliptical({
      center: Vector2.make(Math.PI / 4, 3),
      radiusX: Math.PI / 4,
      radiusY: 1,
    })
    const system = CoordinateSystem.polar()
    const tolerance = 1e-3
    const out = CoordinateSystem.image(system, Arc.toPath(chart), tolerance)
    // Every output point is within tolerance of the true image, which a
    // dense polyline through mapped chart points stands in for.
    const truth: Array<Vector2.Vector2> = []
    for (let i = 0; i <= 4096; i++) {
      truth.push(CoordinateSystem.toCartesian(system, Arc.solve(chart, i / 4096)))
    }
    const toTruth = (p: Vector2.Vector2): number => {
      let best = Number.POSITIVE_INFINITY
      for (let i = 1; i < truth.length; i++) {
        const a = truth[i - 1] as Vector2.Vector2
        const b = truth[i] as Vector2.Vector2
        const dx = b.x - a.x
        const dy = b.y - a.y
        const u = Math.max(
          0,
          Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
        )
        best = Math.min(best, Math.hypot(a.x + u * dx - p.x, a.y + u * dy - p.y))
      }
      return best
    }
    for (let i = 0; i <= 512; i++) {
      expect(toTruth(CubicPath2d.solve(out, i / 512))).toBeLessThanOrEqual(tolerance * 1.02)
    }
    expect(CubicPath2d.isContinuous(out)).toBe(true)
  })
})
