import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import * as LinearPolynomial from '../polynomial/linear'
import * as Vector2 from '../vector/vector2'
import type { LinearCurve2d } from './linear2d'

export const LinearCurve2dTypeId: unique symbol = Symbol('curvy/curve/linear2d')
export type LinearCurve2dTypeId = typeof LinearCurve2dTypeId

export class LinearCurve2dImpl extends Pipeable implements LinearCurve2d {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId = LinearCurve2dTypeId

  readonly c0: LinearPolynomial.LinearPolynomial
  readonly c1: LinearPolynomial.LinearPolynomial

  constructor(
    c0: LinearPolynomial.LinearPolynomial,
    c1: LinearPolynomial.LinearPolynomial,
  ) {
    super()
    this.c0 = c0
    this.c1 = c1
  }
}

export const make: (
  c0: LinearPolynomial.LinearPolynomial,
  c1: LinearPolynomial.LinearPolynomial,
) => LinearCurve2d = (c0, c1) => new LinearCurve2dImpl(c0, c1)

export const isLinearCurve2d = (c: unknown): c is LinearCurve2d =>
  typeof c === 'object' && c !== null && LinearCurve2dTypeId in c

export const solve = dual<
  (t: number) => (c: LinearCurve2d) => Vector2.Vector2,
  (c: LinearCurve2d, t: number) => Vector2.Vector2
>(2, (c: LinearCurve2d, t: number) =>
  Vector2.make(
    LinearPolynomial.solve(c.c0, t),
    LinearPolynomial.solve(c.c1, t),
  ),
)

export const length = dual(
  2,
  (c: LinearCurve2d, i: Interval) =>
    Math.sqrt(c.c0.c1 ** 2 + c.c1.c1 ** 2) * Math.abs(i.end - i.start),
)
