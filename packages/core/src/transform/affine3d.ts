import type { Matrix3x3 } from '../matrix/matrix3x3.ts'
import type { Matrix4x4 } from '../matrix/matrix4x4.ts'
import type { Quaternion, Unit } from '../quaternion/quaternion.ts'
import type * as Solution from '../solution/solution.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/affine3d.ts'
import type { AffineTraits, Invertible } from './internal/traits.ts'
import type { Rotation3d } from './rotation3d.ts'

export type { Invertible } from './internal/traits.ts'

/**
 * A 3D affine transformation: the most general map of the form
 *
 * ```
 * x' = a * x + b * y + c * z + tx
 * y' = d * x + e * y + f * z + ty
 * z' = g * x + h * y + i * z + tz
 * ```
 *
 * Represented as a 4x4 matrix in homogeneous form, whose fourth row is
 * always `[0, 0, 0, 1]`. Composition is matrix multiplication, so one
 * instance can describe any chain of translations, rotations, scales, and
 * shears.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the transform is refined via `isInvertible` / `asInvertible`.
 * The runtime value carries no trait data.
 *
 * @since 2.0.0
 */
export interface Affine3d<out Traits = unknown> extends Value.Instance {
  readonly '~curvy/Affine3d': '~curvy/Affine3d'
  readonly [AffineTraits]: Traits
  /**
   * The underlying 4x4 homogeneous matrix, acting on column vectors. The
   * last row is always `[0, 0, 0, 1]`.
   */
  readonly matrix: Matrix4x4
}

/**
 * The shear coefficients of a 3D transform. Each says how much one
 * coordinate adds into another: `xy` is how much of `y` adds into `x`.
 *
 * As a matrix, the shear is `[[1, xy, xz], [yx, 1, yz], [zx, zy, 1]]`.
 *
 * @since 2.0.0
 */
export interface Shear {
  /** How much of `y` adds into `x`: `x' = x + xy * y`. */
  readonly xy: number
  /** How much of `z` adds into `x`: `x' = x + xz * z`. */
  readonly xz: number
  /** How much of `x` adds into `y`: `y' = y + yx * x`. */
  readonly yx: number
  /** How much of `z` adds into `y`: `y' = y + yz * z`. */
  readonly yz: number
  /** How much of `x` adds into `z`: `z' = z + zx * x`. */
  readonly zx: number
  /** How much of `y` adds into `z`: `z' = z + zy * y`. */
  readonly zy: number
}

/**
 * The parts of a transform, as `decompose` returns them. `compose` builds
 * the transform back: scale first, then shear, then rotation, then
 * translation.
 *
 * @since 2.0.0
 */
export interface Decomposition {
  /** Where the origin moves. */
  readonly translation: Vector3
  /** The rotation applied after the scale and shear. */
  readonly rotation: Rotation3d
  /**
   * The scale along each axis, applied first. `decompose` returns a
   * negative `x` scale for a transform that mirrors, and positive scales
   * otherwise.
   */
  readonly scale: Vector3
  /**
   * The shear applied after the scale. `decompose` always returns `yx`,
   * `zx`, and `zy` as `0`, and puts all the shear in `xy`, `xz`, and `yz`.
   */
  readonly shear: Shear
}

/**
 * The parts `compose` assembles into a transform. Every part is optional,
 * and a missing part leaves that stage out.
 *
 * @since 2.0.0
 */
export interface ComposeConfig {
  /** Where the origin moves. Defaults to no translation. */
  readonly translation?: Vector3
  /**
   * The rotation, as a `Rotation3d` or a `Quaternion<Unit>`. Defaults to
   * no rotation.
   */
  readonly rotation?: Rotation3d | Quaternion<Unit>
  /**
   * The scale along each axis, or one number for all three. Defaults to
   * `1`.
   */
  readonly scale?: Vector3 | number
  /** The shear coefficients. A missing coefficient is `0`. */
  readonly shear?: Partial<Shear>
}

/**
 * Checks if a value is an `Affine3d`.
 *
 * @param a - The value to check.
 * @returns `true` if the value is an `Affine3d`, `false` otherwise.
 * @since 2.0.0
 */
export const isAffine3d: (a: unknown) => a is Affine3d = internal.isAffine3d

/**
 * Lifts a `Matrix4x4` into an `Affine3d` after checking that its last row
 * is `[0, 0, 0, 1]`. Prefer the named constructors for ordinary use.
 *
 * @param matrix - The matrix to lift, acting on column vectors.
 * @returns A new `Affine3d` wrapping the matrix.
 * @throws `Error` when the last row is not `[0, 0, 0, 1]` within a
 *   tolerance scaled by the magnitude of the matrix's other entries. See
 *   `PRECISION.md`.
 * @since 2.0.0
 */
