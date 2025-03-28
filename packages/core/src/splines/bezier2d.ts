import type { Matrix4x4 } from '../matrix/matrix4x4'
import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../pipe'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2dTypeId } from './bezier2d.internal'
import * as internal from './bezier2d.internal'

export interface Bezier2d extends Pipeable {
  readonly [Bezier2dTypeId]: Bezier2dTypeId
  [Symbol.iterator](): IterableIterator<Vector2>
}

export const characteristic: Matrix4x4 = internal.characteristic

export const make: (
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
) => Bezier2d = internal.make

export const fromArray: (points: ReadonlyArray<Vector2>) => Bezier2d =
  internal.fromArray

export const fromSpline: (
  points: Iterable<Vector2>,
  matrix: Matrix4x4,
  stride: 1 | 2 | 3,
) => Bezier2d = internal.fromSpline

export const isCubicBezier2d: (p: unknown) => p is Bezier2d =
  internal.isCubicBezier2d

export const append: {
  (p1: Vector2, p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  (p: Bezier2d, p1: Vector2, p2: Vector2, p3: Vector2): Bezier2d
} = internal.append

export const appendTangentAligned: {
  (ratio: number, p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  (p: Bezier2d, ratio: number, p2: Vector2, p3: Vector2): Bezier2d
} = internal.appendTangentAligned

export const appendCurvatureMirrored: {
  (a: number, b: number, p6: Vector2): (p: Bezier2d) => Bezier2d
  (p: Bezier2d, a: number, b: number, p6: Vector2): Bezier2d
} = internal.appendCurvatureAligned

export const appendVelocityAligned: {
  (p2: Vector2, p3: Vector2): (p: Bezier2d) => Bezier2d
  (p: Bezier2d, p2: Vector2, p3: Vector2): Bezier2d
} = internal.appendVelocityAligned

export const appendAccelerationAligned: {
  (p3: Vector2): (p: Bezier2d) => Bezier2d
  (p: Bezier2d, p3: Vector2): Bezier2d
} = internal.appendAccelerationAligned

export const toPath: (p: Bezier2d) => CubicPath2d = internal.toPath
