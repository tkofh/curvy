import type { Pipeable } from '../internal/pipeable'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { LinearPolynomial } from '../polynomial/linear'
import type { QuadraticPolynomial } from '../polynomial/quadratic'

export interface Curve2d<
  C extends LinearPolynomial | QuadraticPolynomial | CubicPolynomial,
> extends Pipeable {
  readonly c0: C
  readonly c1: C
}
