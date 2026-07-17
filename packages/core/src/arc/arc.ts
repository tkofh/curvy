import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import type { ArcTypeId } from './arc.internal.ts'
import * as internal from './arc.internal.ts'

/**
 * A circular arc: the points `center + radius * (cos(a), sin(a))` for `a`
 * running from `startAngle` to `startAngle + sweep`.
 *
 * An authoring representation, like the spline modules: describe the arc
 * here, query its closed-form geometry (`solve`, `length`, `boundingBox`),
 * and lower it with `toPath` for curve math or `toPathData` for SVG. The
 * description keeps answers the lowered form loses — arc length and
 * point-at-parameter are exact one-liners here and numeric iterations
 * there.
 *
 * Angles are in radians, measured from the `+x` direction, positive
 * rotating `+x` toward `+y` — clockwise in an SVG viewport's y-down
 * coordinates. Direction and multiplicity live in the sweep's sign and
 * magnitude: a negative sweep runs the other way, and a magnitude past
 * `2 * pi` keeps going around the circle.
 *
 * All fields are readonly. No operation mutates an arc.
 *
 * @since 2.0.0
 */
export interface Circular extends Pipeable {
  readonly [ArcTypeId]: ArcTypeId
  readonly kind: 'circular'
  /**
   * The cartesian center of the circle the arc lies on.
   */
  readonly center: Vector2
  /**
   * The circle's radius. Non-negative; `0` is a valid degenerate arc that
   * never leaves `center`.
   */
  readonly radius: number
  /**
   * The angle where the arc starts, in radians from the `+x` direction,
   * positive rotating `+x` toward `+y`.
   */
  readonly startAngle: number
  /**
   * The signed angular extent, in radians. Positive rotates `+x` toward
   * `+y`; a magnitude past `2 * pi` traces the circle more than once.
   */
  readonly sweep: number
}

/**
 * Configuration for `circular`. Only `radius` is required; the defaults
 * give a full circle around the origin.
 *
 * @since 2.0.0
 */
export interface CircularConfig {
  /**
   * The cartesian center of the circle. Defaults to the origin.
   */
  readonly center?: Vector2
  /**
   * The circle's radius. Must be finite and non-negative.
   */
  readonly radius: number
  /**
   * The angle where the arc starts, in radians from the `+x` direction,
   * positive rotating `+x` toward `+y`. Defaults to `0` (3 o'clock on
   * screen).
   */
  readonly startAngle?: number
  /**
   * The signed angular extent, in radians. Defaults to `2 * pi`, a full
   * circle.
   */
  readonly sweep?: number
}

/**
 * Checks if a value is a `Circular` arc.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Circular` arc, `false` otherwise.
 * @since 2.0.0
 */
export const isCircular: (v: unknown) => v is Circular = internal.isCircular

/**
 * Creates a `Circular` arc.
 *
 * @param config - Center, radius, start angle, and sweep. Only `radius` is
 *   required; see `CircularConfig` for the defaults.
 * @returns A new `Circular` arc.
 * @throws `Error` when `radius` is negative, or when `radius`,
 *   `startAngle`, or `sweep` is not finite.
 * @since 2.0.0
 * @example
 * ```ts
 * // A quarter circle of radius 100 from 3 o'clock to 6 o'clock:
 * const quarter = Arc.circular({ radius: 100, sweep: Math.PI / 2 })
 *
 * // Omitting sweep gives the full circle:
 * const dial = Arc.circular({ center: Vector2.make(200, 200), radius: 80 })
 * ```
 */
export const circular: (config: CircularConfig) => Circular = internal.circular

export const equals: {
  /**
   * Checks two `Circular` arcs for equality, field by field. Numeric
   * fields compare within the tolerance of `coincident` from
   * `curvy/number`.
   *
   * Comparison is structural, not geometric: two arcs tracing the same
   * points from different descriptions — a start angle shifted by
   * `2 * pi`, or the reverse direction — compare unequal.
   *
   * @param a - The first arc.
   * @param b - The second arc.
   * @returns `true` if the arcs are equal, `false` otherwise.
   * @since 2.0.0
   */
  (a: Circular, b: Circular): boolean
  /**
   * Checks two `Circular` arcs for equality.
   *
   * @param b - The arc to compare against.
   * @returns A function that takes an arc and returns whether the two are
   *   equal.
   * @since 2.0.0
   */
  (b: Circular): (a: Circular) => boolean
} = internal.equals

/**
 * Computes the point where the arc starts,
 * `center + radius * (cos(startAngle), sin(startAngle))`.
 *
 * @param a - The arc.
 * @returns The arc's first point.
 * @since 2.0.0
 */
export const startPoint: (a: Circular) => Vector2 = internal.startPoint

/**
 * Computes the point where the arc ends, evaluated at
 * `startAngle + sweep`.
 *
 * On a full-turn arc the result lands within rounding of `startPoint`,
 * not bitwise on it — the trig re-evaluates a full period away. `toPathData`
 * closes full circles on the exact starting coordinates instead.
 *
 * @param a - The arc.
 * @returns The arc's last point.
 * @since 2.0.0
 */