export const fromMatrix: (matrix: Matrix4x4) => Affine3d = internal.fromMatrix

/**
 * The identity transform, which leaves every point fixed.
 *
 * @since 2.0.0
 */
export const identity: Affine3d = internal.identity

export const translate: {
  /**
   * Creates an `Affine3d` that translates by `(tx, ty, tz)`.
   *
   * @param tx - The x translation.
   * @param ty - The y translation.
   * @param tz - The z translation.
   * @returns A new translating `Affine3d`.
   * @since 2.0.0
   */
  (tx: number, ty: number, tz: number): Affine3d
  /**
   * Creates an `Affine3d` that translates by a vector.
   *
   * @param v - The translation, as an offset added to every point.
   * @returns A new translating `Affine3d`.
   * @since 2.0.0
   */
  (v: Vector3): Affine3d
} = internal.translate

export const scale: {
  /**
   * Creates an `Affine3d` that scales uniformly by `s` on every axis.
   *
   * @param s - The uniform scale factor.
   * @param origin - The point that stays fixed. Every other point moves
   *   toward or away from it. Defaults to `Vector3.zero`.
   * @returns A new scaling `Affine3d`.
   * @since 2.0.0
   */
  (s: number, origin?: Vector3): Affine3d
  /**
   * Creates an `Affine3d` that scales by `sx`, `sy`, and `sz` along the
   * x, y, and z axes.
   *
   * @param sx - The x scale factor.
   * @param sy - The y scale factor.
   * @param sz - The z scale factor.
   * @param origin - The point that stays fixed. Every other point moves
   *   toward or away from it along each axis. Defaults to `Vector3.zero`.
   * @returns A new scaling `Affine3d`.
   * @since 2.0.0
   */
  (sx: number, sy: number, sz: number, origin?: Vector3): Affine3d
  /**
   * Creates an `Affine3d` that scales by each component of a vector along
   * its axis.
   *
   * @param factors - The x, y, and z scale factors, as the vector's
   *   components.
   * @param origin - The point that stays fixed. Defaults to `Vector3.zero`.
   * @returns A new scaling `Affine3d`.
   * @since 2.0.0
   */
  (factors: Vector3, origin?: Vector3): Affine3d
} = internal.scale

/**
 * Creates an `Affine3d` that rotates about an axis through a point.
 *
 * @param r - The rotation, as a `Rotation3d` or a `Quaternion<Unit>`. Its
 *   axis direction carries over to the line through `origin`.
 * @param origin - The point that stays fixed. Defaults to `Vector3.zero`.
 * @returns A new rotating `Affine3d`.
 * @example
 * ```ts
 * // Spin a part about its own center rather than the world origin.
 * const center = Vector3.make(5, 0, 0)
 * const spin = Affine3d.rotate(Rotation3d.aboutZ(Math.PI / 2), center)
 *
 * Affine3d.apply(spin, center) // Vector3(5, 0, 0)
 * Affine3d.apply(spin, Vector3.make(6, 0, 0)) // Vector3(5, 1, 0), up to rounding
 * ```
 * @since 2.0.0
 */
export const rotate: (r: Rotation3d | Quaternion<Unit>, origin?: Vector3) => Affine3d =
  internal.rotate

/**
 * Creates an `Affine3d` that shears. Each coefficient adds a multiple of one
 * coordinate into another, as `Shear` describes.
 *
 * @param s - The shear coefficients. A missing coefficient is `0`.
 * @param origin - The point that stays fixed. The coordinates that feed
 *   each coefficient are measured from it. Defaults to `Vector3.zero`.
 * @returns A new shearing `Affine3d`.
 * @since 2.0.0
 */
export const shear: (s: Partial<Shear>, origin?: Vector3) => Affine3d = internal.shear

/**
 * Builds a transform from its parts, applied in the order scale, shear,
 * rotation, translation. As a matrix, the linear part is
 * `rotation * shear * scale`.
 *
 * `compose` undoes `decompose`, so a transform survives a round trip
 * through its parts to within rounding.
 *
 * @param config - The parts. A missing part leaves its stage out.
 * @returns The composed transform.
 * @example
 * ```ts
 * // A joint: scaled, turned, and placed at the end of its parent bone.
 * const joint = Affine3d.compose({
 *   translation: Vector3.make(0, 2, 0),
 *   rotation: Rotation3d.aboutX(0.3),
 *   scale: 0.5,
 * })
 * ```
 * @since 2.0.0
 */
export const compose: (config: ComposeConfig) => Affine3d = internal.compose

