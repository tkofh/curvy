import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './internal/arc.ts'

/**
 * An arc described by its geometry rather than its curve coefficients:
 * `Circular` for a piece of a circle, `Elliptical` for a piece of a
 * possibly rotated ellipse.
 *
 * An authoring representation, like the spline modules: describe the arc
 * here, query its geometry (`solve`, `length`, `boundingBox`), and lower it
 * with `toPath` for curve math or `toPathData` for SVG. The description
 * keeps answers the lowered form loses. Point-at-parameter is one
 * `cos`/`sin` here and a rational evaluation there, and length is a closed
 * form or a fixed-cost elliptic integral rather than a tolerance-driven
 * iteration.
 *
 * Every operation in this module accepts both kinds. Angles are in
 * radians, positive rotating `+x` toward `+y` — clockwise in an SVG
 * viewport's y-down coordinates. Direction and multiplicity live in the
 * sweep's sign and magnitude: a negative sweep runs the other way, and a
 * magnitude past `2 * pi` keeps going around.
 *
 * All fields are readonly. No operation mutates an arc.
 *
 * @since 2.0.0
 */
export type Arc = Circular | Elliptical

/**
 * A circular arc: the points `center + radius * (cos(a), sin(a))` for `a`
 * running from `startAngle` to `startAngle + sweep`.
 *
 * Angles are in radians, measured from the `+x` direction, positive
 * rotating `+x` toward `+y` — clockwise in an SVG viewport's y-down
 * coordinates.
 *
 * @since 2.0.0
 */
