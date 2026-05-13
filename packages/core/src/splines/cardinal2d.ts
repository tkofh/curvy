import type { CubicPath2d } from '../path/cubic2d'
import type { Pipeable } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { Bezier2d } from './bezier2d'
import type { Cardinal2dTypeId } from './cardinal2d.internal'
import * as internal from './cardinal2d.internal'

/**
 * A Cardinal spline in 2D space.
 *
 * Carries its parameterization (`tension` and `alpha`) as part of the spline's
 * identity rather than as evaluation arguments — the same control points with
 * different tensions describe different curves, so the spline TYPE includes
 * them. See {@link Options} for parameter semantics.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * The classical Cardinal characteristic matrix (uniform parameterization,
 * arbitrary tension) is exposed as `Characteristic.cubicCardinal(tension)`.
 * For non-uniform parameterization (any `alpha != 0`), the per-segment cubic
 * is computed directly from chord-length-weighted tangents.
 *
 * @since 1.0.0
 */
export interface Cardinal2d extends Pipeable {
  readonly [Cardinal2dTypeId]: Cardinal2dTypeId
  readonly points: ReadonlyArray<Vector2>
  readonly tension: number
  readonly alpha: number
  [Symbol.iterator](): IterableIterator<Vector2>
}

/**
 * Configuration for a Cardinal spline. Both fields are optional and carry
 * sensible defaults.
 *
 * - **`tension`** controls how loose or tight the curve is at each interior
 *   control point. `tension = 0.5` is classical Catmull-Rom; `tension = 0`
 *   produces zero-tangent endpoints (smoothstep-shaped segments between
 *   consecutive control points); higher values produce looser, more curved
 *   shapes. Default: `0.5`.
 *
 * - **`alpha`** controls how chord lengths between control points scale the
 *   tangents. `alpha = 0` is uniform parameterization (classical Catmull-Rom),
 *   which can produce cusps and self-intersections when control points
 *   cluster. `alpha = 0.5` is centripetal parameterization — Yuksel's
 *   recommended default, eliminating those failure modes at minimal shape
 *   cost. `alpha = 1` is chordal parameterization. Default: `0.5`
 *   (centripetal).
 *
 * @since 2.0.0
 */
export interface Options {
  readonly tension?: number
  readonly alpha?: number
}

/**
 * Checks if a value is a `Cardinal2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Cardinal2d`, `false` otherwise.
 * @since 1.0.0
 */
export const isCardinal2d: (p: unknown) => p is Cardinal2d = internal.isCardinal2d

