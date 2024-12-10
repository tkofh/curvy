import type { TwoDimensional } from '../dimensions'
import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { LinearPolynomial } from '../polynomial/linear'
import type { Vector2 } from '../vector/vector2'
import type { LinearCurve2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

export interface LinearCurve2d
  extends Pipeable,
    TwoDimensional<LinearPolynomial> {
  readonly [LinearCurve2dTypeId]: LinearCurve2dTypeId
}

export const fromPolynomials: (
  x: LinearPolynomial,
  y: LinearPolynomial,
) => LinearCurve2d = internal.fromPolynomials

export const fromPoints: (p0: Vector2, p1: Vector2) => LinearCurve2d =
  internal.fromPoints

export const isLinearCurve2d: (c: unknown) => c is LinearCurve2d =
  internal.isLinearCurve2d

export const derivative: (c: LinearCurve2d) => Vector2 = internal.derivative

export const solve: {
  (t: number): (c: LinearCurve2d) => Vector2
  (c: LinearCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  (c: LinearCurve2d, i: Interval): number
  (i: Interval): (c: LinearCurve2d) => number
} = internal.length
