import { Pipeable } from '../pipe'
import type { CubicPolynomial } from './cubic'

export const CubicPolynomialTypeId: unique symbol = Symbol.for('curvy/polynomial/cubic')
export type CubicPolynomialTypeId = typeof CubicPolynomialTypeId

export class CubicPolynomialImpl extends Pipeable implements CubicPolynomial {
  readonly [CubicPolynomialTypeId]: CubicPolynomialTypeId = CubicPolynomialTypeId

  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly c3: number

  constructor(c0 = 0, c1 = 0, c2 = 0, c3 = 0) {
    super()

    this.c0 = c0
    this.c1 = c1
    this.c2 = c2
    this.c3 = c3
  }
}
