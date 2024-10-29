import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { QuadraticPolynomial } from './quadratic'

export const QuadraticPolynomialSymbolKey = 'curvy/polynomial/quadratic'

export const QuadraticPolynomialTypeId: unique symbol = Symbol.for(
  QuadraticPolynomialSymbolKey,
)
export type QuadraticPolynomialTypeId = typeof QuadraticPolynomialTypeId

export class QuadraticPolynomialImpl
  extends Pipeable
  implements QuadraticPolynomial
{
  readonly [QuadraticPolynomialTypeId]: QuadraticPolynomialTypeId =
    QuadraticPolynomialTypeId

  readonly c0: number
  readonly c1: number
  readonly c2: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, c2 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)
    this.c2 = round(c2, precision)

    this.precision = precision
  }
}
