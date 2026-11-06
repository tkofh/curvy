import type { Bounds } from '../interval/interval.ts'
import type { CubicPath2d } from '../path/cubic2d.ts'
import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './internal/coordinateSystem.ts'
import type { Cyclical, Dimension } from './dimension.ts'

/**
 * A chart map from a two-axis chart space onto the cartesian plane:
 * `Cartesian` is the identity, and `Polar` reads chart points as
 * `(theta, r)` around a center. Layout code positions rectangles in chart
 * space; the system converts points with `toCartesian`, constructs the
 * exact cartesian images of chart-aligned shapes with `arc` and `sector`,
 * and constructs tolerance-bounded images of arbitrary chart paths with
 * `image`.
 *
 * The polar map is nonlinear, so it does not commute with control-point
 * mapping: converting a curve's control points with `toCartesian` produces
 * the wrong curve. Convert points pointwise, convert axis-aligned shapes
 * with the exact constructors, and convert arbitrary paths with `image`.
 *
 * Operations stay total over the union wherever both kinds have an honest
 * reading — `Cartesian` answers the shape constructors with the chart
 * shapes themselves. Where only a polar system gives a question meaning,
 * like the scalar maps `mapAngle` and `mapRadius`, the operation narrows
 * its parameter to `Polar` instead of inventing a cartesian answer.
 *
 * @since 2.0.0
 */
export type CoordinateSystem = Cartesian | Polar

/**
 * The on-screen rotation direction of increasing chart angle in an SVG
 * viewport, where the y axis points down. `'clockwise'` means increasing
 * theta rotates `+x` toward `+y` — the CSS and SVG positive-angle
 * convention, and the same numbers `Vector2.fromPolar` produces.
 * `'counterclockwise'` negates the angle.
 *
 * @since 2.0.0
 */
export type Winding = 'clockwise' | 'counterclockwise'

/**
 * The identity chart map: chart space is the cartesian plane itself. Its
 * shape constructors still work — `arc` is a horizontal segment, `ray` a
 * vertical one, and `sector` an axis-aligned rectangle — so code driving
 * a `CoordinateSystem` through the shared operations never branches on
 * kind. Only the polar-specific scalar maps require narrowing first.
 *
 * @since 2.0.0
 */
export interface Cartesian extends Value.Instance {
  readonly '~curvy/CoordinateSystem': '~curvy/CoordinateSystem'
  readonly kind: 'cartesian'
}

/**
 * A polar chart map. Chart points are `(theta, r)`: `x` is the angular
 * coordinate on the `theta` axis, `y` is the radial coordinate through the
 * `radius` map. The mapped point is
 * `center + mappedRadius * (cos(angle), sin(angle))`.
 *
 * @since 2.0.0
 */
export interface Polar extends Value.Instance {
  readonly '~curvy/CoordinateSystem': '~curvy/CoordinateSystem'
  readonly kind: 'polar'
  /**
   * The cartesian point where mapped radius `0` sits.
   */
  readonly center: Vector2
  /**
   * The angular axis. Its period is the angular unit: one full turn of
   * chart angle. See the `Dimension.radians`, `Dimension.degrees`, and
   * `Dimension.turns` constants.
   */
  readonly theta: Cyclical
  /**
   * The on-screen direction of increasing chart angle.
   */
  readonly winding: Winding
  /**
   * The radial axis map: any `Dimension` but `Cyclical`. Every kind
   * carries an `offset`, which shifts the mapped radius outward and puts
   * an inner hole under a chart that starts at its lowest value.
   * - `Linear`: mapped radius is `r * scale + offset`
   * - `Power`: a signed power of `r`, like a square-root radius that keeps
   *   sector area proportional to chart area
   * - `Logarithmic`: `scale * log(r) + offset`, defined only for `r > 0`
   *
   * Apply the map with `mapRadius` rather than reading fields off the
   * dimension.
   */
  readonly radius: Dimension
  /**
   * Where chart angle `0` points, as a rotation from the `+x` direction
   * measured in the angular unit, positive rotating `+x` toward `+y`.
   * Anchored on screen independent of `winding`, so `-90` on a degrees
   * axis is 12 o'clock whichever way the system sweeps.
   */
  readonly thetaOrigin: number
}