export const decompose: {
  /**
   * Splits an invertible transform into translation, rotation, shear, and
   * scale. The brand guarantees the split exists, so the result is always
   * a single decomposition.
   *
   * @param a - The transform to split.
   * @returns The parts, wrapped in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Invertible>(a: Affine3d<T>): Solution.One<Decomposition>
  /**
   * Splits a transform into translation, rotation, shear, and scale, so
   * that `compose` builds it back.
   *
   * Every invertible transform has such a split. A transform with no shear
   * in it, such as any chain of rotations, translations, and uniform
   * scales, comes back with every shear coefficient `0` to within
   * rounding. A child rotated inside a parent with a non-uniform scale is
   * the common way shear appears.
   *
   * A transform that mirrors space gets a negative `x` scale, since no
   * rotation can mirror. The split is otherwise unique, with positive
   * scales.
   *
   * @param a - The transform to split.
   * @returns The parts, or `none` when the transform is singular, as
   *   `isInvertible` judges it.
   * @example
   * ```ts
   * const parts = Affine3d.decompose(
   *   Affine3d.compose({ rotation: Rotation3d.aboutY(1), scale: Vector3.make(2, 3, 4) }),
   * )
   *
   * if (Solution.isSome(parts)) {
   *   parts.value.scale // Vector3(2, 3, 4), up to rounding
   *   parts.value.shear.xy // 0, up to rounding
   * }
   * ```
   * @since 2.0.0
   */
  <T>(a: Affine3d<T>): Solution.AtMostOne<Decomposition>
} = internal.decompose as never

export const andThen: {
  /**
   * Sequences two `Affine3d` transforms, applying `a` first and then `b`.
   *
   * In matrix terms this returns `b * a`, the matrix that gives the same
   * result as applying `a` then `b` to a column-vector point.
   *
   * @param a - The transform applied first.
   * @param b - The transform applied second.
   * @returns A new combined `Affine3d`.
   * @since 2.0.0
   */
  (a: Affine3d, b: Affine3d): Affine3d
  /**
   * Sequences two `Affine3d` transforms. `andThen(b)(a)` applies `a`, then
   * `b`.
   *
   * @param b - The transform applied after the piped-in transform.
   * @returns A function that takes the transform to apply first and returns
   *   the sequenced transform.
   * @since 2.0.0
   */
  (b: Affine3d): (a: Affine3d) => Affine3d
} = internal.andThen

// The implementation always runs the same singular check. For
// `Invertible`-branded transforms the empty branch is unreachable, but TS
// can't see that, so the cast pairs the type-level promise with the brand.
export const inverse: {
  /**
   * Inverts an `Invertible`-branded `Affine3d`. The brand guarantees
   * non-singularity, so the result is always a single transform, wrapped
   * in `Solution.One`.
   *
   * @param a - The transform to invert.
   * @returns The inverse, wrapped in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Invertible>(a: Affine3d<T>): Solution.One<Affine3d<T>>
  /**
   * Inverts an `Affine3d`.
   *
   * @param a - The transform to invert.
   * @returns The inverse in `Solution.One`, or `Solution.none` when the
   *   transform is singular, as `isInvertible` judges it.
   * @since 2.0.0
   */
  <T>(a: Affine3d<T>): Solution.AtMostOne<Affine3d<T>>
} = internal.inverse as never

/**
 * Inverts an `Affine3d`, throwing when the transform is singular. Use it
 * where invertibility is already known. Otherwise prefer `inverse`.
 *
 * @param a - The transform to invert.
 * @returns The inverse transform.
 * @throws `Error` when `a` is singular, as `isInvertible` judges it.
 * @since 2.0.0
 */
export const inverseUnsafe: (a: Affine3d) => Affine3d = internal.inverseUnsafe

/**
 * Checks if a transform is invertible.
 *
 * Only the 3x3 linear part decides it, since translation never makes an
 * affine map singular. The test is the scale-free one of
 * `Matrix3x3.isInvertible`: the determinant must exceed
 * `RELATIVE_TOLERANCE` times the product of the row lengths. See
 * `PRECISION.md`.
 *
 * @param a - The transform to check.
 * @returns `true` when `a` is invertible, narrowing to
 *   `Affine3d<T & Invertible>`.
 * @since 2.0.0
 */
export const isInvertible: <T>(a: Affine3d<T>) => a is Affine3d<T & Invertible> =
  internal.isInvertible

/**
 * Asserts that a transform is invertible, under the test `isInvertible`
 * uses.
 *
 * @param a - The transform to assert against.
 * @returns The same transform, typed with the `Invertible` brand.
 * @throws `Error` when `a` is singular.
 * @since 2.0.0
 */
export const asInvertible: <T>(a: Affine3d<T>) => Affine3d<T & Invertible> = internal.asInvertible

