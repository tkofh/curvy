import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Interval from '../interval'
import {
  GL32_W0,
  GL32_W1,
  GL32_W2,
  GL32_W3,
  GL32_W4,
  GL32_W5,
  GL32_W6,
  GL32_W7,
  GL32_W8,
  GL32_W9,
  GL32_W10,
  GL32_W11,
  GL32_W12,
  GL32_W13,
  GL32_W14,
  GL32_W15,
  GL32_X0,
  GL32_X1,
  GL32_X2,
  GL32_X3,
  GL32_X4,
  GL32_X5,
  GL32_X6,
  GL32_X7,
  GL32_X8,
  GL32_X9,
  GL32_X10,
  GL32_X11,
  GL32_X12,
  GL32_X13,
  GL32_X14,
  GL32_X15,
} from '../length'
import * as CubicPolynomial from '../polynomial/cubic'
import * as QuadraticPolynomial from '../polynomial/quadratic'
import { round } from '../util'
import * as Vector2 from '../vector/vector2'
import type { CubicCurve2d } from './cubic2d'
import * as LinearCurve2d from './linear2d'
import * as QuadraticCurve2d from './quadratic2d'

export const CubicCurve2dTypeId: unique symbol = Symbol('curvy/curve/cubic2d')
export type CubicCurve2dTypeId = typeof CubicCurve2dTypeId

export class CubicCurve2dImpl extends Pipeable implements CubicCurve2d {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId = CubicCurve2dTypeId

  readonly x: CubicPolynomial.CubicPolynomial
  readonly y: CubicPolynomial.CubicPolynomial

  constructor(
    c0: CubicPolynomial.CubicPolynomial,
    c1: CubicPolynomial.CubicPolynomial,
  ) {
    super()
    this.x = c0
    this.y = c1
  }

  get [0]() {
    return this.x
  }

  get [1]() {
    return this.y
  }
}

export const fromPolynomials: (
  c0: CubicPolynomial.CubicPolynomial,
  c1: CubicPolynomial.CubicPolynomial,
) => CubicCurve2d = (c0, c1) => new CubicCurve2dImpl(c0, c1)

export const fromPoints: (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
) => CubicCurve2d = (p0, p1, p2, p3) =>
  new CubicCurve2dImpl(
    CubicPolynomial.make(p0.x, p1.x, p2.x, p3.x),
    CubicPolynomial.make(p0.y, p1.y, p2.y, p3.y),
  )

export const isCubicCurve2d = (c: unknown): c is CubicCurve2d =>
  typeof c === 'object' && c !== null && CubicCurve2dTypeId in c

export const solve = dual<
  (t: number) => (c: CubicCurve2d) => Vector2.Vector2,
  (c: CubicCurve2d, t: number) => Vector2.Vector2
>(2, (c: CubicCurve2d, t: number) =>
  Vector2.make(CubicPolynomial.solve(c.x, t), CubicPolynomial.solve(c.y, t)),
)

export const derivative = (c: CubicCurve2d) =>
  QuadraticCurve2d.fromPolynomials(
    CubicPolynomial.derivative(c.x),
    CubicPolynomial.derivative(c.y),
  )

export const length = dual(2, (c: CubicCurve2d, i: Interval.Interval) => {
  if (Interval.size(i) === 0) {
    return 0
  }

  if (c.x.c3 === 0 && c.y.c3 === 0) {
    return QuadraticCurve2d.length(
      QuadraticCurve2d.fromPolynomials(
        QuadraticPolynomial.make(c.x.c0, c.x.c1, c.x.c2),
        QuadraticPolynomial.make(c.y.c0, c.y.c1, c.y.c2),
      ),
      i,
    )
  }

  const d = derivative(c)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, i)

  return round(
    (GL32_W0 *
      Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X0)) +
      GL32_W0 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X0)) +
      GL32_W1 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X1)) +
      GL32_W1 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X1)) +
      GL32_W2 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X2)) +
      GL32_W2 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X2)) +
      GL32_W3 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X3)) +
      GL32_W3 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X3)) +
      GL32_W4 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X4)) +
      GL32_W4 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X4)) +
      GL32_W5 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X5)) +
      GL32_W5 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X5)) +
      GL32_W6 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X6)) +
      GL32_W6 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X6)) +
      GL32_W7 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X7)) +
      GL32_W7 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X7)) +
      GL32_W8 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X8)) +
      GL32_W8 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X8)) +
      GL32_W9 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X9)) +
      GL32_W9 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X9)) +
      GL32_W10 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X10),
        ) +
      GL32_W10 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X10)) +
      GL32_W11 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X11),
        ) +
      GL32_W11 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X11)) +
      GL32_W12 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X12),
        ) +
      GL32_W12 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X12)) +
      GL32_W13 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X13),
        ) +
      GL32_W13 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X13)) +
      GL32_W14 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X14),
        ) +
      GL32_W14 *
        Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X14)) +
      GL32_W15 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * -GL32_X15),
        ) +
      GL32_W15 *
        Vector2.magnitude(
          QuadraticCurve2d.solve(d, shift + scale * GL32_X15),
        )) *
      scale,
  )
})

export const curvature = dual(2, (c: CubicCurve2d, t: number) => {
  const d = derivative(c)

  const v = QuadraticCurve2d.solve(d, t)
  const a = LinearCurve2d.solve(QuadraticCurve2d.derivative(d), t)

  return round(Math.abs(Vector2.cross(v, a)) / Vector2.magnitude(v) ** 3)
})
