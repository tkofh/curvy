import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { LinearPolynomial } from '../polynomial/linear'
import type { Vector2 } from '../vector/vector2'
import type { LinearCurve2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

export interface LinearCurve2d extends Pipeable {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId

  readonly c0: LinearPolynomial
  readonly c1: LinearPolynomial
}

export const fromPolynomials: (
  c0: LinearPolynomial,
  c1: LinearPolynomial,
) => LinearCurve2d = internal.fromPolynomials

export const isLinearCurve2d: (c: unknown) => c is LinearCurve2d =
  internal.isLinearCurve2d

export const solve: {
  (t: number): (c: LinearCurve2d) => Vector2
  (c: LinearCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  (c: LinearCurve2d, i: Interval): number
  (i: Interval): (c: LinearCurve2d) => number
} = internal.length
