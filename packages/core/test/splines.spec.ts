import { describe, expect, test } from 'vitest'
import * as CubicCurve2d from '../src/curve/cubic2d'
import * as CubicPath2d from '../src/path/cubic2d'
import * as RationalCubicPath2d from '../src/path/rationalCubic2d'
import * as Basis2d from '../src/splines/basis2d'
import * as Bezier2d from '../src/splines/bezier2d'
import * as Cardinal2d from '../src/splines/cardinal2d'
import * as Hermite2d from '../src/splines/hermite2d'
import * as RationalBezier2d from '../src/splines/rationalBezier2d'
import * as Vector2 from '../src/vector/vector2'

describe('bezier', () => {
  test('makes a path', () => {
    const path = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(
      Bezier2d.append(Vector2.make(1, 2), Vector2.make(2, 1), Vector2.make(2, 2)),
      Bezier2d.toPath,
    )

    expect(CubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 0))
    expect(CubicPath2d.solve(path, 0.5)).toBeCloseToValue(Vector2.make(1, 1))
    expect(CubicPath2d.solve(path, 1)).toBeCloseToValue(Vector2.make(2, 2))

    // for (let i = 0; i <= 100; i++) {
    //   const t = i / 100
    //   console.log(CubicPath2d.solve(path, t).toString())
    // }
  })
  test('g2 continuity', () => {
    const points = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(Bezier2d.appendCurvatureAligned(1, 0, Vector2.make(1, 2)))

    const path = Bezier2d.toPath(points)

    const [a, b] = [...path] as [CubicCurve2d.CubicCurve2d, CubicCurve2d.CubicCurve2d]

    expect(CubicCurve2d.curvature(a, 1)).toBeCloseTo(CubicCurve2d.curvature(b, 0), 10)
  })
  test('subdivide preserves curve shape', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    const fullPath = Bezier2d.toPath(bezier)
    const [left, right] = Bezier2d.subdivide(bezier, 0.3)
    const leftPath = Bezier2d.toPath(left)
    const rightPath = Bezier2d.toPath(right)

    // The two halves together should trace the same curve as the original.
    // Sample left's u ∈ [0, 1] which maps to original u ∈ [0, 0.3].
    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(CubicPath2d.solve(leftPath, t)).toBeCloseToValue(CubicPath2d.solve(fullPath, 0.3 * t))
      expect(CubicPath2d.solve(rightPath, t)).toBeCloseToValue(
        CubicPath2d.solve(fullPath, 0.3 + 0.7 * t),
      )
    }
  })
  test('subdivide endpoints match', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    const [left, right] = Bezier2d.subdivide(bezier, 0.5)
    const leftPath = Bezier2d.toPath(left)
    const rightPath = Bezier2d.toPath(right)

    // Right's start equals left's end equals the split point.
    expect(CubicPath2d.solve(rightPath, 0)).toBeCloseToValue(CubicPath2d.solve(leftPath, 1))
  })
  test('subdivide multi-segment at segment boundary', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(Bezier2d.append(Vector2.make(1, 2), Vector2.make(2, 1), Vector2.make(2, 2)))

    const [left, right] = Bezier2d.subdivide(bezier, 0.5)
    // 2 segments, split at u=0.5 = exact boundary → left = first segment, right = second
    expect([...left]).toHaveLength(4)
    expect([...right]).toHaveLength(4)
  })
  test('subdivide multi-segment in middle of second segment', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(0, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 1),
    ).pipe(Bezier2d.append(Vector2.make(1, 2), Vector2.make(2, 1), Vector2.make(2, 2)))

    const fullPath = Bezier2d.toPath(bezier)
    const [left, right] = Bezier2d.subdivide(bezier, 0.75)
    const leftPath = Bezier2d.toPath(left)
    const rightPath = Bezier2d.toPath(right)

    // left covers [0, 0.75] of original; right covers [0.75, 1]
    expect(CubicPath2d.solve(leftPath, 1)).toBeCloseToValue(CubicPath2d.solve(fullPath, 0.75))
    expect(CubicPath2d.solve(rightPath, 0)).toBeCloseToValue(CubicPath2d.solve(fullPath, 0.75))
  })
  test('subdivide rejects out-of-range parameters', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    expect(() => Bezier2d.subdivide(bezier, 0)).toThrowError()
    expect(() => Bezier2d.subdivide(bezier, 1)).toThrowError()
    expect(() => Bezier2d.subdivide(bezier, -0.1)).toThrowError()
    expect(() => Bezier2d.subdivide(bezier, 1.1)).toThrowError()
  })
})

describe('hermite', () => {
  test('makes a path', () => {
    const points = Hermite2d.make(
      Vector2.zero,
      Vector2.make(1, 1),
      Vector2.make(1, 0),
      Vector2.make(1, -1),
    )
    const path = Hermite2d.toPath(points)

    expect(CubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 0))

    // for (let i = 0; i <= 10; i++) {
    //   const t = i / 10
    //   console.log(CubicPath2d.solve(path, t).toString())
    // }
  })
})

