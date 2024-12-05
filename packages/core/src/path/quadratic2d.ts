import type { QuadraticCurve2d } from '../curve/quadratic2d'
import type { Pipeable } from '../internal/pipeable'
import type { Vector2 } from '../vector/vector2'
import type { QuadraticPath2dTypeId } from './quadratic2d.internal'
import * as internal from './quadratic2d.internal'

export interface QuadraticPath2d extends Pipeable, Iterable<QuadraticCurve2d> {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId
}

export const fromCurves: (
  ...curves: ReadonlyArray<QuadraticCurve2d>
) => QuadraticPath2d = internal.fromCurves

export const fromCurveArray: (
  curves: ReadonlyArray<QuadraticCurve2d>,
) => QuadraticPath2d = internal.fromCurveArray

export const isQuadraticPath2d: (p: unknown) => p is QuadraticPath2d =
  internal.isQuadraticPath2d

export const append: {
  (c: QuadraticCurve2d): (p: QuadraticPath2d) => QuadraticPath2d
  (p: QuadraticPath2d, c: QuadraticCurve2d): QuadraticPath2d
} = internal.append

export const length: (p: QuadraticPath2d) => number = internal.length

export const solve: {
  (u: number): (p: QuadraticPath2d) => Vector2
  (p: QuadraticPath2d, u: number): Vector2
} = internal.solve