/**
 * Configuration for `polar`. Every field is optional; the defaults give a
 * radians-based polar system centered on the origin.
 *
 * @since 2.0.0
 */
export interface PolarConfig {
  /**
   * The cartesian point where mapped radius `0` sits. Defaults to the
   * origin.
   */
  readonly center?: Vector2
  /**
   * The angular axis, whose period is the angular unit. Defaults to
   * `Dimension.radians`.
   */
  readonly theta?: Cyclical
  /**
   * The on-screen direction of increasing chart angle. Defaults to
   * `'clockwise'`.
   */
  readonly winding?: Winding
  /**
   * The radial axis map applied to chart radii: `Linear`, `Power`, or
   * `Logarithmic`. `polar` rejects a `Cyclical` radius, since a wrapping
   * radius would tear shapes at its seam. Defaults to `Dimension.identity`.
   */
  readonly radius?: Dimension
  /**
   * Where chart angle `0` points, as a rotation from the `+x` direction
   * measured in the angular unit, positive rotating `+x` toward `+y` and
   * independent of `winding`. Defaults to `0` (3 o'clock on screen).
   */
  readonly thetaOrigin?: number
}

/**
 * Checks if a value is a `CoordinateSystem`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `CoordinateSystem`, `false` otherwise.
 * @since 2.0.0
 */
export const isCoordinateSystem: (v: unknown) => v is CoordinateSystem = internal.isCoordinateSystem

/**
 * Checks if a `CoordinateSystem` is `Cartesian`.
 *
 * @param s - The system to check.
 * @returns `true` if the system is `Cartesian`, `false` otherwise.
 * @since 2.0.0
 */
export const isCartesian: (s: CoordinateSystem) => s is Cartesian = internal.isCartesian

/**
 * Checks if a `CoordinateSystem` is `Polar`.
 *
 * @param s - The system to check.
 * @returns `true` if the system is `Polar`, `false` otherwise.
 * @since 2.0.0
 */
export const isPolar: (s: CoordinateSystem) => s is Polar = internal.isPolar

/**
 * The identity system: chart space is the cartesian plane.
 *
 * @since 2.0.0
 */
export const cartesian: Cartesian = internal.cartesian

/**
 * Creates a `Polar` system.
 *
 * @param config - Center, angular axis, winding, radial map, and angular
 *   origin. All optional; see `PolarConfig` for the defaults.
 * @returns A new `Polar` system.
 * @throws `Error` when `thetaOrigin` is not finite, or when `radius` is
 *   a `Cyclical` dimension.
 * @since 2.0.0
 * @example
 * ```ts
 * // Degrees around (200, 200), chart zero at 12 o'clock, with a 40px
 * // hole under chart radius 0:
 * const system = CoordinateSystem.polar({
 *   center: Vector2.make(200, 200),
 *   theta: Dimension.degrees,
 *   thetaOrigin: -90,
 *   radius: Dimension.linear(1, 40),
 * })
 * ```
 */
export const polar: (config?: PolarConfig) => Polar = internal.polar

export const equals: {
  /**
   * Checks two `CoordinateSystem` values for equality: the kinds match,
   * and for polar systems the centers, windings, angular axes, and radial
   * maps agree. Numeric fields compare within the tolerance of
   * `coincident` from `curvy/number`.
   *
   * @param a - The first system.
   * @param b - The second system.
   * @returns `true` if the systems are equal, `false` otherwise.
   * @since 2.0.0
   */
  (a: CoordinateSystem, b: CoordinateSystem): boolean
  /**
   * Checks two `CoordinateSystem` values for equality.
   *
   * @param b - The system to compare against.
   * @returns A function that takes a system and returns whether the two
   *   are equal.
   * @since 2.0.0
   */
  (b: CoordinateSystem): (a: CoordinateSystem) => boolean
} = internal.equals

