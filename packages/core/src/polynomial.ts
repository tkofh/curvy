import type { CubicPolynomial } from './polynomial/cubic'
import type { LinearPolynomial } from './polynomial/linear'
import type { QuadraticPolynomial } from './polynomial/quadratic'

export type Polynomial =
  | LinearPolynomial
  | QuadraticPolynomial
  | CubicPolynomial
