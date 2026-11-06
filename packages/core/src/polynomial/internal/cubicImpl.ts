import type { CubicPolynomial } from '../cubic.ts'
import { PolynomialTraits } from './traits.ts'
import { Value } from '../../utils/value.ts'

export const CubicPolynomialTypeId = '~curvy/CubicPolynomial'

/** @internal */
export class CubicPolynomialImpl
  extends Value(CubicPolynomialTypeId)
  implements CubicPolynomial<unknown>
{
  declare readonly [PolynomialTraits]: unknown

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

  toString() {
    return `CubicPolynomial(${this.c0}, ${this.c1}, ${this.c2}, ${this.c3})`
  }
}