export const toCartesian: {
  /**
   * Maps a chart-space point onto the cartesian plane. On a polar system
   * the point is read as `(theta, r)` — `point.x` on the angular axis,
   * `point.y` through the radial map — and lands at
   * `center + mappedRadius * (cos(angle), sin(angle))`. A negative mapped
   * radius reflects through the center, the standard polar convention. On
   * a cartesian system the point is returned unchanged.
   *
   * The arithmetic is exact IEEE 754 trig with no rounding or snapping.
   * See `PRECISION.md`.
   *
   * @param s - The coordinate system.
   * @param point - The chart-space point.
   * @returns The cartesian image of the point.
   * @throws `Error` when the system's radius is `Logarithmic` and
   *   `point.y` is not positive.
   * @since 2.0.0
   */
  (s: CoordinateSystem, point: Vector2): Vector2
  /**
   * Maps a chart-space point onto the cartesian plane.
   *
   * @param point - The chart-space point.
   * @returns A function that takes a system and returns the cartesian
   *   image. It throws when the system's radius is `Logarithmic` and
   *   `point.y` is not positive.
   * @since 2.0.0
   */
  (point: Vector2): (s: CoordinateSystem) => Vector2
} = internal.toCartesian

export const fromCartesian: {
  /**
   * Maps a cartesian point back into chart space. On a polar system the
   * result packs `(theta, r)` into `(x, y)`, with `theta` wrapped to
   * `[0, period)` and `r` sent back through the inverse radial map. At the
   * exact center the angle is `0`. On a cartesian system the point is
   * returned unchanged.
   *
   * Round-trips with `toCartesian` up to angle wrapping. A chart angle
   * comes back as its canonical representative, and a point whose mapped
   * radius was negative comes back on the reflected side, with a positive
   * mapped radius and the angle turned half a period. Every cartesian
   * point has a preimage, including under a `Logarithmic` radius, whose
   * inverse returns a positive chart radius for any distance.
   *
   * @param s - The coordinate system.
   * @param point - The cartesian point.
   * @returns The chart-space point `(theta, r)`.
   * @since 2.0.0
   */
  (s: CoordinateSystem, point: Vector2): Vector2
  /**
   * Maps a cartesian point back into chart space.
   *
   * @param point - The cartesian point.
   * @returns A function that takes a system and returns the chart-space
   *   point.
   * @since 2.0.0
   */
  (point: Vector2): (s: CoordinateSystem) => Vector2
} = internal.fromCartesian

export const mapAngle: {
  /**
   * Maps a chart-space angular coordinate to its on-screen angle in
   * radians, positive rotating `+x` toward `+y`. This is the angular half
   * of `toCartesian`: `(thetaOrigin + sign * theta) * (2*pi / period)`,
   * where `sign` is `+1` for a `'clockwise'` winding and `-1` for
   * `'counterclockwise'`.
   *
   * The result is not wrapped. A chart angle past one period keeps
   * accumulating turns, so differences of mapped angles are mapped
   * sweeps.
   *
   * Only a polar system has an angular axis, so the parameter narrows to
   * `Polar`; refine with `isPolar` first when holding the union.
   *
   * @param s - The polar system whose angular map to apply.
   * @param theta - The chart-space angular coordinate, in the unit of the
   *   system's `theta` axis.
   * @returns The on-screen angle in radians.
   * @since 2.0.0
   * @example
   * ```ts
   * // Rotate a tick label to its angular position (SVG rotate() wants
   * // degrees):
   * const angle = CoordinateSystem.mapAngle(system, 45)
   * const transform = `rotate(${(180 / Math.PI) * angle})`
   * ```
   */
  (s: Polar, theta: number): number
  /**
   * Maps a chart-space angular coordinate to its on-screen angle in
   * radians.
   *
   * @param theta - The chart-space angular coordinate, in the unit of the
   *   system's `theta` axis.
   * @returns A function that takes a polar system and returns the
   *   on-screen angle in radians.
   * @since 2.0.0
   */
  (theta: number): (s: Polar) => number
} = internal.mapAngleDual