export interface Circular extends Value.Instance {
  readonly '~curvy/Arc': '~curvy/Arc'
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
 * An elliptical arc: the points of an ellipse with semi-axes `radiusX` and
 * `radiusY`, rotated by `rotation` around `center`, for parametric angles
 * running from `startAngle` to `startAngle + sweep`.
 *
 * The point at parametric angle `a` is
 * `center + R(rotation) * (radiusX * cos(a), radiusY * sin(a))`, where
 * `R` rotates `+x` toward `+y`. This is SVG's own arc parametrization.
 *
 * The parametric angle is not the direction from the center to the
 * point. It is the angle on the circle that the radii stretch into the
 * ellipse, so the two agree only on the axes, or everywhere when the radii
 * are equal. Equal steps in it also cover unequal distances along the
 * curve, unlike a circle's.
 *
 * @since 2.0.0
 */
export interface Elliptical extends Value.Instance {
  readonly '~curvy/Arc': '~curvy/Arc'
  readonly kind: 'elliptical'
  /**
   * The cartesian center of the ellipse the arc lies on.
   */
  readonly center: Vector2
  /**
   * The semi-axis along the ellipse's own x axis, before rotation.
   * Non-negative. `0` flattens the ellipse to a segment along its y axis.
   */
  readonly radiusX: number
  /**
   * The semi-axis along the ellipse's own y axis, before rotation.
   * Non-negative. `0` flattens the ellipse to a segment along its x axis.
   */
  readonly radiusY: number
  /**
   * The angle from the `+x` direction to the ellipse's own x axis, in
   * radians, positive rotating `+x` toward `+y`.
   */
  readonly rotation: number
  /**
   * The parametric angle where the arc starts, in radians. `0` is the end
   * of the ellipse's own x axis.
   */
  readonly startAngle: number
  /**
   * The signed parametric extent, in radians. Positive runs `+x` toward
   * `+y` in the ellipse's own frame. A magnitude past `2 * pi` traces the
   * ellipse more than once.
   */
  readonly sweep: number
}

/**
 * Configuration for `elliptical`. Only the two radii are required. The
 * defaults give a full, unrotated ellipse around the origin.
 *
 * @since 2.0.0
 */
export interface EllipticalConfig {
  /**
   * The cartesian center of the ellipse. Defaults to the origin.
   */
  readonly center?: Vector2
  /**
   * The semi-axis along the ellipse's own x axis. Must be finite and
   * non-negative.
   */
  readonly radiusX: number
  /**
   * The semi-axis along the ellipse's own y axis. Must be finite and
   * non-negative.
   */
  readonly radiusY: number
  /**
   * The angle from `+x` to the ellipse's own x axis, in radians. Defaults
   * to `0`, an axis-aligned ellipse.
   */
  readonly rotation?: number
  /**
   * The parametric angle where the arc starts, in radians. Defaults to
   * `0`, the end of the ellipse's own x axis.
   */
  readonly startAngle?: number
  /**
   * The signed parametric extent, in radians. Defaults to `2 * pi`, the
   * whole ellipse.
   */
  readonly sweep?: number
}

/**
 * Checks if a value is an `Arc` of either kind.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Arc`, `false` otherwise.
 * @since 2.0.0
 */
export const isArc: (v: unknown) => v is Arc = internal.isArc

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

/**
 * Checks if a value is an `Elliptical` arc.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Elliptical` arc, `false` otherwise.
 * @since 2.0.0
 */
export const isElliptical: (v: unknown) => v is Elliptical = internal.isElliptical

/**
 * Creates an `Elliptical` arc.
 *
 * Equal radii give an ellipse that is geometrically a circle, but the
 * value stays `Elliptical`. Build a `Circular` arc with `circular` to get
 * its closed-form length.
 *
 * @param config - Center, radii, rotation, start angle, and sweep. Only
 *   `radiusX` and `radiusY` are required. See `EllipticalConfig` for the
 *   defaults.
 * @returns A new `Elliptical` arc.
 * @throws `Error` when either radius is negative, or when a radius,
 *   `rotation`, `startAngle`, or `sweep` is not finite.
 * @since 2.0.0
 * @example
 * ```ts
 * // The ellipse inscribed in a 200 x 100 box at the origin:
 * const oval = Arc.elliptical({
 *   center: Vector2.make(100, 50),
 *   radiusX: 100,
 *   radiusY: 50,
 * })
 *
 * // Its lower half, from 3 o'clock through 6 o'clock to 9 o'clock:
 * const lower = Arc.elliptical({ radiusX: 100, radiusY: 50, sweep: Math.PI })
 * ```
 */
export const elliptical: (config: EllipticalConfig) => Elliptical = internal.elliptical

/**
 * Creates the full ellipse traced by `center + a * cos(t) + b * sin(t)`,
 * from two conjugate semi-diameters.
 *
 * Two semi-diameters are conjugate when each is parallel to the tangent at
 * the other's end, the way the two radii of a circle stay conjugate under
 * any affine map. That makes this the image of a circle under a linear
 * map, such as a 3D circle seen in parallel projection: pass the images of
 * two perpendicular radii.
 *
 * The arc starts at `center + a` and runs toward `center + b`, so its
 * point at parametric extent `t` from the start is
 * `center + a * cos(t) + b * sin(t)`. `sweep` is `2 * pi` when `a` turns
 * toward `b` the positive way (`Vector2.cross(a, b) >= 0`) and `-2 * pi`
 * otherwise. `radiusX` is the larger radius.
 *
 * @param center - The ellipse's center.
 * @param a - The first semi-diameter, from the center to the start point.
 * @param b - The second semi-diameter, conjugate to `a`.
 * @returns The full ellipse. Parallel semi-diameters give a flat one,
 *   with `radiusY` of `0`.
 * @throws `Error` when a coordinate is not finite.
 * @example
 * ```ts
 * const e = Arc.fromConjugateDiameters(Vector2.zero, Vector2.make(2, 0), Vector2.make(1, 1))
 *
 * Arc.startPoint(e) // Vector2(2, 0), up to rounding
 * Arc.solve(e, 0.25) // Vector2(1, 1): a quarter of the way round, at the tip of b
 * e.radiusX * e.radiusY // 2, the area of the parallelogram on a and b
 * ```
 * @since 2.0.0
 */
export const fromConjugateDiameters: (center: Vector2, a: Vector2, b: Vector2) => Elliptical =
  internal.fromConjugateDiameters

export const equals: {
  /**
   * Checks two arcs for equality, field by field. Numeric fields compare
   * within the tolerance of `coincident` from `curvy/number`.
   *
   * Comparison is structural, not geometric. Arcs of different kinds
   * always compare unequal, even an `Elliptical` arc with equal radii
   * against the `Circular` arc it traces. So do two arcs tracing the same
   * points from different descriptions, like a start angle shifted by
   * `2 * pi` or the reverse direction.
   *
   * @param a - The first arc.
   * @param b - The second arc.
   * @returns `true` if the arcs are equal, `false` otherwise.
   * @since 2.0.0
   */
  (a: Arc, b: Arc): boolean
  /**
   * Checks two arcs for equality, field by field.
   *
   * @param b - The arc to compare against.
   * @returns A function that takes an arc and returns whether the two are
   *   equal.
   * @since 2.0.0
   */
  (b: Arc): (a: Arc) => boolean
} = internal.equals

/**
 * Computes the point where the arc starts, at angle `startAngle`. For a
 * circular arc that is `center + radius * (cos(startAngle), sin(startAngle))`.
 *
 * @param a - The arc.
 * @returns The arc's first point.
 * @since 2.0.0
 */
export const startPoint: (a: Arc) => Vector2 = internal.startPoint

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
export const endPoint: (a: Arc) => Vector2 = internal.endPoint

export const solve: {
  /**
   * Evaluates the arc at parameter `t`, the point at angle
   * `startAngle + t * sweep`.
   *
   * On a circular arc the uniform parameter is also the arc-length
   * parameter. Equal steps in `t` cover equal distance along the arc, a
   * property polynomial curves lack. An elliptical arc's angle is
   * parametric, so equal steps cover more distance near the ends of the
   * longer axis.
   *
   * `t` is not clamped. Values outside `[0, 1]` continue around the curve.
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
   *
   * // On an ellipse the same parameter lands at (100 * cos(pi / 4), 50 * sin(pi / 4)),
   * // which lies at about 26.6 degrees from the center, not 45:
   * Arc.solve(Arc.elliptical({ radiusX: 100, radiusY: 50, sweep: Math.PI / 2 }), 0.5)
   * ```
   */
  (a: Arc, t: number): Vector2
  /**
   * Evaluates the arc at parameter `t`, the point at angle
   * `startAngle + t * sweep`.
   *
   * @param t - The parameter. `0` is the start of the arc, `1` the end.
   * @returns A function that takes an arc and returns the point at `t`.
   * @since 2.0.0
   */
  (t: number): (a: Arc) => Vector2
} = internal.solve

/**
 * Computes the arc's length. A sweep past one full turn counts every
 * traversal.
 *
 * Neither kind takes a tolerance parameter or iterates to one, unlike arc
 * length on a lowered path:
 * - circular: `radius * abs(sweep)`, exact in closed form
 * - elliptical: an incomplete elliptic integral of the second kind,
 *   evaluated through Carlson's symmetric forms in a fixed number of
 *   steps. The relative error stays near `1e-15`. Equal radii take the
 *   closed form, and so does a flat ellipse.
 *
 * @param a - The arc.
 * @returns The length of the arc.
 * @since 2.0.0
 * @example
 * ```ts
 * // The perimeter of a 2:1 ellipse:
 * Arc.length(Arc.elliptical({ radiusX: 2, radiusY: 1 })) // 9.688448220547677
 * ```
 */
export const length: (a: Arc) => number = internal.length

/**
 * Reverses the arc's direction, tracing the same points the other way.
 * The start angle moves to the far end and the sweep negates, so
 * `solve(reverse(a), t)` is `solve(a, 1 - t)`.
 *
 * @param a - The arc.
 * @returns A new arc of the same kind, tracing the input backward.
 * @since 2.0.0
 */
export const reverse: <A extends Arc>(a: A) => A = internal.reverse

/**
 * Computes the exact axis-aligned bounding box of the arc.
 *
 * Extremes occur only at the endpoints or at the angles where the curve
 * runs parallel to an axis, and both are known in closed form. Every side
 * is therefore exact up to IEEE 754 rounding, with no tolerance parameter.
 * Contrast `RationalCubicPath2d.boundingBox`, which is tight only to a
 * tolerance you choose. An arc whose radii are all `0` has a box that
 * collapses to `center`.
 *
 * @param a - The arc.
 * @returns A closed `Interval2d` enclosing exactly the arc's points.
 * @since 2.0.0
 */
export const boundingBox: (a: Arc) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Constructs the arc as a `RationalCubicPath2d`, exact up to IEEE 754
 * rounding. The path is made of rational cubic segments of at most a
 * quarter turn each, uniform in angle, and a sweep past one full turn
 * traces the curve more than once. Circular arcs use the same
 * construction as `CoordinateSystem.arc`, and elliptical arcs carry it
 * through the ellipse's stretch and rotation.
 *
 * The path is the form to transform, since circles and ellipses are not
 * closed under every affine map but rational cubics are. Lower first and
 * apply `RationalCubicPath2d.transform` to the result. It is also the form
 * `CoordinateSystem.image` takes, to carry an arc drawn in chart space
 * into a polar system.
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
export const toPath: (a: Arc) => RationalCubicPath2d = internal.toPath

/**
 * Emits exact SVG path data for the arc, using `A` commands computed from
 * the arc's description rather than recovered from curve coefficients.
 * An elliptical arc's commands carry both radii and its rotation in
 * degrees, which is how SVG draws ellipses natively.
 *
 * Pieces stay at or under a half turn, so the large-arc flag is always
 * `0`. The sweep flag is `1` for a positive sweep, which renders
 * clockwise in an SVG viewport's y-down coordinates.
 *
 * Degenerate contracts:
 * - zero sweep, or every radius `0`: an `M` command alone, which renders
 *   nothing
 * - an elliptical arc with one radius `0`: `L` commands tracing the flat
 *   ellipse back and forth, since SVG would draw an `A` with a zero radius
 *   as a single line between its endpoints
 * - a full-turn sweep: two half-turn `A` commands, closing on the exact
 *   starting coordinates
 * - a sweep past one full turn: clamped to one lap, where `toPath` keeps
 *   going around. SVG path data cannot express multiple laps.
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
export const toPathData: (a: Arc) => string = internal.toPathData
