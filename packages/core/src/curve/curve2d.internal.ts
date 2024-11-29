import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import type { Polynomial } from '../polynomial'
import * as CubicPolynomial from '../polynomial/cubic'
import * as LinearPolynomial from '../polynomial/linear'
import * as QuadraticPolynomial from '../polynomial/quadratic'
import * as Vector2 from '../vector/vector2'
import type { Curve2d } from './curve2d'

export const Curve2dTypeId: unique symbol = Symbol.for('curvy/curve/curve2d')
export type Curve2dTypeId = typeof Curve2dTypeId

export class Curve2dInternal<P extends Polynomial>
  extends Pipeable
  implements Curve2d<P>
{
  readonly [Curve2dTypeId]: Curve2dTypeId = Curve2dTypeId

  readonly c0: P
  readonly c1: P

  constructor(c0: P, c1: P) {
    super()
    this.c0 = c0
    this.c1 = c1
  }
}

export const isCurve2d = <P extends Polynomial>(c: unknown): c is Curve2d<P> =>
  typeof c === 'object' && c !== null && Curve2dTypeId in c

export const isLinearCurve2d = (
  c: Curve2d<Polynomial>,
): c is Curve2d<LinearPolynomial.LinearPolynomial> =>
  LinearPolynomial.isLinearPolynomial(c.c0) &&
  LinearPolynomial.isLinearPolynomial(c.c1)

export const isQuadraticCurve2d = (
  c: Curve2d<Polynomial>,
): c is Curve2d<QuadraticPolynomial.QuadraticPolynomial> =>
  QuadraticPolynomial.isQuadraticPolynomial(c.c0) &&
  QuadraticPolynomial.isQuadraticPolynomial(c.c1)

export const isCubicCurve2d = (
  c: Curve2d<Polynomial>,
): c is Curve2d<CubicPolynomial.CubicPolynomial> =>
  CubicPolynomial.isCubicPolynomial(c.c0) &&
  CubicPolynomial.isCubicPolynomial(c.c1)

export const make = <P extends Polynomial>(c0: P, c1: NoInfer<P>): Curve2d<P> =>
  new Curve2dInternal(c0, c1)

export const solve = dual<
  <P extends Polynomial>(
    t: number,
  ) => <C extends Curve2d<P>>(c: C) => Vector2.Vector2,
  <P extends Polynomial>(c: Curve2d<P>, t: number) => Vector2.Vector2
>(2, <P extends Polynomial>(c: Curve2d<P>, t: number) => {
  if (isLinearCurve2d(c)) {
    return Vector2.make(
      LinearPolynomial.solve(c.c0, t),
      LinearPolynomial.solve(c.c1, t),
    )
  }

  if (isQuadraticCurve2d(c)) {
    return Vector2.make(
      QuadraticPolynomial.solve(c.c0, t),
      QuadraticPolynomial.solve(c.c1, t),
    )
  }

  return Vector2.make(
    CubicPolynomial.solve(c.c0 as CubicPolynomial.CubicPolynomial, t),
    CubicPolynomial.solve(c.c1 as CubicPolynomial.CubicPolynomial, t),
  )
})
