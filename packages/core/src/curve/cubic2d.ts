import type { TwoDimensional } from '../dimensions'
import type { Interval } from '../interval'
import type { Pipeable } from '../pipe'
import type { CubicPolynomial } from '../polynomial/cubic'
import type { Vector2 } from '../vector/vector2'
import type { CubicCurve2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

export interface CubicCurve2d
  extends Pipeable,
    TwoDimensional<CubicPolynomial> {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId
}

export const fromPolynomials: (
  x: CubicPolynomial,
  y: CubicPolynomial,
) => CubicCurve2d = internal.fromPolynomials

export const fromPoints: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => CubicCurve2d = internal.fromPoints

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

export const curvature: {
  (c: CubicCurve2d, t: number): number
  (t: number): (c: CubicCurve2d) => number
} = internal.curvature
