import { describe, expect, test } from 'vitest'
import * as CoordinateSystem from '../src/coordinates/coordinateSystem.ts'
import * as Dimension from '../src/coordinates/dimension.ts'
import * as RationalCubicCurve2d from '../src/curve/rationalCubic2d.ts'
import * as RationalCubicPath2d from '../src/path/rationalCubic2d.ts'
import * as Vector2 from '../src/vector/vector2.ts'

const TWO_PI = 2 * Math.PI

const count = (d: string) => (d.match(/ A /g) ?? []).length

describe('dimension', () => {
  test('constructors and guards', () => {
    const linear = Dimension.linear(2, 1)
    expect(linear.kind).toBe('linear')
    expect(linear.scale).toBe(2)
    expect(linear.offset).toBe(1)

    const cyclical = Dimension.cyclical(360)
    expect(cyclical.kind).toBe('cyclical')
    expect(cyclical.period).toBe(360)

    expect(Dimension.isDimension(linear)).toBe(true)
    expect(Dimension.isDimension({ kind: 'linear' })).toBe(false)
    expect(Dimension.isLinear(linear)).toBe(true)
    expect(Dimension.isCyclical(cyclical)).toBe(true)
    expect(Dimension.isCyclical(linear)).toBe(false)
  })

  test('constructor invariants throw', () => {
    expect(() => Dimension.linear(0)).toThrow()
    expect(() => Dimension.linear(Number.NaN)).toThrow()
    expect(() => Dimension.linear(1, Number.POSITIVE_INFINITY)).toThrow()
    expect(() => Dimension.cyclical(0)).toThrow()
    expect(() => Dimension.cyclical(-2)).toThrow()
    expect(() => Dimension.cyclical(Number.NaN)).toThrow()
  })

  test('unit constants', () => {
    expect(Dimension.radians.period).toBe(TWO_PI)
    expect(Dimension.degrees.period).toBe(360)
    expect(Dimension.turns.period).toBe(1)
    expect(Dimension.identity.scale).toBe(1)
    expect(Dimension.identity.offset).toBe(0)
  })

  test('equals compares kind and fields', () => {
    expect(Dimension.equals(Dimension.cyclical(360), Dimension.degrees)).toBe(true)
    expect(Dimension.equals(Dimension.linear(2, 1), Dimension.linear(2, 1))).toBe(true)
    expect(Dimension.equals(Dimension.linear(2, 1), Dimension.linear(2, 2))).toBe(false)
    expect(Dimension.equals(Dimension.linear(1, 0), Dimension.turns)).toBe(false)
  })

  test('wrap canonicalizes cyclical values', () => {
    expect(Dimension.wrap(Dimension.radians, 3 * Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(Dimension.wrap(Dimension.radians, -Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 12)
    expect(Dimension.wrap(Dimension.radians, TWO_PI)).toBe(0)
    expect(Dimension.wrap(Dimension.degrees, -0)).toBe(0)
    expect(Dimension.wrap(Dimension.radians, 1000 * TWO_PI + 1)).toBeCloseTo(1, 11)
  })

  test('wrap leaves linear values unchanged', () => {
    expect(Dimension.wrap(Dimension.linear(2, 1), -7)).toBe(-7)
  })

  test('delta takes the short way', () => {
    expect(Dimension.delta(Dimension.radians, 0.1, 0.3)).toBeCloseTo(0.2, 12)
    expect(Dimension.delta(Dimension.radians, TWO_PI - 0.1, 0.1)).toBeCloseTo(0.2, 12)
    expect(Dimension.delta(Dimension.degrees, 350, 10)).toBe(20)
    expect(Dimension.delta(Dimension.linear(), 3, 1)).toBe(-2)
  })

  test('delta antipodal ties resolve to +period/2 from both directions', () => {
    expect(Dimension.delta(Dimension.radians, 0, Math.PI)).toBe(Math.PI)
    expect(Dimension.delta(Dimension.radians, Math.PI, 0)).toBe(Math.PI)
    expect(Dimension.delta(Dimension.radians, 0, Math.PI + 1e-8)).toBeCloseTo(1e-8 - Math.PI, 12)
  })

  test('delta ignores whole-period offsets', () => {
    const plain = Dimension.delta(Dimension.radians, 0.7, 2.3)
    const shifted = Dimension.delta(Dimension.radians, 0.7 + 5 * TWO_PI, 2.3 - 3 * TWO_PI)
    expect(shifted).toBeCloseTo(plain, 11)
  })

  test('congruent accepts the seam', () => {
    expect(Dimension.congruent(Dimension.radians, TWO_PI - 1e-16, 0)).toBe(true)
    expect(Dimension.congruent(Dimension.radians, 0, TWO_PI)).toBe(true)
    expect(Dimension.congruent(Dimension.radians, 1, 1 + 4 * Math.PI)).toBe(true)
    expect(Dimension.congruent(Dimension.degrees, 359.99999999, 0)).toBe(true)
  })

  test('congruent band scales with the period', () => {
    expect(Dimension.congruent(Dimension.radians, 0, 1e-10)).toBe(true)
    expect(Dimension.congruent(Dimension.radians, 0, 1e-8)).toBe(false)
    expect(Dimension.congruent(Dimension.turns, -1e-11, 1e-11)).toBe(true)
    expect(Dimension.congruent(Dimension.radians, Number.NaN, 0)).toBe(false)
  })

  test('congruent on linear axes is coincident', () => {
    expect(Dimension.congruent(Dimension.linear(), 1, 1 + 1e-12)).toBe(true)
    expect(Dimension.congruent(Dimension.linear(), 1, 1.1)).toBe(false)
  })

  test('unwrap lifts across the seam', () => {
    expect(Dimension.unwrap(Dimension.degrees, [350, 5, 20])).toEqual([350, 365, 380])
    expect(Dimension.unwrap(Dimension.degrees, [10, 350, 300])).toEqual([10, -10, -60])
    expect(Dimension.unwrap(Dimension.degrees, [0, 180])).toEqual([0, 180])
  })

  test('unwrap preserves the first element and handles hue turns', () => {
    expect(Dimension.unwrap(Dimension.degrees, [725, 10])).toEqual([725, 730])
    expect(Dimension.unwrap(Dimension.degrees, [])).toEqual([])

    const hue = Dimension.unwrap(Dimension.turns, [0.9, 0.1, 0.3])
    expect(hue[0]).toBe(0.9)
    expect(hue[1]).toBeCloseTo(1.1, 12)
    expect(hue[2]).toBeCloseTo(1.3, 12)
  })

  test('unwrap returns linear input as-is', () => {
    const values = [3, 1, 4]
    expect(Dimension.unwrap(Dimension.linear(), values)).toBe(values)
  })

  test('lerp runs the short way and wraps', () => {
    expect(Dimension.lerp(Dimension.degrees, 350, 10, 0.5)).toBe(0)
    expect(Dimension.lerp(Dimension.degrees, 350, 10, 0.25)).toBe(355)
    expect(Dimension.lerp(Dimension.linear(), 0, 10, 1.5)).toBe(15)
  })

  test('ops support data-last application', () => {
    expect(Dimension.degrees.pipe(Dimension.delta(350, 10))).toBe(20)
    expect(Dimension.degrees.pipe(Dimension.wrap(370))).toBe(10)
  })
})

describe('coordinateSystem', () => {
  const unitPolar = CoordinateSystem.polar()
  const degreesPolar = CoordinateSystem.polar({ theta: Dimension.degrees })

  test('polar defaults', () => {
    expect(unitPolar.kind).toBe('polar')
    expect(Vector2.equals(unitPolar.center, Vector2.make(0, 0))).toBe(true)
    expect(unitPolar.theta.period).toBe(TWO_PI)
    expect(unitPolar.winding).toBe('clockwise')
    expect(unitPolar.radius.scale).toBe(1)
    expect(unitPolar.radius.offset).toBe(0)
  })

  test('guards and equals', () => {
    expect(CoordinateSystem.isCoordinateSystem(unitPolar)).toBe(true)
    expect(CoordinateSystem.isCoordinateSystem({})).toBe(false)
    expect(CoordinateSystem.isPolar(unitPolar)).toBe(true)
    expect(CoordinateSystem.isCartesian(CoordinateSystem.cartesian)).toBe(true)

    expect(CoordinateSystem.equals(unitPolar, CoordinateSystem.polar())).toBe(true)
    expect(CoordinateSystem.equals(unitPolar, degreesPolar)).toBe(false)
    expect(CoordinateSystem.equals(unitPolar, CoordinateSystem.cartesian)).toBe(false)
    expect(CoordinateSystem.equals(CoordinateSystem.cartesian, CoordinateSystem.cartesian)).toBe(
      true,
    )
  })

  test('toCartesian maps (theta, r) chart points', () => {
    expect(CoordinateSystem.toCartesian(unitPolar, Vector2.make(0, 5))).toBeCloseToValue(
      Vector2.make(5, 0),
    )
    expect(CoordinateSystem.toCartesian(unitPolar, Vector2.make(Math.PI / 2, 5))).toBeCloseToValue(
      Vector2.make(0, 5),
    )
    expect(CoordinateSystem.toCartesian(degreesPolar, Vector2.make(90, 2))).toBeCloseToValue(
      Vector2.make(0, 2),
    )
  })

  test('toCartesian respects winding, center, and radial map', () => {
    const ccw = CoordinateSystem.polar({
      theta: Dimension.degrees,
      winding: 'counterclockwise',
    })
    expect(CoordinateSystem.toCartesian(ccw, Vector2.make(90, 2))).toBeCloseToValue(
      Vector2.make(0, -2),
    )

    const offset = CoordinateSystem.polar({
      center: Vector2.make(10, 20),
      radius: Dimension.linear(2, 40),
    })
    expect(CoordinateSystem.toCartesian(offset, Vector2.make(0, 5))).toBeCloseToValue(
      Vector2.make(60, 20),
    )

    expect(CoordinateSystem.toCartesian(unitPolar, Vector2.make(0, -5))).toBeCloseToValue(
      Vector2.make(-5, 0),
    )
  })

  test('toCartesian on cartesian is the identity', () => {
    const p = Vector2.make(3, 4)
    expect(CoordinateSystem.toCartesian(CoordinateSystem.cartesian, p)).toBe(p)
  })

  test('fromCartesian round-trips up to wrapping', () => {
    const chart = Vector2.make(-13.2, 7)
    const back = CoordinateSystem.fromCartesian(
      unitPolar,
      CoordinateSystem.toCartesian(unitPolar, chart),
    )
    expect(Dimension.congruent(Dimension.radians, back.x, -13.2)).toBe(true)
    expect(back.y).toBeCloseTo(7, 12)
  })

  test('fromCartesian canonicalizes theta and inverts the radial map', () => {
    const below = CoordinateSystem.fromCartesian(unitPolar, Vector2.make(0, -1))
    expect(below.x).toBeCloseTo((3 * Math.PI) / 2, 12)
    expect(below.y).toBeCloseTo(1, 12)

    expect(CoordinateSystem.fromCartesian(unitPolar, Vector2.make(0, 0))).toBeCloseToValue(
      Vector2.make(0, 0),
    )

    const holed = CoordinateSystem.polar({ radius: Dimension.linear(1, 40) })
    expect(CoordinateSystem.fromCartesian(holed, Vector2.make(50, 0)).y).toBeCloseTo(10, 12)
  })

  test('arc reproduces the canonical quarter-circle constants', () => {
    const path = CoordinateSystem.arc(unitPolar, { start: 0, end: Math.PI / 2 }, 1)
    const segments = [...path]
    expect(segments.length).toBe(1)

    const w = (1 + Math.SQRT2) / 3
    const k = 2 - Math.SQRT2
    const expected = RationalCubicCurve2d.fromBezierPoints(
      Vector2.makeWeighted(1, 0, 1),
      Vector2.makeWeighted(1, k, w),
      Vector2.makeWeighted(k, 1, w),
      Vector2.makeWeighted(0, 1, 1),
    )
    const segment = segments[0] as RationalCubicCurve2d.RationalCubicCurve2d
    expect(segment.x).toBeCloseToValue(expected.x)
    expect(segment.y).toBeCloseToValue(expected.y)
    expect(segment.w).toBeCloseToValue(expected.w)
  })

  test('arc stays on the circle', () => {
    const path = CoordinateSystem.arc(
      CoordinateSystem.polar({ center: Vector2.make(2, 3) }),
      { start: 0.3, end: 1.4 },
      5,
    )
    for (let i = 0; i <= 20; i++) {
      const p = RationalCubicPath2d.solve(path, i / 20)
      expect(Math.hypot(p.x - 2, p.y - 3) / 5).toBeCloseTo(1, 12)
    }
    expect(RationalCubicPath2d.solve(path, 0)).toBeCloseToValue(
      Vector2.make(2 + 5 * Math.cos(0.3), 3 + 5 * Math.sin(0.3)),
    )
    expect(RationalCubicPath2d.solve(path, 1)).toBeCloseToValue(
      Vector2.make(2 + 5 * Math.cos(1.4), 3 + 5 * Math.sin(1.4)),
    )
  })

  test('arc splits into quarter-turn segments', () => {
    const segmentCount = (theta: { start: number; end: number }) =>
      [...CoordinateSystem.arc(unitPolar, theta, 1)].length
    expect(segmentCount({ start: 0, end: Math.PI / 2 })).toBe(1)
    expect(segmentCount({ start: 0, end: Math.PI })).toBe(2)
    expect(segmentCount({ start: 0, end: (3 * Math.PI) / 4 })).toBe(2)
    expect(segmentCount({ start: 0, end: TWO_PI })).toBe(4)
    expect([...CoordinateSystem.arc(degreesPolar, { start: 0, end: 90 }, 1)].length).toBe(1)
    expect([...CoordinateSystem.arc(degreesPolar, { start: 0, end: 360 }, 1)].length).toBe(4)
    expect(segmentCount({ start: 0, end: 4 * Math.PI })).toBe(8)
  })

  test('arc sweeps direction from the bounds', () => {
    const path = CoordinateSystem.arc(unitPolar, { start: Math.PI / 2, end: 0 }, 1)
    expect(RationalCubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 1))
    expect(RationalCubicPath2d.solve(path, 0.5)).toBeCloseToValue(
      Vector2.make(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)),
    )
    expect(RationalCubicPath2d.solve(path, 1)).toBeCloseToValue(Vector2.make(1, 0))
  })

  test('arc classification is scale-invariant', () => {
    for (const radius of [1e-6, 1e6]) {
      const path = CoordinateSystem.arc(unitPolar, { start: 0.3, end: 1.4 }, radius)
      for (let i = 0; i <= 10; i++) {
        const p = RationalCubicPath2d.solve(path, i / 10)
        expect(Math.hypot(p.x, p.y) / radius).toBeCloseTo(1, 12)
      }
      const segments = [...path]
      for (let i = 1; i < segments.length; i++) {
        expect(
          Vector2.equals(
            RationalCubicCurve2d.endPoint(
              segments[i - 1] as RationalCubicCurve2d.RationalCubicCurve2d,
            ),
            RationalCubicCurve2d.startPoint(
              segments[i] as RationalCubicCurve2d.RationalCubicCurve2d,
            ),
          ),
        ).toBe(true)
      }
    }
  })

  const junctions = (path: RationalCubicPath2d.RationalCubicPath2d) => {
    const segments = [...path]
    const pairs: Array<[Vector2.Vector2, Vector2.Vector2]> = []
    for (let i = 0; i < segments.length; i++) {
      const previous = segments[
        (i + segments.length - 1) % segments.length
      ] as RationalCubicCurve2d.RationalCubicCurve2d
      const current = segments[i] as RationalCubicCurve2d.RationalCubicCurve2d
      pairs.push([
        RationalCubicCurve2d.endPoint(previous),
        RationalCubicCurve2d.startPoint(current),
      ])
    }
    return pairs
  }

  test('sector closes into a loop', () => {
    const path = CoordinateSystem.sector(unitPolar, { start: 0.5, end: 1.7 }, { start: 1, end: 2 })
    expect([...path].length).toBe(4)
    for (const [end, start] of junctions(path)) {
      expect(Vector2.equals(end, start)).toBe(true)
    }

    const half = CoordinateSystem.sector(
      unitPolar,
      { start: 0, end: Math.PI },
      { start: 1, end: 2 },
    )
    expect([...half].length).toBe(6)
    for (const [end, start] of junctions(half)) {
      expect(Vector2.equals(end, start)).toBe(true)
    }
  })

  test('sector segments play their roles', () => {
    const path = CoordinateSystem.sector(unitPolar, { start: 0.5, end: 1.7 }, { start: 1, end: 2 })
    const segments = [...path] as Array<RationalCubicCurve2d.RationalCubicCurve2d>

    const onOuter = RationalCubicCurve2d.solve(
      segments[0] as RationalCubicCurve2d.RationalCubicCurve2d,
      0.5,
    )
    expect(Math.hypot(onOuter.x, onOuter.y)).toBeCloseTo(2, 12)

    const onEdge = RationalCubicCurve2d.solve(
      segments[1] as RationalCubicCurve2d.RationalCubicCurve2d,
      0.5,
    )
    expect(Math.hypot(onEdge.x, onEdge.y)).toBeCloseTo(1.5, 12)
    expect(Math.atan2(onEdge.y, onEdge.x)).toBeCloseTo(1.7, 12)

    const inner = segments[2] as RationalCubicCurve2d.RationalCubicCurve2d
    expect(RationalCubicCurve2d.startPoint(inner)).toBeCloseToValue(
      Vector2.make(Math.cos(1.7), Math.sin(1.7)),
    )
    expect(RationalCubicCurve2d.endPoint(inner)).toBeCloseToValue(
      Vector2.make(Math.cos(0.5), Math.sin(0.5)),
    )
  })

  test('radial edges are exactly linear rational cubics', () => {
    const path = CoordinateSystem.sector(unitPolar, { start: 0.5, end: 1.7 }, { start: 1, end: 2 })
    const edge = [...path][1] as RationalCubicCurve2d.RationalCubicCurve2d
    expect(edge.x.c2).toBe(0)
    expect(edge.x.c3).toBe(0)
    expect(edge.y.c2).toBe(0)
    expect(edge.y.c3).toBe(0)
    expect(edge.w.c0).toBe(1)
    expect(edge.w.c1).toBe(0)
    expect(edge.w.c2).toBe(0)
    expect(edge.w.c3).toBe(0)
  })

  test('pie slice drops the inner arc and meets the center exactly', () => {
    const path = CoordinateSystem.sector(unitPolar, { start: 0.4, end: 1.4 }, { start: 0, end: 2 })
    const segments = [...path] as Array<RationalCubicCurve2d.RationalCubicCurve2d>
    expect(segments.length).toBe(3)

    const inward = segments[1] as RationalCubicCurve2d.RationalCubicCurve2d
    const outward = segments[2] as RationalCubicCurve2d.RationalCubicCurve2d
    expect(RationalCubicCurve2d.endPoint(inward).x).toBe(0)
    expect(RationalCubicCurve2d.endPoint(inward).y).toBe(0)
    expect(RationalCubicCurve2d.startPoint(outward).x).toBe(0)
    expect(RationalCubicCurve2d.startPoint(outward).y).toBe(0)
    for (const [end, start] of junctions(path)) {
      expect(Vector2.equals(end, start)).toBe(true)
    }
  })

  test('full-turn sector is a slit annulus and multi-turn clamps', () => {
    const ring = CoordinateSystem.sector(unitPolar, { start: 0, end: TWO_PI }, { start: 1, end: 2 })
    expect([...ring].length).toBe(10)
    for (const [end, start] of junctions(ring)) {
      expect(Vector2.equals(end, start)).toBe(true)
    }

    const clamped = CoordinateSystem.sector(
      unitPolar,
      { start: 0, end: 5 * Math.PI },
      { start: 1, end: 2 },
    )
    expect([...clamped].length).toBe(10)
  })

  test('sector normalizes the radial span', () => {
    const flipped = CoordinateSystem.sector(
      unitPolar,
      { start: 0.5, end: 1.7 },
      { start: 2, end: 1 },
    )
    const outer = [...flipped][0] as RationalCubicCurve2d.RationalCubicCurve2d
    const p = RationalCubicCurve2d.solve(outer, 0)
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(2, 12)
  })

  test('cartesian arc and sector are segment and rectangle', () => {
    const segment = CoordinateSystem.arc(CoordinateSystem.cartesian, { start: 0, end: 10 }, 5)
    expect([...segment].length).toBe(1)
    expect(RationalCubicPath2d.solve(segment, 0)).toBeCloseToValue(Vector2.make(0, 5))
    expect(RationalCubicPath2d.solve(segment, 1)).toBeCloseToValue(Vector2.make(10, 5))

    const rect = CoordinateSystem.sector(
      CoordinateSystem.cartesian,
      { start: 0, end: 10 },
      { start: 1, end: 2 },
    )
    expect([...rect].length).toBe(4)
    for (const [end, start] of junctions(rect)) {
      expect(Vector2.equals(end, start)).toBe(true)
    }
  })

  test('arc and sector reject bad inputs', () => {
    expect(() => CoordinateSystem.arc(unitPolar, { start: 0, end: 1 }, -1)).toThrow()
    expect(() => CoordinateSystem.arc(unitPolar, { start: Number.NaN, end: 1 }, 1)).toThrow()
    expect(() =>
      CoordinateSystem.sector(
        CoordinateSystem.polar({ radius: Dimension.linear(1, -10) }),
        { start: 0, end: 1 },
        { start: 0, end: 5 },
      ),
    ).toThrow()
    expect(() =>
      CoordinateSystem.sector(unitPolar, { start: 0, end: 1 }, { start: 0, end: Number.NaN }),
    ).toThrow()
  })

  test('arcPathData emits exact A commands', () => {
    expect(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: Math.PI }, 2)).toBe(
      `M 2,0 A 2 2 0 0 1 ${2 * Math.cos(Math.PI)},${2 * Math.sin(Math.PI)}`,
    )
    expect(CoordinateSystem.arcPathData(unitPolar, { start: Math.PI / 2, end: 0 }, 1)).toContain(
      'A 1 1 0 0 0 ',
    )
  })

  test('arcPathData piece counts and full-circle closure', () => {
    expect(count(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: Math.PI }, 1))).toBe(1)
    expect(
      count(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: (3 * Math.PI) / 2 }, 1)),
    ).toBe(2)

    const circle = CoordinateSystem.arcPathData(unitPolar, { start: 0, end: TWO_PI }, 1)
    expect(count(circle)).toBe(2)
    expect(circle.startsWith('M 1,0 ')).toBe(true)
    expect(circle.endsWith(' 1,0')).toBe(true)

    const clamped = CoordinateSystem.arcPathData(unitPolar, { start: 0, end: 5 * Math.PI }, 1)
    expect(count(clamped)).toBe(2)
  })

  test('arcPathData degenerate contracts', () => {
    expect(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: 0 }, 1)).toBe('M 1,0')
    expect(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: 1 }, 0)).toBe('M 0,0')
    expect(CoordinateSystem.arcPathData(CoordinateSystem.cartesian, { start: 0, end: 10 }, 5)).toBe(
      'M 0,5 L 10,5',
    )
  })

  test('arcPathData endpoints come from the chart description', () => {
    const d = CoordinateSystem.arcPathData(unitPolar, { start: 0.4, end: 1.1 }, 3)
    expect(d.endsWith(`${3 * Math.cos(1.1)},${3 * Math.sin(1.1)}`)).toBe(true)
  })

  test('sectorPathData emits a closed ring segment', () => {
    const d = CoordinateSystem.sectorPathData(
      degreesPolar,
      { start: 0, end: 90 },
      { start: 1, end: 2 },
    )
    expect(d.startsWith('M ')).toBe(true)
    expect(d).toContain(' L ')
    expect(d.endsWith(' Z')).toBe(true)
    expect((d.match(/ A /g) ?? []).length).toBe(2)
    expect(d).toContain('A 2 2 0 0 1 ')
    expect(d).toContain('A 1 1 0 0 0 ')
  })

  test('sectorPathData pie slice closes through the center', () => {
    const d = CoordinateSystem.sectorPathData(
      unitPolar,
      { start: 0.4, end: 1.4 },
      { start: 0, end: 2 },
    )
    expect(d).toContain(' L 0,0 Z')
    expect((d.match(/ A /g) ?? []).length).toBe(1)
  })

  test('sectorPathData full turn emits a two-subpath annulus', () => {
    const d = CoordinateSystem.sectorPathData(
      unitPolar,
      { start: 0, end: TWO_PI },
      { start: 1, end: 2 },
    )
    expect((d.match(/M /g) ?? []).length).toBe(2)
    expect((d.match(/ A /g) ?? []).length).toBe(4)
    expect((d.match(/Z/g) ?? []).length).toBe(2)
    expect(d).toContain('A 2 2 0 0 1 ')
    expect(d).toContain('A 1 1 0 0 0 ')

    const disc = CoordinateSystem.sectorPathData(
      unitPolar,
      { start: 0, end: TWO_PI },
      { start: 0, end: 2 },
    )
    expect((disc.match(/M /g) ?? []).length).toBe(1)
    expect((disc.match(/Z/g) ?? []).length).toBe(1)
  })

  test('sectorPathData degenerate contracts', () => {
    const slit = CoordinateSystem.sectorPathData(
      unitPolar,
      { start: 0, end: 0 },
      { start: 1, end: 2 },
    )
    expect(slit).toBe('M 2,0 L 1,0 Z')

    const arcOnly = CoordinateSystem.sectorPathData(
      unitPolar,
      { start: 0, end: Math.PI / 2 },
      { start: 2, end: 2 },
    )
    expect(arcOnly.endsWith(' Z')).toBe(true)
    expect((arcOnly.match(/ A /g) ?? []).length).toBe(1)

    expect(
      CoordinateSystem.sectorPathData(
        CoordinateSystem.cartesian,
        { start: 0, end: 10 },
        { start: 1, end: 2 },
      ),
    ).toBe('M 0,1 L 10,1 L 10,2 L 0,2 Z')
  })

  test('shape ops support data-last application', () => {
    const dataLast = unitPolar.pipe(CoordinateSystem.arcPathData({ start: 0, end: Math.PI }, 2))
    expect(dataLast).toBe(CoordinateSystem.arcPathData(unitPolar, { start: 0, end: Math.PI }, 2))
  })
})
