import { Pipeable } from '../internal/pipeable'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { LinearPolynomial } from '../polynomial/linear'
import type { QuadraticPolynomial } from '../polynomial/quadratic'
import type { Curve2d } from './curve2d'

export const Curve2dTypeId: unique symbol = Symbol.for('curvy/curve/curve2d')
export type Curve2dTypeId = typeof Curve2dTypeId

export class Curve2dInternal<
    C extends LinearPolynomial | QuadraticPolynomial | CubicPolynomial,
  >
  extends Pipeable
  implements Curve2d<C>
{
  readonly [Curve2dTypeId]: Curve2dTypeId = Curve2dTypeId

  readonly c0: C
  readonly c1: C

  constructor(c0: C, c1: C) {
    super()
    this.c0 = c0
    this.c1 = c1
  }
}
