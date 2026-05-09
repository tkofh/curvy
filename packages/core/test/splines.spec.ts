import { describe, expect, test } from 'vitest'
import * as CubicCurve2d from '../src/curve/cubic2d'
import * as CubicPath2d from '../src/path/cubic2d'
import * as Basis2d from '../src/splines/basis2d'
import * as Bezier2d from '../src/splines/bezier2d'
import * as Cardinal2d from '../src/splines/cardinal2d'
import * as Hermite2d from '../src/splines/hermite2d'
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
