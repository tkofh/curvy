import type { Bounds } from '../interval/interval.ts'
import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type { Pipeable } from '../utils.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './coordinateSystem.internal.ts'
import type { Cyclical, Linear } from './dimension.ts'

/**
 * A chart map from a two-axis chart space onto the cartesian plane:
 * `Cartesian` is the identity, and `Polar` reads chart points as
 * `(theta, r)` around a center. Layout code positions rectangles in chart
 * space; the system converts points with `toCartesian` and constructs the
 * exact cartesian images of chart-aligned shapes with `arc` and `sector`.
 *
 * The polar map is nonlinear, so it does not commute with control-point
 * mapping: converting a curve's control points with `toCartesian` produces
 * the wrong curve. Convert points pointwise, and convert shapes with the
 * shape constructors.
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
 * shape constructors still work — `arc` is a horizontal segment and
 * `sector` is an axis-aligned rectangle — so code driving a
 * `CoordinateSystem` never branches on kind.
 *
 * @since 2.0.0
 */
export interface Cartesian extends Pipeable {
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
export interface Polar extends Pipeable {
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
   * The radial axis map: mapped radius is `r * scale + offset`. An offset
   * shifts chart radius `0` outward, which puts an inner hole under a
   * chart that starts at `r = 0`.
   */
  readonly radius: Linear
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
   * The radial axis map applied to chart radii. Defaults to
   * `Dimension.identity`.
   */
  readonly radius?: Linear
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
 * @param config - Center, angular axis, winding, and radial map. All
 *   optional; see `PolarConfig` for the defaults.
 * @returns A new `Polar` system.
 * @since 2.0.0
 * @example
 * ```ts
 * // Degrees around (200, 200), with a 40px hole under chart radius 0:
 * const system = CoordinateSystem.polar({
 *   center: Vector2.make(200, 200),
 *   theta: Dimension.degrees,
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
   * The arithmetic is exact IEEE 754 trig with no rounding or snapping;
   * see `PRECISION.md`.
   *
   * @param s - The coordinate system.
   * @param point - The chart-space point.
   * @returns The cartesian image of the point.
   * @since 2.0.0
   */
  (s: CoordinateSystem, point: Vector2): Vector2
  /**
   * Maps a chart-space point onto the cartesian plane.
   *
   * @param point - The chart-space point.
   * @returns A function that takes a system and returns the cartesian
   *   image.
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
   * Round-trips with `toCartesian` up to angle wrapping: a chart angle
   * comes back as its canonical representative, and a negative chart
   * radius comes back positive with the angle turned half a period.
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
   * @throws `Error` when an input is not finite, or when the mapped radius
   *   is negative.
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
   * @throws `Error` when an input is not finite, or when a mapped radius
   *   is negative.
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
   * @throws `Error` when an input is not finite, or when the mapped radius
   *   is negative.
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
   * @throws `Error` when an input is not finite, or when a mapped radius
   *   is negative.
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
