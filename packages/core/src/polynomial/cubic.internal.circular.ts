import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { CubicPolynomial } from './cubic'

export const CubicPolynomialSymbolKey = 'curvy/polynomial/cubic'

export const CubicPolynomialTypeId: unique symbol = Symbol.for(
  CubicPolynomialSymbolKey,
)
type CubicPolynomialTypeId = typeof CubicPolynomialTypeId

export class CubicPolynomialImpl extends Pipeable implements CubicPolynomial {
  readonly [CubicPolynomialTypeId]: CubicPolynomialTypeId =
    CubicPolynomialTypeId

  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly c3: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, c2 = 0, c3 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)
    this.c2 = round(c2, precision)
    this.c3 = round(c3, precision)

    this.precision = precision
  }
}