export const mapRadius: {
  /**
   * Maps a chart-space radial coordinate to its on-screen distance from
   * the center through the system's radial dimension. This is the radial
   * half of `toCartesian`, and `r * scale + offset` on a `Linear` radius.
   *
   * The result can be negative when the map sends the chart radius below
   * zero. Point-mapping operations read a negative mapped radius as a
   * reflection through the center. Shape constructors like `arc` and
   * `sector` reject it.
   *
   * Only a polar system has a radial axis, so the parameter narrows to
   * `Polar`; refine with `isPolar` first when holding the union.
   *
   * @param s - The polar system whose radial map to apply.
   * @param r - The chart-space radial coordinate.
   * @returns The signed on-screen distance from the center.
   * @throws `Error` when the system's radius is `Logarithmic` and `r` is
   *   not positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // mapRadius maps positions, not lengths. A chart-space length maps
   * // through the difference, where the offset cancels:
   * const bandWidth =
   *   CoordinateSystem.mapRadius(system, 3.5) -
   *   CoordinateSystem.mapRadius(system, 3)
   * ```
   */
  (s: Polar, r: number): number
  /**
   * Maps a chart-space radial coordinate to its on-screen distance from
   * the center.
   *
   * @param r - The chart-space radial coordinate.
   * @returns A function that takes a polar system and returns the signed
   *   on-screen distance. It throws when the system's radius is
   *   `Logarithmic` and `r` is not positive.
   * @since 2.0.0
   */
  (r: number): (s: Polar) => number
} = internal.mapRadiusDual

export const arc: {
  /**
   * Constructs the exact cartesian image of the chart-space segment that
   * holds `r` fixed and runs `theta` from `theta.start` to `theta.end`.
   * On a polar system that image is a circular arc, built from rational
   * cubic segments of at most a quarter turn each, exact up to IEEE 754
   * rounding. On a cartesian system it is a single straight segment.
   *
   * `theta` is a structural bounds value, and direction matters:
   * `start > end` sweeps the other way. A sweep past one full period keeps
   * going around, tracing the circle more than once.
   *
   * @param s - The coordinate system.
   * @param theta - The angular span, in either order.
   * @param r - The fixed radial coordinate.
   * @returns The image as a `RationalCubicPath2d`.
   * @throws `Error` when an input is not finite, when the mapped radius is
   *   negative, or when the system's radius is `Logarithmic` and a chart radius is not
   *   positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // A quarter circle of radius 100 from 3 o'clock to 6 o'clock:
   * const path = CoordinateSystem.arc(
   *   CoordinateSystem.polar({ theta: Dimension.degrees }),
   *   { start: 0, end: 90 },
   *   100,
   * )
   * ```
   */
  (s: CoordinateSystem, theta: Bounds, r: number): RationalCubicPath2d
  /**
   * Constructs the exact cartesian image of a fixed-radius angular span.
   *
   * @param theta - The angular span, in either order.
   * @param r - The fixed radial coordinate.
   * @returns A function that takes a system and returns the image path.
   * @since 2.0.0
   */
  (theta: Bounds, r: number): (s: CoordinateSystem) => RationalCubicPath2d
} = internal.arc

export const ray: {
  /**
   * Constructs the exact cartesian image of the chart-space segment that
   * holds `theta` fixed and runs `r` from `r.start` to `r.end`. On a polar
   * system that image is a straight segment along the fixed direction.
   * The radial map is monotone, so the image is exactly the single
   * rational line segment between the mapped endpoints. Under a non-linear
   * radius the segment's parameter runs uniformly in mapped distance, not
   * in chart radius. On a cartesian system it is the vertical segment at
   * `x = theta`.
   *
   * Unlike `arc` and `sector`, negative mapped radii are allowed: a
   * negative mapped radius reflects through the center, the same
   * convention `toCartesian` applies, and a radial span whose mapped
   * radii change sign stays one straight segment passing through the
   * center. A zero-length span is constructible and degenerates to a
   * point segment.
   *
   * @param s - The coordinate system.
   * @param theta - The fixed angular coordinate.
   * @param r - The radial span, traced from `start` to `end`.
   * @returns The image as a `RationalCubicPath2d` of one segment.
   * @throws `Error` when an input is not finite, or when the system's
   *   radius is `Logarithmic` and a chart radius is not positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // A radial gridline from the hole to the rim at 3 o'clock:
   * const gridline = CoordinateSystem.ray(
   *   CoordinateSystem.polar({ theta: Dimension.degrees }),
   *   0,
   *   { start: 80, end: 120 },
   * )
   * ```
   */
  (s: CoordinateSystem, theta: number, r: Bounds): RationalCubicPath2d
  /**
   * Constructs the exact cartesian image of a fixed-angle radial span.
   *
   * @param theta - The fixed angular coordinate.
   * @param r - The radial span, traced from `start` to `end`.
   * @returns A function that takes a system and returns the image path.
   * @since 2.0.0
   */
  (theta: number, r: Bounds): (s: CoordinateSystem) => RationalCubicPath2d
} = internal.ray

