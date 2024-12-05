import type { Pipeable } from '../../../internal/pipeable'
import type { CubicPath2d } from '../../../path/cubic2d'
import type { Vector2 } from '../../../vector/vector2'
import type { CubicBezierPoints2dTypeId } from './cubic2d.internal'
import * as internal from './cubic2d.internal'

export interface CubicBezierPoints2d extends Pipeable {
  readonly [CubicBezierPoints2dTypeId]: CubicBezierPoints2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

export const make: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => CubicBezierPoints2d = internal.make

export const fromArray: (
  points: ReadonlyArray<Vector2>,
) => CubicBezierPoints2d = internal.fromArray

export const isCubicBezierPoints2d: (p: unknown) => p is CubicBezierPoints2d =
  internal.isCubicBezierPoints2d

export const append: {
  (
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
  ): (p: CubicBezierPoints2d) => CubicBezierPoints2d
  (
    p: CubicBezierPoints2d,
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
  ): CubicBezierPoints2d
} = internal.append

export const toPath: (p: CubicBezierPoints2d) => CubicPath2d = internal.toPath