export const apply: {
  /**
   * Applies an `Affine3d` to a point.
   *
   * @param a - The transform to apply.
   * @param p - The point to transform.
   * @returns The transformed point.
   * @since 2.0.0
   */
  (a: Affine3d, p: Vector3): Vector3
  /**
   * Applies an `Affine3d` to a point.
   *
   * @param p - The point to transform.
   * @returns A function that takes the transform and returns the transformed point.
   * @since 2.0.0
   */
  (p: Vector3): (a: Affine3d) => Vector3
} = internal.apply

/**
 * Curried point-first form of `apply`: fixes the transform and returns a
 * function over points, the shape `Array.prototype.map` wants.
 *
 * @param a - The transform to lift.
 * @returns A function that applies `a` to a point.
 * @example
 * ```ts
 * const placed = vertices.map(Affine3d.applyTo(joint))
 * ```
 * @since 2.0.0
 */
export const applyTo: (a: Affine3d) => (p: Vector3) => Vector3 = internal.applyTo

export const applyDirection: {
  /**
   * Applies an `Affine3d` to a direction: a tangent, an edge vector, or any
   * difference of two points.
   *
   * Directions ignore translation, so only the linear part acts. Moving
   * both endpoints of an edge with `apply` and subtracting gives the same
   * vector. Surface normals need `applyNormal` instead.
   *
   * @param a - The transform to apply.
   * @param d - The direction to transform.
   * @returns The transformed direction, not normalized.
   * @since 2.0.0
   */
  (a: Affine3d, d: Vector3): Vector3
  /**
   * Applies an `Affine3d` to a direction, ignoring translation.
   *
   * @param d - The direction to transform.
   * @returns A function that takes the transform and returns the transformed direction.
   * @since 2.0.0
   */
  (d: Vector3): (a: Affine3d) => Vector3
} = internal.applyDirection

export const applyNormal: {
  /**
   * Maps a surface normal so that it stays perpendicular to the mapped
   * surface, pointing to the same side.
   *
   * A normal is not a direction under every transform. Under a non-uniform
   * scale or a shear, `applyDirection` would tilt it off perpendicular.
   * Normals map by the inverse transpose of the linear part instead. Under
   * a reflection the normal stays on the side the surface's points move
   * to, so an outward normal stays outward.
   *
   * @param a - The transform to apply.
   * @param n - The normal to transform. Any non-zero length works.
   * @returns The transformed normal, unit length.
   * @throws `Error` when `a` is not invertible.
   * @example
   * ```ts
   * // A 45-degree face, squashed to half height.
   * const squash = Affine3d.scale(1, 0.5, 1)
   * const normal = Vector3.make(1, 1, 0)
   *
   * Affine3d.applyNormal(squash, normal) // Vector3(0.447..., 0.894..., 0): steeper
   * Affine3d.applyDirection(squash, normal) // Vector3(1, 0.5, 0): no longer perpendicular
   * ```
   * @since 2.0.0
   */
  (a: Affine3d, n: Vector3): Vector3
  /**
   * Maps a surface normal so that it stays perpendicular to the mapped
   * surface.
   *
   * @param n - The normal to transform.
   * @returns A function that takes the transform and returns the transformed
   *   unit normal.
   * @throws `Error` when the transform is not invertible.
   * @since 2.0.0
   */
  (n: Vector3): (a: Affine3d) => Vector3
} = internal.applyNormal

/**
 * Extracts the 3x3 linear part of an `Affine3d`: the upper-left block of
 * its homogeneous matrix, without the translation.
 *
 * @param a - The transform.
 * @returns The 3x3 linear part, acting on column vectors.
 * @since 2.0.0
 */
export const linear: (a: Affine3d) => Matrix3x3 = internal.linear

/**
 * Extracts the translation of an `Affine3d`: where it moves the origin.
 *
 * @param a - The transform.
 * @returns The translation vector.
 * @since 2.0.0
 */
export const translation: (a: Affine3d) => Vector3 = internal.translation

/**
 * The same transform with its translation removed, still an `Affine3d`.
 *
 * @param a - The transform.
 * @returns The translation-free `Affine3d`.
 * @since 2.0.0
 */
export const linearPart: (a: Affine3d) => Affine3d = internal.linearPart

export const equals: {
  /**
   * Checks if two `Affine3d` instances are approximately equal, comparing
   * each matrix entry with `coincident` from `curvy/number`. See
   * `PRECISION.md`.
   *
   * @param a - The first transform.
   * @param b - The second transform.
   * @returns `true` when each matrix entry is within tolerance.
   * @since 2.0.0
   */
  (a: Affine3d, b: Affine3d): boolean
  /**
   * Checks if two `Affine3d` instances are approximately equal.
   *
   * @param b - The second transform.
   * @returns A function that takes the first transform and returns the comparison.
   * @since 2.0.0
   */
  (b: Affine3d): (a: Affine3d) => boolean
} = internal.equals