export const sector: {
  /**
   * Constructs the exact cartesian image of the axis-aligned chart
   * rectangle `theta x r` as a single closed path. On a polar system that
   * image is an annular sector: the outer arc, a radial edge inward, the
   * inner arc swept back, and a radial edge out. On a cartesian system it
   * is the rectangle.
   *
   * Radii are normalized so the smaller mapped radius is the inner one.
   * Sweeps past one full period clamp to a full turn. Degenerate inputs
   * stay constructible: a zero sweep or zero radial width produces a slit
   * path, an inner radius of `0` produces a pie slice with no inner arc,
   * and a full-turn sweep produces a ring whose two radial edges coincide.
   * For SVG output of a full-turn ring use `sectorPathData`, which emits a
   * clean two-subpath annulus instead.
   *
   * @param s - The coordinate system.
   * @param theta - The angular span, in either order.
   * @param r - The radial span, in either order.
   * @returns The closed image as a `RationalCubicPath2d`.
   * @throws `Error` when an input is not finite, when a mapped radius is
   *   negative, or when the system's radius is `Logarithmic` and a chart radius is not
   *   positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // The image of a layout rect spanning 30..90 degrees, 80..120px:
   * const ring = CoordinateSystem.sector(
   *   CoordinateSystem.polar({ theta: Dimension.degrees }),
   *   { start: 30, end: 90 },
   *   { start: 80, end: 120 },
   * )
   * ```
   */
  (s: CoordinateSystem, theta: Bounds, r: Bounds): RationalCubicPath2d
  /**
   * Constructs the exact cartesian image of an axis-aligned chart
   * rectangle.
   *
   * @param theta - The angular span, in either order.
   * @param r - The radial span, in either order.
   * @returns A function that takes a system and returns the closed image
   *   path.
   * @since 2.0.0
   */
  (theta: Bounds, r: Bounds): (s: CoordinateSystem) => RationalCubicPath2d
} = internal.sector

export const containsPoint: {
  /**
   * Checks whether a cartesian point lies inside the image of the
   * axis-aligned chart rectangle `theta x r` — the same region `sector`
   * constructs. The point is converted with `fromCartesian` and tested
   * per axis: the angular test follows `Dimension.containsApprox`
   * (directed sweep, band `EPSILON * period`), and the radial and
   * cartesian-rectangle tests treat a coordinate coincident with an edge
   * as inside, so boundary verdicts hold at any data magnitude.
   *
   * At the exact center the angle is degenerate and the radial test alone
   * decides: the center belongs to a sector exactly when the sector
   * reaches mapped radius `0`.
   *
   * @param s - The coordinate system.
   * @param theta - The angular span, directed like `sector`'s.
   * @param r - The radial span, in either order.
   * @param point - The cartesian point to test.
   * @returns `true` if the point is inside the sector, `false` otherwise.
   * @throws `Error` when a bound is not finite.
   * @since 2.0.0
   * @example
   * ```ts
   * // Pointer hit-testing a ring segment:
   * CoordinateSystem.containsPoint(
   *   system,
   *   { start: 30, end: 90 },
   *   { start: 80, end: 120 },
   *   Vector2.make(pointerX, pointerY),
   * )
   * ```
   */
  (s: CoordinateSystem, theta: Bounds, r: Bounds, point: Vector2): boolean
  /**
   * Checks whether a cartesian point lies inside the image of an
   * axis-aligned chart rectangle.
   *
   * @param theta - The angular span, directed like `sector`'s.
   * @param r - The radial span, in either order.
   * @param point - The cartesian point to test.
   * @returns A function that takes a system and returns whether the point
   *   is inside.
   * @since 2.0.0
   */
  (theta: Bounds, r: Bounds, point: Vector2): (s: CoordinateSystem) => boolean
} = internal.containsPoint

