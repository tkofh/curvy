import type { Pipeable } from '../internal/pipeable'
import type { Polynomial } from '../polynomial'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { LinearPolynomial } from '../polynomial/linear'
import type { QuadraticPolynomial } from '../polynomial/quadratic'
import type { Vector2 } from '../vector/vector2'
import * as internal from './curve2d.internal'
import type { Curve2dTypeId } from './curve2d.internal'

export interface Curve2d<P extends Polynomial> extends Pipeable {
  readonly [Curve2dTypeId]: Curve2dTypeId

  readonly c0: P
  readonly c1: P
}

export const make: <P extends Polynomial>(c0: P, c1: NoInfer<P>) => Curve2d<P> =
  internal.make

export const isCurve2d: <P extends Polynomial>(c: unknown) => c is Curve2d<P> =
  internal.isCurve2d

export const isLinearCurve2d: (
  c: Curve2d<Polynomial>,
) => c is Curve2d<LinearPolynomial> = internal.isLinearCurve2d

export const isQuadraticCurve2d: (
  c: Curve2d<Polynomial>,
) => c is Curve2d<QuadraticPolynomial> = internal.isQuadraticCurve2d

export const isCubicCurve2d: (
  c: Curve2d<Polynomial>,
) => c is Curve2d<CubicPolynomial> = internal.isCubicCurve2d

export const solve: {
  <P extends Polynomial>(t: number): <C extends Curve2d<P>>(c: C) => Vector2
  <P extends Polynomial>(c: Curve2d<P>, t: number): Vector2
} = internal.solve
