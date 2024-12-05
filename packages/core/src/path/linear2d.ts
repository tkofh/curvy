import type { LinearCurve2d } from '../curve/linear2d'
import type { Pipeable } from '../internal/pipeable'
import type { Vector2 } from '../vector/vector2'
import type { LinearPath2dTypeId } from './linear2d.internal'
import * as internal from './linear2d.internal'

export interface LinearPath2d extends Pipeable, Iterable<LinearCurve2d> {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId
}

export const fromCurves: (
  ...curves: ReadonlyArray<LinearCurve2d>
) => LinearPath2d = internal.fromCurves

export const fromCurveArray: (
  curves: ReadonlyArray<LinearCurve2d>,
) => LinearPath2d = internal.fromCurveArray

export const isLinearPath2d: (p: unknown) => p is LinearPath2d =
  internal.isLinearPath2d

export const append: {
  (c: LinearCurve2d): (p: LinearPath2d) => LinearPath2d
  (p: LinearPath2d, c: LinearCurve2d): LinearPath2d
} = internal.append

export const length: (p: LinearPath2d) => number = internal.length

export const solve: {
  (u: number): (p: LinearPath2d) => Vector2
  (p: LinearPath2d, u: number): Vector2
} = internal.solve
