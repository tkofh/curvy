import type { QuadraticPolynomial } from '../quadratic.ts'
import { PolynomialTraits } from './traits.ts'
import { Value } from '../../utils/value.ts'

export const QuadraticPolynomialTypeId = '~curvy/QuadraticPolynomial'

/** @internal */
export class QuadraticPolynomialImpl
  extends Value(QuadraticPolynomialTypeId)
  implements QuadraticPolynomial<unknown>
{
  declare readonly [PolynomialTraits]: unknown

  readonly c0: number
  readonly c1: number
  readonly c2: number

  constructor(c0 = 0, c1 = 0, c2 = 0) {
    super()

    this.c0 = c0
    this.c1 = c1
    this.c2 = c2
  }

  toString() {
    return `QuadraticPolynomial(${this.c0}, ${this.c1}, ${this.c2})`
  }
}