export const make: {
  /**
   * Creates a new `Cardinal2d` with default tension and alpha.
   *
   * @param p0 - The first control point.
   * @param p1 - The second control point.
   * @param points - The remaining control points.
   * @returns A new `Cardinal2d` instance.
   * @since 1.0.0
   */
  (p0: Vector2, p1: Vector2, ...points: ReadonlyArray<Vector2>): Cardinal2d
  /**
   * Creates a new `Cardinal2d` with the given options.
   *
   * @param options - Tension and alpha. See {@link Options}.
   * @param p0 - The first control point.
   * @param p1 - The second control point.
   * @param points - The remaining control points.
   * @returns A new `Cardinal2d` instance.
   * @since 2.0.0
   */
  (options: Options, p0: Vector2, p1: Vector2, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.make

/**
 * Creates a new `Cardinal2d` from an array of control points.
 *
 * @param points - The control points.
 * @param options - Tension and alpha. See {@link Options}. Defaults to centripetal Catmull-Rom.
 * @returns A new `Cardinal2d` instance.
 * @since 1.0.0
 */
export const fromArray: (points: ReadonlyArray<Vector2>, options?: Options) => Cardinal2d =
  internal.fromArray

export const append: {
  /**
   * Appends control points to a `Cardinal2d`. Tension and alpha are preserved.
   *
   * @param points - The control points to append.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  /**
   * Appends control points to a `Cardinal2d`. Tension and alpha are preserved.
   *
   * @param c - The `Cardinal2d` to append to.
   * @param points - The control points to append.
   * @returns A new `Cardinal2d` instance.
   * @since 1.0.0
   */
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.append

export const prepend: {
  /**
   * Prepends control points to a `Cardinal2d`. Tension and alpha are preserved.
   *
   * @param points - The control points to prepend.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 1.0.0
   */
  (...points: ReadonlyArray<Vector2>): (c: Cardinal2d) => Cardinal2d
  /**
   * Prepends control points to a `Cardinal2d`. Tension and alpha are preserved.
   *
   * @param c - The `Cardinal2d` to prepend to.
   * @param points - The control points to prepend.
   * @returns A new `Cardinal2d` instance.
   * @since 1.0.0
   */
  (c: Cardinal2d, ...points: ReadonlyArray<Vector2>): Cardinal2d
} = internal.prepend

/**
 * Doubles the endpoints of a `Cardinal2d` spline. Tension and alpha are
 * preserved.
 *
 * @param c - The `Cardinal2d` to duplicate the endpoints of.
 * @returns A new `Cardinal2d` instance with duplicated endpoints.
 * @since 1.0.0
 */
export const withDuplicatedEndpoints: (c: Cardinal2d) => Cardinal2d =
  internal.withDuplicatedEndpoints

export const withReflectedEndpoints: {
  /**
   * Reflects the endpoints of a `Cardinal2d` spline. Tension and alpha are
   * preserved.
   *
   * @param scale - The scale factor for the reflection.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 1.0.0
   */
  (scale: number): (c: Cardinal2d) => Cardinal2d
  /**
   * Reflects the endpoints of a `Cardinal2d` spline. Tension and alpha are
   * preserved.
   *
   * @param c - The `Cardinal2d` to reflect the endpoints of.
   * @param scale - The scale factor for the reflection.
   * @returns A new `Cardinal2d` instance with reflected endpoints.
   * @since 1.0.0
   */
  (c: Cardinal2d, scale?: number): Cardinal2d
} = internal.withReflectedEndpoints

export const withTension: {
  /**
   * Returns a new `Cardinal2d` with the given tension; control points and
   * alpha are preserved.
   *
   * @param tension - The new tension value.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 2.0.0
   */
  (tension: number): (c: Cardinal2d) => Cardinal2d
  /**
   * Returns a new `Cardinal2d` with the given tension; control points and
   * alpha are preserved.
   *
   * @param c - The `Cardinal2d` to update.
   * @param tension - The new tension value.
   * @returns A new `Cardinal2d` instance.
   * @since 2.0.0
   */
  (c: Cardinal2d, tension: number): Cardinal2d
} = internal.withTension

export const withAlpha: {
  /**
   * Returns a new `Cardinal2d` with the given alpha; control points and
   * tension are preserved.
   *
   * @param alpha - The new alpha value.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 2.0.0
   */
  (alpha: number): (c: Cardinal2d) => Cardinal2d
  /**
   * Returns a new `Cardinal2d` with the given alpha; control points and
   * tension are preserved.
   *
   * @param c - The `Cardinal2d` to update.
   * @param alpha - The new alpha value.
   * @returns A new `Cardinal2d` instance.
   * @since 2.0.0
   */
  (c: Cardinal2d, alpha: number): Cardinal2d
} = internal.withAlpha

export const withOptions: {
  /**
   * Returns a new `Cardinal2d` with the given options merged into the
   * existing tension/alpha. Omitted fields are preserved from the input.
   *
   * @param options - The options to merge.
   * @returns A function that takes a `Cardinal2d` and returns a new instance.
   * @since 2.0.0
   */
  (options: Options): (c: Cardinal2d) => Cardinal2d
  /**
   * Returns a new `Cardinal2d` with the given options merged in.
   *
   * @param c - The `Cardinal2d` to update.
   * @param options - The options to merge.
   * @returns A new `Cardinal2d` instance.
   * @since 2.0.0
   */
  (c: Cardinal2d, options: Options): Cardinal2d
} = internal.withOptions

/**
 * Converts a `Cardinal2d` to a `CubicPath2d` using the spline's `tension` and
 * `alpha`. With the default options (`{ tension: 0.5, alpha: 0.5 }`) the
 * result is a centripetal Catmull-Rom path — the canonical recommended
 * Catmull-Rom variant, which avoids the cusps and self-intersections that
 * uniform Catmull-Rom can produce when control points cluster.
 *
 * @param c - The Cardinal spline.
 * @returns A new `CubicPath2d` representing the spline.
 * @since 1.0.0
 */
export const toPath: (c: Cardinal2d) => CubicPath2d = internal.toPath

/**
 * Converts a `Cardinal2d` to a `Bezier2d`. Equivalent to {@link toPath}
 * followed by per-segment monomial-to-Bernstein conversion — same underlying
 * curve, expressed in cubic Bézier control-point form. Uses the spline's
 * `tension` and `alpha`.
 *
 * @param c - The Cardinal spline.
 * @returns A new `Bezier2d` representing the spline.
 * @since 1.0.0
 */
export const toBezier: (c: Cardinal2d) => Bezier2d = internal.toBezier