export const image: {
  /**
   * Constructs the cartesian image of an arbitrary chart-space path,
   * accurate to within `tolerance`. On a polar system the map is nonlinear
   * and the true image is transcendental — a straight chart segment images
   * to an Archimedean spiral — so no cubic path equals it exactly. The
   * result is certified to a symmetric Hausdorff bound: every point of the
   * true image lies within `tolerance` of the output, and every point of
   * the output lies within `tolerance` of the true image, verified by
   * subdivision enclosures rather than point samples (see `PRECISION.md`).
   *
   * The path may be polynomial or rational. A rational path lets shapes
   * with exact rational forms enter chart space, like an ellipse lowered
   * with `Arc.toPath`. On a cartesian system a polynomial path comes back
   * unchanged and a rational one is approximated to the same bound with
   * `RationalCubicPath2d.approximateAsCubicPath`.
   *
   * The path is read pointwise like `toCartesian`: each point `(x, y)` as
   * `(theta, r)`, a negative mapped radius reflecting through the center.
   * A path crossing mapped radius `0` images straight through the center;
   * the bound holds there at the cost of more segments nearby. Sweeps past
   * one full period keep going around, like `arc`. Emitted segments start
   * and end exactly on the true image, so a continuous input's output
   * junctions close; reassert the brand with `CubicPath2d.asContinuous`
   * where needed.
   *
   * Every radial dimension kind is supported. A `Power` radius below
   * exponent 1 has infinite slope at chart radius `0`, which costs extra
   * segments near the center without loosening the bound. A `Logarithmic`
   * radius requires the path to stay at positive chart radii.
   *
   * For axis-aligned chart shapes prefer `arc` and `sector`, whose images
   * are exact. For SVG output pass the result to `CubicPath2d.toPathData`.
   * Certification cost grows roughly with the ratio of the image's size to
   * `tolerance`, so pixel-scale tolerances for screen output are the
   * intended regime; vanishingly small tolerances get expensive before
   * they get wrong.
   *
   * @param s - The coordinate system.
   * @param path - The chart-space path, polynomial or rational, each
   *   point read as `(theta, r)`. A rational path's Bernstein weights
   *   must all be positive, which every path `Arc.toPath` builds
   *   satisfies.
   * @param tolerance - Maximum allowed Hausdorff distance, in cartesian
   *   output units. Must be positive.
   * @returns The image as a `CubicPath2d` within `tolerance` of the true
   *   image.
   * @throws `Error` when `tolerance` is not a positive finite number, when
   *   a rational path has a weight that is not positive, or when the
   *   system's radius is `Logarithmic` and the path reaches a chart radius
   *   that is not positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // The polar image of a rising chart-space line is an Archimedean
   * // spiral; approximate to a quarter pixel and emit SVG:
   * const system = CoordinateSystem.polar({ theta: Dimension.turns })
   * const chartPath = Bezier2d.toPath(Bezier2d.make(
   *   Vector2.make(0, 0),
   *   Vector2.make(1, 40),
   *   Vector2.make(2, 80),
   *   Vector2.make(3, 120),
   * ))
   * const d = CubicPath2d.toPathData(
   *   CoordinateSystem.image(system, chartPath, 0.25),
   * )
   *
   * // The ellipse inscribed in the chart rect theta in [0, 0.25], r in [80, 120]:
   * const node = Arc.elliptical({
   *   center: Vector2.make(0.125, 100),
   *   radiusX: 0.125,
   *   radiusY: 20,
   * })
   * const blob = CoordinateSystem.image(system, Arc.toPath(node), 0.25)
   * ```
   */
  (s: CoordinateSystem, path: CubicPath2d | RationalCubicPath2d, tolerance: number): CubicPath2d
  /**
   * Constructs the cartesian image of an arbitrary chart-space path.
   *
   * @param path - The chart-space path, polynomial or rational, each
   *   point read as `(theta, r)`. A rational path's Bernstein weights
   *   must all be positive.
   * @param tolerance - Maximum allowed Hausdorff distance, in cartesian
   *   output units. Must be positive.
   * @returns A function that takes a system and returns the image path,
   *   certified to `tolerance`.
   * @since 2.0.0
   */
  (path: CubicPath2d | RationalCubicPath2d, tolerance: number): (s: CoordinateSystem) => CubicPath2d
} = internal.image

