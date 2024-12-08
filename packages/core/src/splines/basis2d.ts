import type { Pipeable } from '../internal/pipeable'
import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Vector2 } from '../vector/vector2'
import type { Basis2dTypeId } from './basis2d.internal'
import * as internal from './basis2d.internal'

export const characteristic: Matrix4x4 = internal.characteristic

export interface Basis2d extends Pipeable {
  readonly [Basis2dTypeId]: Basis2dTypeId
  [Symbol.iterator](): Iterator<Vector2>
}

export const isBasis2d: (p: unknown) => p is Basis2d = internal.isBasis2d

export const make: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => Basis2d = internal.make

export const fromArray: (points: ReadonlyArray<Vector2>) => Basis2d =
  internal.fromArray

export const append: {
  (...points: ReadonlyArray<Vector2>): (p: Basis2d) => Basis2d
  (p: Basis2d, ...points: ReadonlyArray<Vector2>): Basis2d
} = internal.append

export const prepend: {
  (...points: ReadonlyArray<Vector2>): (p: Basis2d) => Basis2d
  (p: Basis2d, ...points: ReadonlyArray<Vector2>): Basis2d
} = internal.prepend

export const withTriplicatedEndpoints: (p: Basis2d) => Basis2d =
  internal.withTriplicatedEndpoints

export const toPath: (p: Basis2d) => CubicPath2d = internal.toPath
