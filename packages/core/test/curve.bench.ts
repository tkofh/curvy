import { bench, describe } from 'vitest'
import * as Arc from '../src/arc/arc.ts'
import * as CubicCurve2d from '../src/curve/cubic2d.ts'
import * as Interval from '../src/interval/interval.ts'
import * as QuadraticCurve2d from '../src/curve/quadratic2d.ts'
import * as Matrix4x4 from '../src/matrix/matrix4x4.ts'
import * as Piecewise from '../src/piecewise/piecewise.ts'
import * as CubicPolynomial from '../src/polynomial/cubic.ts'
import * as CubicPath2d from '../src/path/cubic2d.ts'
import * as Polygon2d from '../src/polygon/polygon2d.ts'
import * as Bezier2d from '../src/splines/bezier2d.ts'
import * as Cardinal2d from '../src/splines/cardinal2d.ts'
import * as Vector2 from '../src/vector/vector2.ts'

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

  bench('boundingBox', () => {
    _sink = CubicCurve2d.boundingBox(curve)
  })
})

describe('curve/quadratic2d', () => {
  const curve = QuadraticCurve2d.fromBezierPoints(
    Vector2.make(0, 0),
    Vector2.make(1, 2),
    Vector2.make(3, 0),
  )

  bench('length over [0,1]', () => {
    _sink = QuadraticCurve2d.length(curve, Interval.unit)
  })
})

describe('polygon2d', () => {
  const polygon = Polygon2d.fromArray(
    Array.from({ length: 1000 }, (_, i) => Vector2.make(Math.cos(i), Math.sin(i))),
  )

  bench('boundingBox, 1000 vertices', () => {
    _sink = Polygon2d.boundingBox(polygon)
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
  const points = [
    Vector2.make(0, 0),
    Vector2.make(1, 1),
    Vector2.make(2, 0),
    Vector2.make(3, 1),
    Vector2.make(4, 0),
    Vector2.make(5, 1),
  ] as const
  const centripetal = Cardinal2d.fromArray(points).pipe(Cardinal2d.withDuplicatedEndpoints)
  const customTension = centripetal.pipe(Cardinal2d.withTension(0.7))
  const uniform = centripetal.pipe(Cardinal2d.withAlpha(0))

  bench('toBezier (centripetal default)', () => {
    _sink = Cardinal2d.toBezier(centripetal)
  })

  bench('toBezier (custom tension)', () => {
    _sink = Cardinal2d.toBezier(customTension)
  })

  bench('toBezier (uniform alpha = 0)', () => {
    _sink = Cardinal2d.toBezier(uniform)
  })
})

describe('easing', () => {
  // CSS ease-in-out.
  const ease = CubicCurve2d.fromBezierPoints(
    Vector2.make(0, 0),
    Vector2.make(0.42, 0),
    Vector2.make(0.58, 1),
    Vector2.make(1, 1),
  )
  const threeRoots = CubicPolynomial.make(0, 11, -6, 1) // roots of y = 6 at 1, 2, 3

  bench('CubicCurve2d.solveAtX x 100', () => {
    let last: unknown
    for (let i = 0; i <= 100; i++) {
      last = CubicCurve2d.solveAtX(ease, i / 100)
    }
    _sink = last
  })

  bench('CubicPolynomial.solveInverse, three roots', () => {
    _sink = CubicPolynomial.solveInverse(threeRoots, 6)
  })
})

const steps = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    CubicCurve2d.fromBezierPoints(
      Vector2.make(i, i),
      Vector2.make(i + 0.42, i),
      Vector2.make(i + 0.58, i + 1),
      Vector2.make(i + 1, i + 1),
    ),
  )

const pieces = (count: number) =>
  Piecewise.fromArray(
    Array.from(
      { length: count },
      (_, i) => [Interval.make(i, i + 1), CubicPolynomial.make(i, 0, 3, -2)] as const,
    ),
  )

describe('segment lookup', () => {
  for (const count of [4, 64]) {
    const path = CubicPath2d.asMonotonicX(CubicPath2d.fromArray(steps(count)))
    const pp = pieces(count)

    bench(`CubicPath2d.solveAtX x 100, ${count} segments`, () => {
      let last: unknown
      for (let i = 0; i <= 100; i++) {
        last = CubicPath2d.solveAtX(path, (i / 100) * count)
      }
      _sink = last
    })

    bench(`Piecewise.solve x 100, ${count} pieces`, () => {
      let last: unknown
      for (let i = 0; i <= 100; i++) {
        last = Piecewise.solve(pp, (i / 100) * count)
      }
      _sink = last
    })
  }
})

describe('arc', () => {
  const ellipse = Arc.elliptical({ radiusX: 3, radiusY: 1, rotation: 0.4, sweep: Math.PI })

  bench('elliptical Arc.solve x 100', () => {
    let last: unknown
    for (let i = 0; i <= 100; i++) {
      last = Arc.solve(ellipse, i / 100)
    }
    _sink = last
  })
})
