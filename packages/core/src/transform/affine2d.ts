import type { Matrix2x2 } from '../matrix/matrix2x2.ts'
import type { Matrix3x3 } from '../matrix/matrix3x3.ts'
import type * as Solution from '../solution/solution.ts'
import type { Value } from '../utils/value.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './internal/affine2d.ts'
import type { AffineTraits, Invertible } from './internal/traits.ts'

export type { Invertible } from './internal/traits.ts'

/**
 * A 2D affine transformation: the most general map of the form
 *
 * ```
 * x' = a * x + b * y + tx
 * y' = c * x + d * y + ty
 * ```
 *
 * Represented internally as a 3x3 matrix in homogeneous form (the third row is
 * always `[0, 0, 1]`), so that composition is matrix multiplication and a
 * single instance can describe any chain of translates, scales, rotations,
 * reflections, and shears.
 *
 * Affine maps commute with polynomial evaluation. Transforming a spline's
 * control points and then sampling produces the same point as sampling first
 * and then transforming. Concrete spline modules expose `transform(s, a)`
 * helpers that take advantage of this.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands as the transform is refined via `isInvertible` / `asInvertible`. The
 * runtime value carries no trait data. `Traits` only flows through the type
 * system to enable tighter return types on operations like `inverse`.
 *
 * @since 2.0.0
 */