export const arcPathData: {
  /**
   * Emits exact SVG path data for the same shape `arc` constructs, using
   * `A` commands computed from the chart description. Pieces stay at or
   * under a half turn, so the large-arc flag is always `0`; the sweep flag
   * is `1` for a positive mapped sweep, which renders clockwise in an SVG
   * viewport's y-down coordinates.
   *
   * Degenerate contracts:
   * - zero sweep, or mapped radius `0`: an `M` command alone, which
   *   renders nothing
   * - a full-period sweep: the circle as two half-turn `A` commands,
   *   closing on the exact starting coordinates
   * - a sweep past one period: clamped to one full circle
   *
   * @param s - The coordinate system.
   * @param theta - The angular span, in either order.
   * @param r - The fixed radial coordinate.
   * @returns The SVG path data string.
   * @throws `Error` when an input is not finite, when the mapped radius is
   *   negative, or when the system's radius is `Logarithmic` and a chart radius is not
   *   positive.
   * @since 2.0.0
   */
  (s: CoordinateSystem, theta: Bounds, r: number): string
  /**
   * Emits exact SVG path data for a fixed-radius angular span.
   *
   * @param theta - The angular span, in either order.
   * @param r - The fixed radial coordinate.
   * @returns A function that takes a system and returns the path data.
   * @since 2.0.0
   */
  (theta: Bounds, r: number): (s: CoordinateSystem) => string
} = internal.arcPathData

export const rayPathData: {
  /**
   * Emits exact SVG path data for the same segment `ray` constructs: an
   * `M` to the mapped start of the radial span and an `L` to its mapped
   * end. Negative mapped radii follow `ray`'s reflection convention.
   *
   * Degenerate contract: a zero-length radial span (`r.start === r.end`)
   * emits an `M` command alone, which renders nothing.
   *
   * @param s - The coordinate system.
   * @param theta - The fixed angular coordinate.
   * @param r - The radial span, traced from `start` to `end`.
   * @returns The SVG path data string.
   * @throws `Error` when an input is not finite, or when the system's
   *   radius is `Logarithmic` and a chart radius is not positive.
   * @since 2.0.0
   */
  (s: CoordinateSystem, theta: number, r: Bounds): string
  /**
   * Emits exact SVG path data for a fixed-angle radial span.
   *
   * @param theta - The fixed angular coordinate.
   * @param r - The radial span, traced from `start` to `end`.
   * @returns A function that takes a system and returns the path data.
   * @since 2.0.0
   */
  (theta: number, r: Bounds): (s: CoordinateSystem) => string
} = internal.rayPathData

export const sectorPathData: {
  /**
   * Emits exact SVG path data for the same shape `sector` constructs,
   * using `A` commands computed from the chart description.
   *
   * Degenerate contracts:
   * - zero sweep: a radial slit, `M`, `L`, `Z`
   * - zero radial width: the arc followed by `Z`
   * - inner radius `0`: a pie slice closed through the center
   * - a full-period sweep: an annulus as two opposite-winding subpaths,
   *   which fills with a hole under both the `nonzero` default and
   *   `evenodd`; with inner radius `0` it collapses to one disc subpath
   * - a sweep past one period: clamped to a full turn
   *
   * @param s - The coordinate system.
   * @param theta - The angular span, in either order.
   * @param r - The radial span, in either order.
   * @returns The SVG path data string.
   * @throws `Error` when an input is not finite, when a mapped radius is
   *   negative, or when the system's radius is `Logarithmic` and a chart radius is not
   *   positive.
   * @since 2.0.0
   * @example
   * ```ts
   * // d attribute for a ring segment, ready for <path d={...}>:
   * const d = CoordinateSystem.sectorPathData(
   *   CoordinateSystem.polar({ theta: Dimension.turns }),
   *   { start: 0, end: 0.25 },
   *   { start: 80, end: 120 },
   * )
   * ```
   */
  (s: CoordinateSystem, theta: Bounds, r: Bounds): string
  /**
   * Emits exact SVG path data for an axis-aligned chart rectangle.
   *
   * @param theta - The angular span, in either order.
   * @param r - The radial span, in either order.
   * @returns A function that takes a system and returns the path data.
   * @since 2.0.0
   */
  (theta: Bounds, r: Bounds): (s: CoordinateSystem) => string
} = internal.sectorPathData
