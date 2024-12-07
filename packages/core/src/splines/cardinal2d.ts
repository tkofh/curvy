import type { Pipeable } from '../internal/pipeable'
import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Vector2 } from '../vector/vector2'
import type { Cardinal2dTypeId } from './cardinal2d.internal'
import * as internal from './cardinal2d.internal'

export interface Cardinal2d extends Pipeable {
  readonly [Cardinal2dTypeId]: Cardinal2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

export const characteristic: (scale: number) => Matrix4x4 =
  internal.characteristic

export const catRomCharacteristic: Matrix4x4 = internal.catRomCharacteristic

export const isCardinal2d: (p: unknown) => p is Cardinal2d =
  internal.isCardinal2d

export const make: (
  p0: Vector2,
  p1: Vector2,
  ...points: ReadonlyArray<Vector2>
) => Cardinal2d = internal.make

export const fromArray: (points: ReadonlyArray<Vector2>) => Cardinal2d =
  internal.fromArray

export const append: {
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.append

export const prepend: {
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.prepend

export const withDuplicatedEndpoints: (c: Cardinal2d) => Cardinal2d =
  internal.withDuplicatedEndpoints

export const withReflectedEndpoints: {
  (scale: number): (c: Cardinal2d) => Cardinal2d
  (c: Cardinal2d, scale?: number): Cardinal2d
} = internal.withReflectedEndpoints

export const toPath: {
  (scale: number): (c: Cardinal2d) => CubicPath2d
  (c: Cardinal2d, scale?: number): CubicPath2d
} = internal.toPath
