import { bench, describe } from 'vitest'
import * as CubicCurve2d from '../src/curve/cubic2d'
import * as Interval from '../src/interval/interval'
import * as Matrix4x4 from '../src/matrix/matrix4x4'
import * as CubicPath2d from '../src/path/cubic2d'
import * as Bezier2d from '../src/splines/bezier2d'
import * as Cardinal2d from '../src/splines/cardinal2d'
import * as Vector2 from '../src/vector/vector2'

// Module-scoped sink: writing benchmark results here forces V8 to actually
// produce them (the binding could be observed externally), preventing escape
// analysis from eliding short-lived allocations like Vector2 instances.
let _sink: unknown

describe('vector2', () => {
  const a = Vector2.make(1.234, 5.678)
  const b = Vector2.make(9.012, 3.456)

  bench('add x1k', () => {
    let result = a
    for (let i = 0; i < 1000; i++) {
      result = Vector2.add(result, b)
    }
    _sink = result
  })
})

describe('matrix4x4', () => {
  bench('make x1k', () => {
    let result: Matrix4x4.Matrix4x4 | undefined
    for (let i = 0; i < 1000; i++) {
      result = Matrix4x4.make(1, 0, 0, 0, -3, 3, 0, 0, 3, -6, 3, 0, -1, 3, -3, 1)
    }
    _sink = result
  })
})

describe('curve/cubic2d', () => {
  const curve = CubicCurve2d.fromCoefficients(
    Vector2.make(0, 0),
    Vector2.make(0, 1),
    Vector2.make(1, 0),
    Vector2.make(1, 1),
  )

  bench('solve at t=0.5', () => {
    _sink = CubicCurve2d.solve(curve, 0.5)
  })

  bench('length over [0,1]', () => {
    _sink = CubicCurve2d.length(curve, Interval.unit)
  })
})

describe('end-to-end: 4-segment bezier path', () => {
  const bezier = Bezier2d.make(
    Vector2.make(0, 0),
    Vector2.make(0, 1),
    Vector2.make(1, 0),
    Vector2.make(1, 1),
  ).pipe(
    Bezier2d.append(Vector2.make(2, 1), Vector2.make(2, 2), Vector2.make(3, 2)),
    Bezier2d.append(Vector2.make(4, 2), Vector2.make(4, 3), Vector2.make(5, 3)),
    Bezier2d.append(Vector2.make(6, 3), Vector2.make(6, 4), Vector2.make(7, 4)),
  )

  bench('toPath + 1000 samples', () => {
    const path = Bezier2d.toPath(bezier)
    let last: Vector2.Vector2 | undefined
    for (let i = 0; i <= 1000; i++) {
      last = CubicPath2d.solve(path, i / 1000)
    }
    _sink = last
  })
})

describe('arc-length sampling', () => {
  const path = Bezier2d.make(
    Vector2.make(0, 0),
    Vector2.make(0, 1),
    Vector2.make(1, 0),
    Vector2.make(1, 1),
  ).pipe(
    Bezier2d.append(Vector2.make(2, 1), Vector2.make(2, 2), Vector2.make(3, 2)),
    Bezier2d.append(Vector2.make(4, 2), Vector2.make(4, 3), Vector2.make(5, 3)),
    Bezier2d.append(Vector2.make(6, 3), Vector2.make(6, 4), Vector2.make(7, 4)),
    Bezier2d.toPath,
  )

  bench('solveByDistance x 1000 (cached path)', () => {
    let last: Vector2.Vector2 | undefined
    for (let i = 0; i <= 1000; i++) {
      last = CubicPath2d.solveByDistance(path, i / 1000)
    }
    _sink = last
  })
})

describe('cardinal -> bezier', () => {
  const cardinal = Cardinal2d.make(
    Vector2.make(0, 0),
    Vector2.make(1, 1),
    Vector2.make(2, 0),
    Vector2.make(3, 1),
    Vector2.make(4, 0),
    Vector2.make(5, 1),
  ).pipe(Cardinal2d.withDuplicatedEndpoints)

  bench('toBezier (default scale)', () => {
    _sink = Cardinal2d.toBezier(cardinal)
  })

  bench('toBezier (custom scale)', () => {
    _sink = Cardinal2d.toBezier(cardinal, 0.7)
  })
})
