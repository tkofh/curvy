import type { Matrix2x2 } from '../matrix/matrix2x2.ts'
import type { Matrix3x3 } from '../matrix/matrix3x3.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { Affine2dTypeId } from './affine2d.internal.ts'
import * as internal from './affine2d.internal.ts'

/**
 * A 2D affine transformation — the most general map of the form
 *
 * ```
 * x' = a · x + b · y + tx
 * y' = c · x + d · y + ty
 * ```
 *
 * Represented internally as a 3×3 matrix in homogeneous form (the third row is
 * always `[0, 0, 1]`), so that composition is matrix multiplication and a
 * single instance can describe any chain of translates, scales, rotations,
 * reflections, and shears.
 *
 * Affine maps commute with polynomial evaluation: transforming a spline's
 * control points and then sampling produces the same point as sampling first
 * and then transforming. Concrete spline modules expose `transform(s, a)`
 * helpers that take advantage of this.
 *
 * @since 2.0.0
 */
export interface Affine2d extends Pipeable {
  readonly [Affine2dTypeId]: Affine2dTypeId
  /**
   * The underlying 3×3 homogeneous matrix. Last row is always `[0, 0, 1]`.
   */
  readonly matrix: Matrix3x3
}

/**
 * Checks if a value is an `Affine2d`.
 *
 * @param a - The value to check.
 * @returns `true` if the value is an `Affine2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isAffine2d: (a: unknown) => a is Affine2d = internal.isAffine2d

/**
 * Lifts a `Matrix3x3` into an `Affine2d` after asserting its last row is
 * `[0, 0, 1]`. Use this when constructing affine transforms from an already-
 * built matrix; prefer the named constructors below for ordinary usage.
 *
 * @param matrix - The matrix to lift. Must have a last row of `[0, 0, 1]`.
 * @returns A new `Affine2d` wrapping the matrix.
 * @throws If the matrix's last row is not `[0, 0, 1]` within tolerance.
 * @since 2.0.0
 */
export const fromMatrix: (matrix: Matrix3x3) => Affine2d = internal.fromMatrix

/**
 * The identity transform — leaves every point fixed.
 *
 * @since 2.0.0
 */
export const identity: Affine2d = internal.identity

/**
 * Creates an `Affine2d` that translates by `(tx, ty)`.
 *
 * @param tx - The x translation.
 * @param ty - The y translation.
 * @returns A new translating `Affine2d`.
 * @since 2.0.0
 */
export const translate: (tx: number, ty: number) => Affine2d = internal.translate

/**
 * Creates an `Affine2d` that translates by the components of a `Vector2`.
 *
 * @param v - The vector whose components define the translation.
 * @returns A new translating `Affine2d`.
 * @since 2.0.0
 */
export const translateBy: (v: Vector2) => Affine2d = internal.translateBy

export const scale: {
  /**
   * Creates an `Affine2d` that scales uniformly by `xy` on both axes,
   * centered on the origin.
   *
   * @param xy - The uniform scale factor.
   * @returns A new scaling `Affine2d`.
   * @since 2.0.0
   */
  (xy: number): Affine2d
  /**
   * Creates an `Affine2d` that scales by `sx` on the x axis and `sy` on the
   * y axis, centered on the origin.
   *
   * @param sx - The x scale factor.
   * @param sy - The y scale factor.
   * @returns A new scaling `Affine2d`.
   * @since 2.0.0
   */
  (sx: number, sy: number): Affine2d
} = internal.scale

/**
 * Creates an `Affine2d` that scales by `(sx, sy)` about `origin`. Points at
 * `origin` are left fixed; every other point moves toward or away from
 * `origin` along the corresponding axis.
 *
 * @param sx - The x scale factor.
 * @param sy - The y scale factor.
 * @param origin - The fixed point of the scaling.
 * @returns A new scaling `Affine2d`.
 * @since 2.0.0
 */
export const scaleAround: (sx: number, sy: number, origin: Vector2) => Affine2d =
  internal.scaleAround

/**
 * Creates an `Affine2d` that rotates by `theta` radians around the origin.
 * Counter-clockwise in the standard mathematical orientation (with y up); if
 * your coordinate system has y down, rotation is clockwise.
 *
 * @param theta - The rotation angle in radians.
 * @returns A new rotating `Affine2d`.
 * @since 2.0.0
 */
export const rotate: (theta: number) => Affine2d = internal.rotate

/**
 * Creates an `Affine2d` that rotates by `theta` radians around `origin`.
 *
 * @param theta - The rotation angle in radians.
 * @param origin - The fixed point of the rotation.
 * @returns A new rotating `Affine2d`.
 * @since 2.0.0
 */
export const rotateAround: (theta: number, origin: Vector2) => Affine2d = internal.rotateAround

/**
 * Reflects points across the x axis: `(x, y) → (x, -y)`.
 *
 * @since 2.0.0
 */
export const reflectX: Affine2d = internal.reflectX

/**
 * Reflects points across the y axis: `(x, y) → (-x, y)`.
 *
 * @since 2.0.0
 */
export const reflectY: Affine2d = internal.reflectY

/**
 * Creates an `Affine2d` that reflects across the line passing through
 * `origin` in the direction `direction`. `direction` need not be unit length;
 * it is normalized internally.
 *
 * @param origin - A point on the mirror line.
 * @param direction - A non-zero vector parallel to the mirror line.
 * @returns A new reflecting `Affine2d`.
 * @throws If `direction` is the zero vector.
 * @since 2.0.0
 */
