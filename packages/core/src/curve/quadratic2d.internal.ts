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

  readonly c0: QuadraticPolynomial.QuadraticPolynomial
  readonly c1: QuadraticPolynomial.QuadraticPolynomial

  constructor(
    c0: QuadraticPolynomial.QuadraticPolynomial,
    c1: QuadraticPolynomial.QuadraticPolynomial,
  ) {
    super()
    this.c0 = c0
    this.c1 = c1
  }
}

export const make: (
  c0: QuadraticPolynomial.QuadraticPolynomial,
  c1: QuadraticPolynomial.QuadraticPolynomial,
) => QuadraticCurve2d = (c0, c1) => new QuadraticCurve2dImpl(c0, c1)

export const isQuadraticCurve2d = (c: unknown): c is QuadraticCurve2d =>
  typeof c === 'object' && c !== null && QuadraticCurve2dTypeId in c

export const solve = dual<
  (t: number) => (c: QuadraticCurve2d) => Vector2.Vector2,
  (c: QuadraticCurve2d, t: number) => Vector2.Vector2
>(2, (c: QuadraticCurve2d, t: number) =>
  Vector2.make(
    QuadraticPolynomial.solve(c.c0, t),
    QuadraticPolynomial.solve(c.c1, t),
  ),
)

export const derivative = (c: QuadraticCurve2d) =>
  LinearCurve2d.make(
    QuadraticPolynomial.derivative(c.c0),
    QuadraticPolynomial.derivative(c.c1),
  )

export const length = dual(2, (c: QuadraticCurve2d, i: Interval.Interval) => {
  if (Interval.size(i) === 0) {
    return 0
  }

  if (c.c0.c2 === 0 && c.c1.c2 === 0) {
    return LinearCurve2d.length(
      LinearCurve2d.make(
        LinearPolynomial.make(c.c0.c0, c.c0.c1),
        LinearPolynomial.make(c.c1.c0, c.c1.c1),
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