describe('cardinal', () => {
  test('makes a path', () => {
    const points = Cardinal2d.make(
      Vector2.zero,
      Vector2.make(0, 1),
      Vector2.make(1, 1),
      Vector2.make(1, 0),
    )
    const path = Cardinal2d.toPath(points.pipe(Cardinal2d.withDuplicatedEndpoints))

    expect(CubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 0))

    // for (let i = 0; i <= 50; i++) {
    //   const t = i / 50
    //   console.log(CubicPath2d.solve(path, t).toString())
    // }
  })
})

describe('basis', () => {
  test('makes a path', () => {
    const points = Basis2d.fromArray([
      Vector2.zero,
      Vector2.zero,
      Vector2.zero,
      Vector2.make(0, 1),
      Vector2.make(0, 1),
      Vector2.make(0, 1),
      Vector2.make(1, 1),
      Vector2.make(1, 1),
      Vector2.make(1, 1),
      Vector2.make(1, 0),
      Vector2.make(1, 0),
      Vector2.make(1, 0),
    ])
    const path = points.pipe(
      // Basis2d.withTriplicatedEndpoints,
      Basis2d.toPath,
    )

    expect(CubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 0))

    // for (let i = 0; i <= 50; i++) {
    //   const t = i / 50
    //   console.log(CubicPath2d.solve(path, t).toString())
    // }
  })

  test('to bezier', () => {
    const points = Basis2d.fromArray([
      Vector2.zero,
      Vector2.make(0, 1),
      Vector2.make(1, 1),
      Vector2.make(1, 0),
    ]).pipe(Basis2d.withTriplicatedEndpoints)

    const bezier = Basis2d.toBezier(points)

    const basisPath = Basis2d.toPath(points)
    const bezierPath = Bezier2d.toPath(bezier)

    // for (const curve of basisPath) {
    //   console.log(curve)
    // }
    // console.log('------------------------------')
    // for (const curve of bezierPath) {
    //   console.log(curve)
    // }

    for (let i = 0; i <= 10; i++) {
      const t = i / 10

      const { x: x1, y: y1 } = CubicPath2d.solve(basisPath, t)
      const { x: x2, y: y2 } = CubicPath2d.solve(bezierPath, t)
      expect(x1).toBeCloseTo(x2)
      expect(y1).toBeCloseTo(y2)
    }
  })
})