export interface Affine2d<out Traits = unknown> extends Value.Instance {
  readonly '~curvy/Affine2d': '~curvy/Affine2d'
  readonly [AffineTraits]: Traits
  /**
   * The underlying 3x3 homogeneous matrix. Last row is always `[0, 0, 1]`.
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
 * `[0, 0, 1]`. Use this when constructing affine transforms from an
 * already-built matrix. Prefer the named constructors (`translate`,
 * `scale`, `rotate`, ...) for ordinary usage.
 *
 * @param matrix - The matrix to lift. Must have a last row of `[0, 0, 1]`.
 * @returns A new `Affine2d` wrapping the matrix.
 * @throws `Error` when the last row is not `[0, 0, 1]` within a tolerance scaled by the magnitude of the matrix's other entries (see `PRECISION.md`).
 * @since 2.0.0
 */
export const fromMatrix: (matrix: Matrix3x3) => Affine2d = internal.fromMatrix

/**
 * The identity transform, which leaves every point fixed.
 *
 * @since 2.0.0
 */
export const identity: Affine2d = internal.identity

export const translate: {
  /**
   * Creates an `Affine2d` that translates by `(tx, ty)`.
   *
   * @param tx - The x translation.
   * @param ty - The y translation.
   * @returns A new translating `Affine2d`.
   * @since 2.0.0
   */
  (tx: number, ty: number): Affine2d
  /**
   * Creates an `Affine2d` that translates by a vector.
   *
   * @param v - The translation, as an offset added to every point.
   * @returns A new translating `Affine2d`.
   * @since 2.0.0
   */
  (v: Vector2): Affine2d
} = internal.translate

export const scale: {
  /**
   * Creates an `Affine2d` that scales uniformly by `xy` on both axes.
   *
   * @param xy - The uniform scale factor.
   * @param origin - The point that stays fixed. Every other point moves
   *   toward or away from it. Defaults to `Vector2.zero`.
   * @returns A new scaling `Affine2d`.
   * @since 2.0.0
   */
  (xy: number, origin?: Vector2): Affine2d
  /**
   * Creates an `Affine2d` that scales by `sx` along the x axis and `sy`
   * along the y axis.
   *
   * @param sx - The x scale factor.
   * @param sy - The y scale factor.
   * @param origin - The point that stays fixed. Every other point moves
   *   toward or away from it along each axis. Defaults to `Vector2.zero`.
   * @returns A new scaling `Affine2d`.
   * @example
   * ```ts
   * // Stretch a shape about its own center.
   * const center = Vector2.make(50, 50)
   * const stretch = Affine2d.scale(2, 1, center)
   *
   * Affine2d.apply(stretch, center) // Vector2(50, 50)
   * Affine2d.apply(stretch, Vector2.make(60, 60)) // Vector2(70, 60)
   * ```
   * @since 2.0.0
   */
  (sx: number, sy: number, origin?: Vector2): Affine2d
  /**
   * Creates an `Affine2d` that scales by each component of a vector along
   * its axis.
   *
   * @param factors - The x and y scale factors, as the vector's components.
   * @param origin - The point that stays fixed. Defaults to `Vector2.zero`.
   * @returns A new scaling `Affine2d`.
   * @since 2.0.0
   */
  (factors: Vector2, origin?: Vector2): Affine2d
} = internal.scale

/**
 * Creates an `Affine2d` that rotates by `theta` radians about a point.
 *
 * A positive angle turns `+x` toward `+y`. That is counterclockwise on a
 * y-up plot and clockwise in an SVG viewport, where y points down.
 *
 * @param theta - The rotation angle in radians.
 * @param origin - The point that stays fixed. Defaults to `Vector2.zero`.
 * @returns A new rotating `Affine2d`.
 * @since 2.0.0
 */
export const rotate: (theta: number, origin?: Vector2) => Affine2d = internal.rotate

/**
 * Reflects points across the x axis: `(x, y) -> (x, -y)`.
 *
 * @since 2.0.0
 */
export const reflectX: Affine2d = internal.reflectX

/**
 * Reflects points across the y axis: `(x, y) -> (-x, y)`.
 *
 * @since 2.0.0
 */
export const reflectY: Affine2d = internal.reflectY

/**
 * Creates an `Affine2d` that reflects across a line.
 *
 * @param direction - A non-zero vector along the mirror line. Its length
 *   doesn't matter.
 * @param origin - A point on the mirror line. Defaults to `Vector2.zero`,
 *   so the line passes through the origin.
 * @returns A new reflecting `Affine2d`.
 * @throws `Error` when `direction` has exactly zero magnitude.
 * @example
 * ```ts
 * // Mirror across the diagonal y = x + 1.
 * const mirror = Affine2d.reflectAcrossLine(Vector2.make(1, 1), Vector2.make(0, 1))
 *
 * Affine2d.apply(mirror, Vector2.make(2, 0)) // Vector2(-1, 3), up to rounding
 * ```
 * @since 2.0.0
 */
export const reflectAcrossLine: (direction: Vector2, origin?: Vector2) => Affine2d =
  internal.reflectAcrossLine

/**
 * Creates an `Affine2d` shear with `kx` horizontal shear (x gains `kx` times
 * the height above `origin`) and `ky` vertical shear (y gains `ky` times the
 * distance right of `origin`).
 *
 * @param kx - The horizontal shear factor.
 * @param ky - The vertical shear factor.
 * @param origin - The point that stays fixed, along with the lines through
 *   it that each shear slides along. Defaults to `Vector2.zero`.
 * @returns A new shearing `Affine2d`.
 * @since 2.0.0
 */
export const shear: (kx: number, ky: number, origin?: Vector2) => Affine2d = internal.shear

export const andThen: {
  /**
   * Sequences two `Affine2d` transforms, applying `a` first and then `b`.
   *
   * In matrix terms this returns `b * a`, the matrix that yields the same
   * result as applying `a` then `b` to a column-vector point.
   *
   * @param a - The transform applied first.
   * @param b - The transform applied second.
   * @returns A new combined `Affine2d`.
   * @example
   * ```ts
   * const t = Affine2d.identity.pipe(
   *   Affine2d.andThen(Affine2d.translate(1, 0)),
   *   Affine2d.andThen(Affine2d.rotate(Math.PI / 2)),
   * )
   * // t translates first, then rotates
   * ```
   * @since 2.0.0
   */
  (a: Affine2d, b: Affine2d): Affine2d
  /**
   * Sequences two `Affine2d` transforms. `andThen(b)(a)` applies `a` then
   * `b`.
   *
   * @param b - The transform applied after the piped-in transform.
   * @returns A function that takes the transform to apply first and returns the sequenced transform.
   * @since 2.0.0
   */
  (b: Affine2d): (a: Affine2d) => Affine2d
} = internal.andThen

// The implementation always runs the same singular check. For
// `Invertible`-branded transforms the empty branch is provably unreachable,
// but TS can't see that — the cast pairs the type-level promise with the
// runtime brand check.
export const inverse: {
  /**
   * Inverts an `Invertible`-branded `Affine2d`. Because the brand guarantees
   * non-singularity, the result is always a single transform, wrapped in
   * `Solution.One`.
   *
   * @param a - The transform to invert.
   * @returns The inverse, wrapped in `Solution.One`.
   * @since 2.0.0
   */
  <T extends Invertible>(a: Affine2d<T>): Solution.One<Affine2d<T>>
  /**
   * Inverts an `Affine2d`. Returns `Solution.none` if the transform is
   * singular (e.g. a scale with a zero factor). Use `asInvertible` or
   * `isInvertible` to refine the type and tighten the return to
   * `Solution.One`, or `inverseUnsafe` for the throwing form.
   *
   * @param a - The transform to invert.
   * @returns The inverse in `Solution.One`, or `Solution.none` when singular.
   * @since 2.0.0
   */
  <T>(a: Affine2d<T>): Solution.AtMostOne<Affine2d<T>>
} = internal.inverse as never

/**
 * Inverts an `Affine2d`, throwing when the transform is singular (e.g. a
 * scale with a zero factor). Useful when invertibility has already been
 * validated out-of-band. Otherwise prefer `inverse`.
 *
 * @param a - The transform to invert.
 * @returns The inverse transform.
 * @throws `Error` when `a` is singular.
 * @since 2.0.0
 */
export const inverseUnsafe: (a: Affine2d) => Affine2d = internal.inverseUnsafe

/**
 * Checks if a transform is invertible.
 *
 * Only the 2x2 linear part decides it, since translation never makes an
 * affine map singular. The test is the scale-free one `Matrix2x2` and
 * `Matrix3x3` use: the determinant must exceed `RELATIVE_TOLERANCE` times
 * the Hadamard bound, the product of the row lengths. See `PRECISION.md`
 * for the mechanics.
 *
 * @param a - The transform to check.
 * @returns `true` when `a` is invertible, narrowing to `Affine2d<T & Invertible>`.
 * @since 2.0.0
 */
export const isInvertible: <T>(a: Affine2d<T>) => a is Affine2d<T & Invertible> =
  internal.isInvertible

/**
 * Asserts that the transform is invertible, throwing on a singular transform.
 *
 * @param a - The transform to assert against.
 * @returns The same transform, typed with the `Invertible` brand.
 * @throws `Error` when `a` is singular.
 * @since 2.0.0
 */
export const asInvertible: <T>(a: Affine2d<T>) => Affine2d<T & Invertible> = internal.asInvertible

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
 * Returns a `Vector2 -> Vector2` function that applies `a` to its argument.
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

export const applyDirection: {
  /**
   * Applies an `Affine2d` to a direction: a tangent, an edge vector, or any
   * difference of two points.
   *
   * Directions ignore translation, so only the linear part acts. Moving
   * both endpoints of an edge with `apply` and subtracting gives the same
   * vector.
   *
   * @param a - The transform to apply.
   * @param d - The direction to transform.
   * @returns The transformed direction, not normalized.
   * @since 2.0.0
   */
  (a: Affine2d, d: Vector2): Vector2
  /**
   * Applies an `Affine2d` to a direction, ignoring translation.
   *
   * @param d - The direction to transform.
   * @returns A function that takes the transform and returns the transformed direction.
   * @since 2.0.0
   */
  (d: Vector2): (a: Affine2d) => Vector2
} = internal.applyDirection

export const applyNormal: {
  /**
   * Maps a normal of an edge so that it stays perpendicular to the mapped
   * edge, pointing to the same side.
   *
   * A normal is not a direction under every transform. Under a non-uniform
   * scale or a shear, `applyDirection` would tilt it off perpendicular.
   * Normals map by the inverse transpose of the linear part instead. A
   * reflection keeps the normal on the side the edge's points move to, so
   * an outward normal stays outward.
   *
   * @param a - The transform to apply.
   * @param n - The normal to transform. Any non-zero length works.
   * @returns The transformed normal, unit length.
   * @throws `Error` when `a` is not invertible.
   * @since 2.0.0
   */
  (a: Affine2d, n: Vector2): Vector2
  /**
   * Maps a normal of an edge so that it stays perpendicular to the mapped
   * edge.
   *
   * @param n - The normal to transform.
   * @returns A function that takes the transform and returns the transformed
   *   unit normal.
   * @throws `Error` when the transform is not invertible.
   * @since 2.0.0
   */
  (n: Vector2): (a: Affine2d) => Vector2
} = internal.applyNormal

/**
 * Extracts the 2x2 linear part of an `Affine2d`. The result is the
 * upper-left block of its homogeneous matrix, ignoring translation. Maps direction vectors
 * (tangents, differences of points) under the transform.
 *
 * @param a - The transform.
 * @returns The 2x2 linear part.
 * @since 2.0.0
 */
export const linear: (a: Affine2d) => Matrix2x2 = internal.linear

/**
 * Extracts the translation vector of an `Affine2d`. The result is the
 * third column of its homogeneous matrix, ignoring the linear part.
 *
 * @param a - The transform.
 * @returns The translation vector.
 * @since 2.0.0
 */
export const translation: (a: Affine2d) => Vector2 = internal.translation

/**
 * Returns the `Affine2d` corresponding to `a`'s linear part with translation
 * zeroed. Equivalent to building an affine from `linear` but stays in the
 * `Affine2d` type so it can be applied via `apply` or `applyTo`.
 *
 * Use this to transform anything that is *not* a position: tangent vectors
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
   * Checks if two `Affine2d` instances are approximately equal.
   *
   * Each matrix entry is compared with `coincident` from `curvy/number`,
   * an absolute-plus-relative tolerance band. See `PRECISION.md` for the
   * mechanics.
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