export const reflectAcrossLine: (origin: Vector2, direction: Vector2) => Affine2d =
  internal.reflectAcrossLine

/**
 * Creates an `Affine2d` shear with `kx` horizontal shear (x gains `kx · y`)
 * and `ky` vertical shear (y gains `ky · x`).
 *
 * @param kx - The horizontal shear factor.
 * @param ky - The vertical shear factor.
 * @returns A new shearing `Affine2d`.
 * @since 2.0.0
 */
export const shear: (kx: number, ky: number) => Affine2d = internal.shear

export const andThen: {
  /**
   * Sequences two `Affine2d` transforms, applying `a` first and then `b`.
   * Designed for pipe chains:
   *
   * ```ts
   * import * as Affine2d from 'curvy/transform'
   *
   * const t = Affine2d.identity.pipe(
   *   Affine2d.andThen(Affine2d.translate(1, 0)),
   *   Affine2d.andThen(Affine2d.rotate(Math.PI / 2)),
   * )
   * // applying t = translate first, then rotate
   * ```
   *
   * In matrix terms this returns `b · a`, the matrix that yields the same
   * result as applying `a` then `b` to a column-vector point.
   *
   * @param a - The transform applied first.
   * @param b - The transform applied second.
   * @returns A new combined `Affine2d`.
   * @since 2.0.0
   */
  (a: Affine2d, b: Affine2d): Affine2d
  /**
   * Pipe-friendly form of {@link andThen}. `andThen(b)(a)` applies `a` then
   * `b`.
   *
   * @param b - The transform applied after the piped-in transform.
   * @returns A function that takes the transform to apply first and returns the sequenced transform.
   * @since 2.0.0
   */
  (b: Affine2d): (a: Affine2d) => Affine2d
} = internal.andThen

/**
 * Inverts an `Affine2d`. Throws if the transform is singular (e.g. a scale
 * with a zero factor).
 *
 * @param a - The transform to invert.
 * @returns The inverse transform.
 * @throws If `a` is singular.
 * @since 2.0.0
 */
export const inverse: (a: Affine2d) => Affine2d = internal.inverse

export const apply: {
  /**
   * Applies an `Affine2d` to a `Vector2`, returning the transformed point.
   *
   * @param a - The transform to apply.
   * @param p - The point to transform.
   * @returns The transformed point.
   * @since 2.0.0
   */
  (a: Affine2d, p: Vector2): Vector2
  /**
   * Applies an `Affine2d` to a `Vector2`.
   *
   * @param p - The point to transform.
   * @returns A function that takes the transform and returns the transformed point.
   * @since 2.0.0
   */
  (p: Vector2): (a: Affine2d) => Vector2
} = internal.apply

/**
 * Returns a `Vector2 → Vector2` function that applies `a` to its argument.
 * Designed as the bridge to per-point mappers like `Bezier2d.mapPoints`:
 *
 * ```ts
 * Bezier2d.mapPoints(spline, Affine2d.applyTo(transform))
 * ```
 *
 * @param a - The transform to lift.
 * @returns A function that applies `a` to a point.
 * @since 2.0.0
 */
export const applyTo: (a: Affine2d) => (p: Vector2) => Vector2 = internal.applyTo

/**
 * Extracts the 2×2 linear part of an `Affine2d` — the upper-left block of
 * its homogeneous matrix, ignoring translation. Maps direction vectors
 * (tangents, differences of points) under the transform.
 *
 * @param a - The transform.
 * @returns The 2×2 linear part.
 * @since 2.0.0
 */
export const linear: (a: Affine2d) => Matrix2x2 = internal.linear

/**
 * Extracts the translation vector of an `Affine2d` — the third column of its
 * homogeneous matrix, ignoring the linear part.
 *
 * @param a - The transform.
 * @returns The translation vector.
 * @since 2.0.0
 */
export const translation: (a: Affine2d) => Vector2 = internal.translation

/**
 * Returns the `Affine2d` corresponding to `a`'s linear part with translation
 * zeroed. Equivalent to building an affine from {@link linear} but stays in
 * the `Affine2d` type so it can be applied via {@link apply} or {@link applyTo}.
 *
 * Use this to transform anything that is *not* a position — tangent vectors
 * in Hermite control data, or the higher-degree coefficients of a polynomial
 * curve, both of which see only the linear part of an affine map.
 *
 * @param a - The transform.
 * @returns The translation-free `Affine2d`.
 * @since 2.0.0
 */
export const linearPart: (a: Affine2d) => Affine2d = internal.linearPart

export const equals: {
  /**
   * Checks if two `Affine2d` instances are approximately equal within the
   * default absolute tolerance.
   *
   * @param a - The first transform.
   * @param b - The second transform.
   * @returns `true` when each matrix entry is within tolerance.
   * @since 2.0.0
   */
  (a: Affine2d, b: Affine2d): boolean
  /**
   * Checks if two `Affine2d` instances are approximately equal.
   *
   * @param b - The second transform.
   * @returns A function that takes the first transform and returns the comparison.
   * @since 2.0.0
   */
  (b: Affine2d): (a: Affine2d) => boolean
} = internal.equals
