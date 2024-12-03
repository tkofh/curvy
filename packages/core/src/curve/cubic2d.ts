import type { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { Vector2 } from '../vector/vector2'
import type { CubicCurve2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

export interface CubicCurve2d extends Pipeable {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId

  readonly c0: CubicPolynomial
  readonly c1: CubicPolynomial
}

export const fromPolynomials: (
  c0: CubicPolynomial,
  c1: CubicPolynomial,
) => CubicCurve2d = internal.fromPolynomials

export const isCubicCurve2d: (c: unknown) => c is CubicCurve2d =
  internal.isCubicCurve2d

export const solve: {
  (t: number): (c: CubicCurve2d) => Vector2
  (c: CubicCurve2d, t: number): Vector2
} = internal.solve

export const length: {
  (c: CubicCurve2d, i: Interval): number
  (i: Interval): (c: CubicCurve2d) => number
} = internal.length
