import { Pipeable } from '../pipe'
import type { QuadraticPolynomial } from './quadratic'
import { PolynomialTraits } from './traits'

export const QuadraticPolynomialTypeId: unique symbol = Symbol.for('curvy/polynomial/quadratic')
export type QuadraticPolynomialTypeId = typeof QuadraticPolynomialTypeId

export class QuadraticPolynomialImpl extends Pipeable implements QuadraticPolynomial<unknown> {
  readonly [QuadraticPolynomialTypeId]: QuadraticPolynomialTypeId = QuadraticPolynomialTypeId
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
}
