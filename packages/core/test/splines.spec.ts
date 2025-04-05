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

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))
    expect(CubicPath2d.solve(path, 0.5)).toMatchObject(Vector2.make(1, 1))
    expect(CubicPath2d.solve(path, 1)).toMatchObject(Vector2.make(2, 2))

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
    ).pipe(Bezier2d.appendCurvatureMirrored(1, 0, Vector2.make(1, 2)))

    const path = Bezier2d.toPath(points)

    const [a, b] = [...path] as [CubicCurve2d.CubicCurve2d, CubicCurve2d.CubicCurve2d]

    expect(CubicCurve2d.curvature(a, 1)).toBe(CubicCurve2d.curvature(b, 0))
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

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))

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

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))

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

    expect(CubicPath2d.solve(path, 0)).toMatchObject(Vector2.make(0, 0))

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
