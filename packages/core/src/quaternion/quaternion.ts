import type * as Solution from '../solution/solution.ts'
import type { Value } from '../utils/value.ts'
import * as internal from './internal/quaternion.ts'
import type { QuaternionTraits, Unit } from './internal/traits.ts'

export type { Unit } from './internal/traits.ts'

/**
 * A quaternion `x*i + y*j + z*k + w`, stored as its four components with
 * the scalar part `w` last.
 *
 * Quaternions of length 1 represent 3D rotations, and the `Unit` brand
 * marks them. For rotation work, `Rotation3d` in `curvy/transform` is the
 * concept type. Every `Rotation3d` operation also accepts a
 * `Quaternion<Unit>`, so this module holds only the algebra: products,
 * conjugates, inverses, and normalization. Multiplication follows
 * Hamilton's convention, `i^2 = j^2 = k^2 = i*j*k = -1`. `CONVENTIONS.md`
 * at the repo root describes how that maps to rotations.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands such as `Unit`. The runtime value carries no trait data.
 *
 * @since 2.0.0
 */
export interface Quaternion<out Traits = unknown> extends Value.Instance {
  readonly '~curvy/Quaternion': '~curvy/Quaternion'
  readonly [QuaternionTraits]: Traits
  /** The coefficient of `i`. */
  readonly x: number
  /** The coefficient of `j`. */
  readonly y: number
  /** The coefficient of `k`. */
  readonly z: number
  /** The scalar part. */
  readonly w: number
}

/**
 * Checks if a value is a `Quaternion`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ x, y, z, w }` object is not a `Quaternion`.
 *
 * @param q - The value to check.
 * @returns `true` if the value is a `Quaternion`, `false` otherwise.
 * @since 2.0.0
 */
export const isQuaternion: (q: unknown) => q is Quaternion = internal.isQuaternion

/**
 * Creates a `Quaternion` from its components, scalar part last.
 *
 * The result carries no brand, even when its length is 1. Use `asUnit`,
 * `isUnit`, or `normalize` to get a `Quaternion<Unit>`.
 *
 * @param x - The coefficient of `i`.
 * @param y - The coefficient of `j`.
 * @param z - The coefficient of `k`.
 * @param w - The scalar part.
 * @returns A new `Quaternion`.
 * @since 2.0.0
 */
export const make: (x: number, y: number, z: number, w: number) => Quaternion = internal.make

/**
 * The identity quaternion `(0, 0, 0, 1)`, which represents no rotation.
 *
 * @since 2.0.0
 */
export const identity: Quaternion<Unit> = internal.identity

export const equals: {
  /**
   * Checks whether two quaternions have the same components, comparing each
   * pair with `coincident` from `curvy/number`.
   *
   * `q` and `-q` represent the same rotation but are different
   * quaternions, so they are not equal here. `Rotation3d.equals` compares
   * as rotations.
   *
   * @param a - The first quaternion.
   * @param b - The second quaternion.
   * @returns `true` when every component pair coincides.
   * @since 2.0.0
   */
  (a: Quaternion, b: Quaternion): boolean
  /**
   * Checks whether two quaternions have the same components.
   *
   * @param b - The quaternion to compare against.
   * @returns A function that takes a quaternion and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Quaternion): (a: Quaternion) => boolean
} = internal.equals

export const dot: {
  /**
   * The dot product of two quaternions as 4-vectors:
   * `a.x*b.x + a.y*b.y + a.z*b.z + a.w*b.w`.
   *
   * For unit quaternions it is the cosine of half the angle between the
   * rotations they represent, up to sign.
   *
   * @param a - The first quaternion.
   * @param b - The second quaternion.
   * @returns The dot product.
   * @since 2.0.0
   */
  (a: Quaternion, b: Quaternion): number
  /**
   * The dot product of two quaternions as 4-vectors.
   *
   * @param b - The second quaternion.
   * @returns A function that takes a quaternion and returns its dot product with `b`.
   * @since 2.0.0
   */
  (b: Quaternion): (a: Quaternion) => number
} = internal.dot

/**
 * The length of a quaternion as a 4-vector: `sqrt(x^2 + y^2 + z^2 + w^2)`.
 *
 * @param q - The quaternion.
 * @returns The length.
 * @since 2.0.0
 */
export const magnitude: (q: Quaternion) => number = internal.magnitude

/**
 * The conjugate `(-x, -y, -z, w)`. For a unit quaternion it is also the
 * inverse, the rotation that undoes it.
 *
 * @param q - The quaternion.
 * @returns The conjugate, with the same trait brands as `q`.
 * @since 2.0.0
 */