export const endPoint: (a: Circular) => Vector2 = internal.endPoint

export const solve: {
  /**
   * Evaluates the arc at parameter `t`, the point at angle
   * `startAngle + t * sweep`.
   *
   * The uniform parameter is also the arc-length parameter: equal steps
   * in `t` cover equal distance along the arc, a property polynomial
   * curves lack. `t` is not clamped — values outside `[0, 1]` continue
   * around the circle.
   *
   * @param a - The arc to evaluate.
   * @param t - The parameter. `0` is the start of the arc, `1` the end.
   * @returns The point on the arc at parameter `t`.
   * @since 2.0.0
   * @example
   * ```ts
   * // The midpoint of a quarter arc sits at 45 degrees:
   * Arc.solve(Arc.circular({ radius: 1, sweep: Math.PI / 2 }), 0.5)
   * // (cos(pi / 4), sin(pi / 4))
   * ```
   */
  (a: Circular, t: number): Vector2
  /**
   * Evaluates the arc at parameter `t`.
   *
   * @param t - The parameter. `0` is the start of the arc, `1` the end.
   * @returns A function that takes an arc and returns the point at `t`.
   * @since 2.0.0
   */
  (t: number): (a: Circular) => Vector2
} = internal.solve

/**
 * Computes the arc's length, `radius * abs(sweep)`. Exact, in closed form
 * — no tolerance parameter and no iteration, unlike arc length on a
 * lowered path. A sweep past one full turn counts every traversal.
 *
 * @param a - The arc.
 * @returns The length of the arc.
 * @since 2.0.0
 */
export const length: (a: Circular) => number = internal.length

/**
 * Reverses the arc's direction: the same points traced the other way.
 * The start angle moves to the far end and the sweep negates, so
 * `solve(reverse(a), t)` is `solve(a, 1 - t)`.
 *
 * @param a - The arc.
 * @returns A new `Circular` arc tracing the input backward.
 * @since 2.0.0
 */
export const reverse: (a: Circular) => Circular = internal.reverse

/**
 * Computes the exact axis-aligned bounding box of the arc.
 *
 * Extremes occur only at the endpoints or where the arc crosses an axis
 * direction (a multiple of `pi / 2`), so every side is evaluated in
 * closed form — exact up to IEEE 754 rounding, with no tolerance
 * parameter. Contrast `RationalCubicPath2d.boundingBox`, which is tight
 * only to a tolerance you choose. A zero-radius arc's box collapses to
 * `center`.
 *
 * @param a - The arc.
 * @returns A closed `Interval2d` enclosing exactly the arc's points.
 * @since 2.0.0
 */
export const boundingBox: (a: Circular) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Constructs the arc as a `RationalCubicPath2d`, exact up to IEEE 754
 * rounding — the same construction `CoordinateSystem.arc` uses: rational
 * cubic segments of at most a quarter turn each, uniform in angle, with a
 * sweep past one full turn tracing the circle more than once.
 *
 * The path is the form to transform: circles are not closed under affine
 * maps, but rational cubics are, so lower first and apply
 * `RationalCubicPath2d.transform` to the result.
 *
 * @param a - The arc.
 * @returns The arc as a `RationalCubicPath2d`.
 * @since 2.0.0
 * @example
 * ```ts
 * // A quarter-turn fillet of radius 8 as one exact rational segment:
 * const path = Arc.toPath(
 *   Arc.circular({
 *     center: Vector2.make(50, 50),
 *     radius: 8,
 *     startAngle: -Math.PI / 2,
 *     sweep: Math.PI / 2,
 *   }),
 * )
 * ```
 */
export const toPath: (a: Circular) => RationalCubicPath2d = internal.toPath

/**
 * Emits exact SVG path data for the arc, using `A` commands computed from
 * the arc's description rather than recovered from curve coefficients.
 * Pieces stay at or under a half turn, so the large-arc flag is always
 * `0`; the sweep flag is `1` for a positive sweep, which renders
 * clockwise in an SVG viewport's y-down coordinates.
 *
 * Degenerate contracts:
 * - zero sweep, or radius `0`: an `M` command alone, which renders
 *   nothing
 * - a full-turn sweep: the circle as two half-turn `A` commands, closing
 *   on the exact starting coordinates
 * - a sweep past one full turn: clamped to one circle, where `toPath`
 *   keeps going around — SVG path data cannot express multiple laps
 *
 * @param a - The arc.
 * @returns The SVG path data string.
 * @since 2.0.0
 * @example
 * ```ts
 * // d attribute for a gauge tick at 12 o'clock, ready for <path d={...}>:
 * const d = Arc.toPathData(
 *   Arc.circular({
 *     center: Vector2.make(200, 200),
 *     radius: 120,
 *     startAngle: -Math.PI / 2,
 *     sweep: Math.PI / 6,
 *   }),
 * )
 * ```
 */
export const toPathData: (a: Circular) => string = internal.toPathData
