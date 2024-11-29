import { Pipeable } from '../internal/pipeable'
import { round } from '../util'
import type { QuadraticPolynomial } from './quadratic'

export const QuadraticPolynomialTypeId: unique symbol = Symbol.for(
  'curvy/polynomial/quadratic',
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

  constructor(c0 = 0, c1 = 0, c2 = 0) {
    super()

    this.c0 = round(c0)
    this.c1 = round(c1)
    this.c2 = round(c2)
  }
}
