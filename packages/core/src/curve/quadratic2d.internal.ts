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
import * as LinearPolynomial from '../polynomial/linear'
import * as QuadraticPolynomial from '../polynomial/quadratic'
import { round } from '../util'
import * as Vector2 from '../vector/vector2'
import * as LinearCurve2d from './linear2d'
import type { QuadraticCurve2d } from './quadratic2d'

export const QuadraticCurve2dTypeId: unique symbol = Symbol(
  'curvy/curve/quadratic2d',
)
export type QuadraticCurve2dTypeId = typeof QuadraticCurve2dTypeId

export class QuadraticCurve2dImpl extends Pipeable implements QuadraticCurve2d {
  readonly [QuadraticCurve2dTypeId]: QuadraticCurve2dTypeId =
    QuadraticCurve2dTypeId

  readonly x: QuadraticPolynomial.QuadraticPolynomial
  readonly y: QuadraticPolynomial.QuadraticPolynomial

  constructor(
    c0: QuadraticPolynomial.QuadraticPolynomial,
    c1: QuadraticPolynomial.QuadraticPolynomial,
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
  c0: QuadraticPolynomial.QuadraticPolynomial,
  c1: QuadraticPolynomial.QuadraticPolynomial,
) => QuadraticCurve2d = (c0, c1) => new QuadraticCurve2dImpl(c0, c1)

export const fromPoints: (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
) => QuadraticCurve2d = (p0, p1, p2) =>
  new QuadraticCurve2dImpl(
    QuadraticPolynomial.make(p0.x, p1.x, p2.x),
    QuadraticPolynomial.make(p0.y, p1.y, p2.y),
  )

export const isQuadraticCurve2d = (c: unknown): c is QuadraticCurve2d =>
  typeof c === 'object' && c !== null && QuadraticCurve2dTypeId in c

export const solve = dual<
  (t: number) => (c: QuadraticCurve2d) => Vector2.Vector2,
  (c: QuadraticCurve2d, t: number) => Vector2.Vector2
>(2, (c: QuadraticCurve2d, t: number) =>
  Vector2.make(
    QuadraticPolynomial.solve(c.x, t),
    QuadraticPolynomial.solve(c.y, t),
  ),
)

export const derivative = (c: QuadraticCurve2d) =>
  LinearCurve2d.fromPolynomials(
    QuadraticPolynomial.derivative(c.x),
    QuadraticPolynomial.derivative(c.y),
  )

export const length = dual(2, (c: QuadraticCurve2d, i: Interval.Interval) => {
  if (Interval.size(i) === 0) {
    return 0
  }

  if (c.x.c2 === 0 && c.y.c2 === 0) {
    return LinearCurve2d.length(
      LinearCurve2d.fromPolynomials(
        LinearPolynomial.make(c.x.c0, c.x.c1),
        LinearPolynomial.make(c.y.c0, c.y.c1),
      ),
      i,
    )
  }

  const d = derivative(c)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, i)

  return round(
    (GL32_W0 *
      Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X0)) +
      GL32_W0 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X0)) +
      GL32_W1 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X1)) +
      GL32_W1 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X1)) +
      GL32_W2 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X2)) +
      GL32_W2 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X2)) +
      GL32_W3 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X3)) +
      GL32_W3 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X3)) +
      GL32_W4 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X4)) +
      GL32_W4 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X4)) +
      GL32_W5 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X5)) +
      GL32_W5 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X5)) +
      GL32_W6 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X6)) +
      GL32_W6 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X6)) +
      GL32_W7 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X7)) +
      GL32_W7 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X7)) +
      GL32_W8 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X8)) +
      GL32_W8 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X8)) +
      GL32_W9 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X9)) +
      GL32_W9 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X9)) +
      GL32_W10 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X10)) +
      GL32_W10 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X10)) +
      GL32_W11 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X11)) +
      GL32_W11 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X11)) +
      GL32_W12 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X12)) +
      GL32_W12 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X12)) +
      GL32_W13 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X13)) +
      GL32_W13 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X13)) +
      GL32_W14 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X14)) +
      GL32_W14 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X14)) +
      GL32_W15 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * -GL32_X15)) +
      GL32_W15 *
        Vector2.magnitude(LinearCurve2d.solve(d, shift + scale * GL32_X15))) *
      scale,
  )
})

export const curvature = dual(2, (c: QuadraticCurve2d, t: number) => {
  const d = derivative(c)
  const v = LinearCurve2d.solve(d, t)
  const a = LinearCurve2d.derivative(d)

  return round(Math.abs(Vector2.cross(v, a)) / Vector2.magnitude(v) ** 3)
})
