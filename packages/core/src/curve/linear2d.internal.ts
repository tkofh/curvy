import type { Interval } from '../interval'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import * as LinearPolynomial from '../polynomial/linear'
import { round } from '../utils'
import * as Vector2 from '../vector/vector2'
import type { LinearCurve2d } from './linear2d'

export const LinearCurve2dTypeId: unique symbol = Symbol('curvy/curve/linear2d')
export type LinearCurve2dTypeId = typeof LinearCurve2dTypeId

export class LinearCurve2dImpl extends Pipeable implements LinearCurve2d {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId = LinearCurve2dTypeId

  readonly x: LinearPolynomial.LinearPolynomial
  readonly y: LinearPolynomial.LinearPolynomial

  constructor(c0: LinearPolynomial.LinearPolynomial, c1: LinearPolynomial.LinearPolynomial) {
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
  c0: LinearPolynomial.LinearPolynomial,
  c1: LinearPolynomial.LinearPolynomial,
) => LinearCurve2d = (c0, c1) => new LinearCurve2dImpl(c0, c1)

export const fromPoints: (p0: Vector2.Vector2, p1: Vector2.Vector2) => LinearCurve2d = (p0, p1) =>
  new LinearCurve2dImpl(LinearPolynomial.make(p0.x, p1.x), LinearPolynomial.make(p0.y, p1.y))

export const isLinearCurve2d = (c: unknown): c is LinearCurve2d =>
  typeof c === 'object' && c !== null && LinearCurve2dTypeId in c

export const derivative = (c: LinearCurve2d) => Vector2.make(c.x.c1, c.y.c1)

export const solve = dual<
  (t: number) => (c: LinearCurve2d) => Vector2.Vector2,
  (c: LinearCurve2d, t: number) => Vector2.Vector2
>(2, (c: LinearCurve2d, t: number) =>
  Vector2.make(LinearPolynomial.solve(c.x, t), LinearPolynomial.solve(c.y, t)),
)

export const length = dual(2, (c: LinearCurve2d, i: Interval) =>
  round(Math.sqrt(c.x.c1 ** 2 + c.y.c1 ** 2) * Math.abs(i.end - i.start)),
)