describe('rational bezier', () => {
  test('uniform weights match the polynomial bezier', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    const bezierPath = Bezier2d.toPath(bezier)
    // c chosen != 1 to confirm the curve is shape-invariant under uniform
    // weight scaling — only the ratios matter.
    const c = 2.5
    const rationalPath = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, c),
      Vector2.makeWeighted(1, 2, c),
      Vector2.makeWeighted(3, 2, c),
      Vector2.makeWeighted(4, 0, c),
    ).pipe(RationalBezier2d.toPath)

    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(RationalCubicPath2d.solve(rationalPath, t)).toBeCloseToValue(
        CubicPath2d.solve(bezierPath, t),
      )
    }
  })

  test('solve at endpoints returns the endpoint control points', () => {
    const path = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 3),
      Vector2.makeWeighted(3, 2, 0.5),
      Vector2.makeWeighted(4, 0, 1),
    ).pipe(RationalBezier2d.toPath)
    expect(RationalCubicPath2d.solve(path, 0)).toBeCloseToValue(Vector2.make(0, 0))
    expect(RationalCubicPath2d.solve(path, 1)).toBeCloseToValue(Vector2.make(4, 0))
  })

  test('exactly traces a unit-circle quarter arc', () => {
    // Rational cubic Bézier that exactly represents the unit-circle quarter
    // arc from (1, 0) to (0, 1). Derived by degree-elevating the canonical
    // rational quadratic (P=(1,0),(1,1),(0,1), w=(1, √2/2, 1)) — the cubic
    // form is the smallest representation that fits this library's API.
    const sqrt2 = Math.SQRT2
    const w = (1 + sqrt2) / 3
    const k = 2 - sqrt2

    const arc = RationalBezier2d.make(
      Vector2.makeWeighted(1, 0, 1),
      Vector2.withWeight(Vector2.make(1, k), w),
      Vector2.withWeight(Vector2.make(k, 1), w),
      Vector2.makeWeighted(0, 1, 1),
    ).pipe(RationalBezier2d.toPath)

    // Every sampled point lies on the unit circle (radius² = 1).
    for (let i = 0; i <= 20; i++) {
      const t = i / 20
      const p = RationalCubicPath2d.solve(arc, t)
      expect(p.x * p.x + p.y * p.y).toBeCloseTo(1, 10)
    }

    // t = 0.5 is the angular midpoint by symmetry — must land at 45°.
    expect(RationalCubicPath2d.solve(arc, 0.5)).toBeCloseToValue(Vector2.make(sqrt2 / 2, sqrt2 / 2))
  })

  test('iterator yields Vector2.Weighted that round-trips via withWeight', () => {
    const rational = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 3),
      Vector2.makeWeighted(3, 2, 0.5),
      Vector2.makeWeighted(4, 0, 1),
    )
    const points = [...rational]
    expect(points).toHaveLength(4)
    for (const p of points) {
      expect(Vector2.isWeighted(p)).toBe(true)
    }
    expect(points[0]?.weight).toBe(1)
    expect(points[1]?.weight).toBe(3)
    expect(points[2]?.weight).toBe(0.5)
  })

  test('fromBezier round-trips via Bezier2d.fromRational', () => {
    const bezier = Bezier2d.make(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    const rational = RationalBezier2d.fromBezier(bezier)
    const recovered = Bezier2d.fromRational(rational)
    expect(recovered._tag).toBe('one')
    if (recovered._tag === 'one') {
      const original = [...bezier]
      const round = [...recovered.value]
      expect(original.length).toBe(round.length)
      for (let i = 0; i < original.length; i++) {
        expect(round[i]).toBeCloseToValue(original[i])
      }
    }
  })

  test('Bezier2d.fromRational returns none when weights are non-uniform', () => {
    const rational = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 3),
      Vector2.makeWeighted(3, 2, 1),
      Vector2.makeWeighted(4, 0, 1),
    )
    expect(Bezier2d.fromRational(rational)._tag).toBe('none')
  })

  test('Bezier2d.fromRational accepts uniform-but-non-unit weights', () => {
    const rational = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 4),
      Vector2.makeWeighted(1, 2, 4),
      Vector2.makeWeighted(3, 2, 4),
      Vector2.makeWeighted(4, 0, 4),
    )
    const recovered = Bezier2d.fromRational(rational)
    expect(recovered._tag).toBe('one')
  })

  test('subdivide preserves the curve', () => {
    const sqrt2 = Math.SQRT2
    const w = (1 + sqrt2) / 3
    const k = 2 - sqrt2
    const arc = RationalBezier2d.make(
      Vector2.makeWeighted(1, 0, 1),
      Vector2.withWeight(Vector2.make(1, k), w),
      Vector2.withWeight(Vector2.make(k, 1), w),
      Vector2.makeWeighted(0, 1, 1),
    )
    const [left, right] = RationalBezier2d.subdivide(arc, 0.3)
    const arcPath = RationalBezier2d.toPath(arc)
    const leftPath = RationalBezier2d.toPath(left)
    const rightPath = RationalBezier2d.toPath(right)

    for (let i = 0; i <= 10; i++) {
      const t = i / 10
      expect(RationalCubicPath2d.solve(leftPath, t)).toBeCloseToValue(
        RationalCubicPath2d.solve(arcPath, 0.3 * t),
      )
      expect(RationalCubicPath2d.solve(rightPath, t)).toBeCloseToValue(
        RationalCubicPath2d.solve(arcPath, 0.3 + 0.7 * t),
      )
    }
  })

  test('subdivide endpoints match', () => {
    const rational = RationalBezier2d.make(
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(1, 2, 2),
      Vector2.makeWeighted(3, 2, 2),
      Vector2.makeWeighted(4, 0, 1),
    )
    const [left, right] = RationalBezier2d.subdivide(rational, 0.5)
    const leftPath = RationalBezier2d.toPath(left)
    const rightPath = RationalBezier2d.toPath(right)
    expect(RationalCubicPath2d.solve(rightPath, 0)).toBeCloseToValue(
      RationalCubicPath2d.solve(leftPath, 1),
    )
  })

  test('multi-segment fromArray and subdivide at segment boundary', () => {
    const rational = RationalBezier2d.fromArray([
      Vector2.makeWeighted(0, 0, 1),
      Vector2.makeWeighted(0, 1, 1),
      Vector2.makeWeighted(1, 0, 1),
      Vector2.makeWeighted(1, 1, 1),
      Vector2.makeWeighted(1, 2, 1),
      Vector2.makeWeighted(2, 1, 1),
      Vector2.makeWeighted(2, 2, 1),
    ])
    const [left, right] = RationalBezier2d.subdivide(rational, 0.5)
    expect([...left]).toHaveLength(4)
    expect([...right]).toHaveLength(4)
  })

  test('subdivide rejects out-of-range parameters', () => {
    const rational = RationalBezier2d.fromPoints(
      Vector2.make(0, 0),
      Vector2.make(1, 2),
      Vector2.make(3, 2),
      Vector2.make(4, 0),
    )
    expect(() => RationalBezier2d.subdivide(rational, 0)).toThrowError()
    expect(() => RationalBezier2d.subdivide(rational, 1)).toThrowError()
    expect(() => RationalBezier2d.subdivide(rational, -0.1)).toThrowError()
    expect(() => RationalBezier2d.subdivide(rational, 1.1)).toThrowError()
  })

  test('Vector2.makeWeighted rejects non-positive or non-finite weights', () => {
    expect(() => Vector2.makeWeighted(1, 2, 0)).toThrowError()
    expect(() => Vector2.makeWeighted(1, 2, -1)).toThrowError()
    expect(() => Vector2.makeWeighted(1, 2, Number.POSITIVE_INFINITY)).toThrowError()
    expect(() => Vector2.makeWeighted(1, 2, Number.NaN)).toThrowError()
  })
})