export const conjugate: <T>(q: Quaternion<T>) => Quaternion<T> = internal.conjugate

export const multiply: {
  /**
   * The Hamilton product `a * b` of two unit quaternions.
   *
   * As rotations, `a * b` applies `b` first and then `a`, the same order as
   * a matrix product acting on column vectors. The product of unit
   * quaternions is unit, so the brand carries through.
   *
   * @param a - The left factor, applied second.
   * @param b - The right factor, applied first.
   * @returns The product, branded `Unit`.
   * @since 2.0.0
   */
  (a: Quaternion<Unit>, b: Quaternion<Unit>): Quaternion<Unit>
  /**
   * The Hamilton product `a * b`.
   *
   * Quaternion multiplication does not commute. `a * b` and `b * a` differ
   * unless the vector parts are parallel.
   *
   * @param a - The left factor.
   * @param b - The right factor.
   * @returns The product.
   * @example
   * ```ts
   * const i = Quaternion.make(1, 0, 0, 0)
   * const j = Quaternion.make(0, 1, 0, 0)
   *
   * Quaternion.multiply(i, j) // Quaternion(0, 0, 1, 0), which is k
   * Quaternion.multiply(j, i) // Quaternion(0, 0, -1, 0), which is -k
   * ```
   * @since 2.0.0
   */
  (a: Quaternion, b: Quaternion): Quaternion
  /**
   * The Hamilton product of two unit quaternions, with the piped-in
   * quaternion on the left.
   *
   * @param b - The right factor.
   * @returns A function that takes the left factor and returns `a * b`.
   * @since 2.0.0
   */
  (b: Quaternion<Unit>): (a: Quaternion<Unit>) => Quaternion<Unit>
  /**
   * The Hamilton product, with the piped-in quaternion on the left.
   *
   * @param b - The right factor.
   * @returns A function that takes the left factor and returns `a * b`.
   * @since 2.0.0
   */
  (b: Quaternion): (a: Quaternion) => Quaternion
} = internal.multiply as never

/**
 * Checks if a quaternion has length 1, narrowing it to
 * `Quaternion<T & Unit>`.
 *
 * The test is `abs(x^2 + y^2 + z^2 + w^2 - 1) <= EPSILON`. Unit length
 * lives on a fixed scale, so the band is absolute. See `PRECISION.md`.
 *
 * @param q - The quaternion to check.
 * @returns `true` when `q` is unit length at working precision.
 * @since 2.0.0
 */
export const isUnit: <T>(q: Quaternion<T>) => q is Quaternion<T & Unit> = internal.isUnit

/**
 * Asserts that a quaternion has length 1, under the test `isUnit` uses.
 *
 * @param q - The quaternion to assert against.
 * @returns The same quaternion, typed with the `Unit` brand.
 * @throws `Error` when `q` is not unit length.
 * @since 2.0.0
 */
export const asUnit: <T>(q: Quaternion<T>) => Quaternion<T & Unit> = internal.asUnit

/**
 * Scales a quaternion to length 1.
 *
 * @param q - The quaternion.
 * @returns The unit quaternion in the same direction, or `none` when `q`
 *   is zero or has a non-finite component.
 * @example
 * ```ts
 * const q = Quaternion.normalize(Quaternion.make(0, 0, 2, 2))
 * // Solution.one(Quaternion(0, 0, 0.7071067811865475, 0.7071067811865475))
 *
 * if (Solution.isSome(q)) {
 *   Rotation3d.toAxisAngle(q.value) // { axis: Vector3(0, 0, 1), angle: pi / 2 }
 * }
 * ```
 * @since 2.0.0
 */
export const normalize: (q: Quaternion) => Solution.AtMostOne<Quaternion<Unit>> = internal.normalize

export const inverse: {
  /**
   * Inverts a unit quaternion. The brand guarantees an inverse exists, so
   * the result is always a single quaternion, wrapped in `Solution.One`.
   *
   * @param q - The quaternion to invert.
   * @returns The inverse `conjugate(q) / (x^2 + y^2 + z^2 + w^2)`, wrapped
   *   in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Unit>(q: Quaternion<T>): Solution.One<Quaternion<T>>
  /**
   * Inverts a quaternion, so that `multiply(q, inverse(q))` is the
   * identity.
   *
   * @param q - The quaternion to invert.
   * @returns The inverse `conjugate(q) / (x^2 + y^2 + z^2 + w^2)`, or
   *   `none` when `q` is zero or has a non-finite component.
   * @since 2.0.0
   */
  <T>(q: Quaternion<T>): Solution.AtMostOne<Quaternion<T>>
} = internal.inverse as never
