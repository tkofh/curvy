import type { CubicCurve2d } from '../curve/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { CubicPath2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

export interface CubicPath2d extends Pipeable, Iterable<CubicCurve2d> {
  readonly [CubicPath2dTypeId]: CubicPath2dTypeId
}

export const fromCurves: (
  ...curves: ReadonlyArray<CubicCurve2d>
) => CubicPath2d = internal.fromCurves

export const fromCurveArray: (
  curves: ReadonlyArray<CubicCurve2d>,
) => CubicPath2d = internal.fromCurveArray

export const isCubicPath2d: (p: unknown) => p is CubicPath2d =
  internal.isCubicPath2d

export const append: {
  (c: CubicCurve2d): (p: CubicPath2d) => CubicPath2d
  (p: CubicPath2d, c: CubicCurve2d): CubicPath2d
} = internal.append

export const length: (p: CubicPath2d) => number = internal.length

export const solve: {
  (u: number): (p: CubicPath2d) => Vector2
  (p: CubicPath2d, u: number): Vector2
} = internal.solve
