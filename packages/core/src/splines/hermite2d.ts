import type { Pipeable } from '../internal/pipeable'
import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Vector2 } from '../vector/vector2'
import { Hermite2dTypeId } from './hermite2d.internal'
import * as internal from './hermite2d.internal'

export interface Hermite2d extends Pipeable {
  readonly [Hermite2dTypeId]: Hermite2dTypeId

  [Symbol.iterator](): IterableIterator<Vector2>
}

export const characteristic: Matrix4x4 = internal.characteristic

export const make: (
  p0: Vector2,
  v0: Vector2,
  p1: Vector2,
  v1: Vector2,
) => Hermite2d = internal.make

export const fromArray: (points: ReadonlyArray<Vector2>) => Hermite2d =
  internal.fromArray

export const isHermite2d: (p: unknown) => p is Hermite2d = internal.isHermite2d

export const append: {
  (p1: Vector2, v1: Vector2): (p: Hermite2d) => Hermite2d
  (p: Hermite2d, p1: Vector2, v1: Vector2): Hermite2d
} = internal.append

export const toPath: (p: Hermite2d) => CubicPath2d = internal.toPath
