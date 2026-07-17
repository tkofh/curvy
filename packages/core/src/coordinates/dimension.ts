import type { Bounds } from '../interval/interval.ts'
import type { Pipeable } from '../utils.ts'
import * as internal from './dimension.internal.ts'
import type { DimensionTypeId } from './dimension.internal.ts'

/**
 * Describes the structure of a single chart-space axis: `Linear` for an
 * ordinary number line, optionally scaled and offset, or `Cyclical` for an
 * axis whose values wrap modulo a period, like an angle or a hue.
 *
 * Every operation in this module accepts the full union and treats the
 * linear case as the trivial branch, so per-axis code never needs to
 * discriminate before calling.
 *
 * @since 2.0.0
 */
export type Dimension = Linear | Cyclical

/**
 * An ordinary number-line axis carrying the affine map
 * `x * scale + offset`. Use it to describe unit conversions, like
 * mapping a radial axis measured in `em` units onto pixels.
 *
 * @since 2.0.0
 */
export interface Linear extends Pipeable {
  readonly [DimensionTypeId]: DimensionTypeId
  readonly kind: 'linear'
  /**
   * The multiplicative coefficient of the axis map. Never zero.
   */
  readonly scale: number
  /**
   * The additive coefficient of the axis map.
   */
  readonly offset: number
}

/**
 * An axis whose values are identified modulo `period`: `x` and
 * `x + period` name the same position. Angles and hue live on cyclical
 * axes. The angular unit is the period itself — see the `radians`,
 * `degrees`, and `turns` constants.
 *
 * @since 2.0.0
 */
export interface Cyclical extends Pipeable {
  readonly [DimensionTypeId]: DimensionTypeId
  readonly kind: 'cyclical'
  /**
   * The length of one full cycle. Always positive and finite.
   */
  readonly period: number
}

/**
 * Checks if a value is a `Dimension`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is a `Dimension`, `false` otherwise.
 * @since 2.0.0
 */
export const isDimension: (v: unknown) => v is Dimension = internal.isDimension

/**
 * Checks if a `Dimension` is `Linear`.
 *
 * @param d - The dimension to check.
 * @returns `true` if the dimension is `Linear`, `false` otherwise.
 * @since 2.0.0
 */
export const isLinear: (d: Dimension) => d is Linear = internal.isLinear

/**
 * Checks if a `Dimension` is `Cyclical`.
 *
 * @param d - The dimension to check.
 * @returns `true` if the dimension is `Cyclical`, `false` otherwise.
 * @since 2.0.0
 */
export const isCyclical: (d: Dimension) => d is Cyclical = internal.isCyclical

/**
 * Creates a `Linear` dimension with the axis map `x * scale + offset`.
 * With no arguments this is the identity axis.
 *
 * @param scale - The multiplicative coefficient. Defaults to `1`.
 * @param offset - The additive coefficient. Defaults to `0`.
 * @returns A new `Linear` dimension.
 * @throws `Error` when `scale` is zero or not finite, or when `offset` is
 *   not finite.
 * @since 2.0.0
 */
export const linear: (scale?: number, offset?: number) => Linear = internal.linear

/**
 * Creates a `Cyclical` dimension whose values wrap modulo `period`.
 *
 * @param period - The length of one full cycle. Must be positive and finite.
 * @returns A new `Cyclical` dimension.
 * @throws `Error` when `period` is not positive and finite.
 * @since 2.0.0
 */
export const cyclical: (period: number) => Cyclical = internal.cyclical

/**
 * The identity `Linear` dimension, `linear(1, 0)`.
 *
 * @since 2.0.0
 */
export const identity: Linear = internal.identity

/**
 * A `Cyclical` dimension with period `2 * pi`: angles in radians.
 *
 * @since 2.0.0
 */
export const radians: Cyclical = internal.radians

/**
 * A `Cyclical` dimension with period `360`: angles in degrees, and hue in
 * its usual `[0, 360)` form.
 *
 * @since 2.0.0
 */
export const degrees: Cyclical = internal.degrees

/**
 * A `Cyclical` dimension with period `1`: whole turns, and hue in its
 * normalized `[0, 1)` form.
 *
 * @since 2.0.0
 */
export const turns: Cyclical = internal.turns

export const equals: {
  /**
   * Checks two `Dimension` values for equality: the kinds match and the
   * corresponding fields agree within the tolerance of `coincident` from
   * `curvy/number`.
   *
   * This compares the axis descriptions themselves. To ask whether two
   * coordinates name the same position on an axis, use `congruent`.
   *
   * @param a - The first dimension.
   * @param b - The second dimension.
   * @returns `true` if the dimensions are equal, `false` otherwise.
   * @since 2.0.0
   */
  (a: Dimension, b: Dimension): boolean
  /**
   * Checks two `Dimension` values for equality.
   *
   * @param b - The dimension to compare against.
   * @returns A function that takes a dimension and returns whether the two
   *   are equal.
   * @since 2.0.0
   */
  (b: Dimension): (a: Dimension) => boolean
} = internal.equals

export const wrap: {
  /**
   * Canonicalizes a coordinate on the axis. On a cyclical axis the result
   * is the representative in `[0, period)`, computed with a floored
   * modulo, so negative inputs wrap upward. On a linear axis the value is
   * returned unchanged.
   *
   * @param d - The axis the value lives on.
   * @param value - The coordinate to canonicalize.
   * @returns The canonical representative of `value`.
   * @since 2.0.0
   */
  (d: Dimension, value: number): number
  /**
   * Canonicalizes a coordinate on the axis.
   *
   * @param value - The coordinate to canonicalize.
   * @returns A function that takes a dimension and returns the canonical
   *   representative.
   * @since 2.0.0
   */
  (value: number): (d: Dimension) => number
} = internal.wrap

export const delta: {
  /**
   * Computes the shortest signed difference from `a` to `b`. On a cyclical
   * axis the result lands in `(-period/2, period/2]`, and an exact
   * antipodal pair resolves to `+period/2` regardless of argument order.
   * On a linear axis the result is plain `b - a`.
   *
   * Representatives whole periods apart are handled: only the wrapped
   * positions matter.
   *
   * @param d - The axis the values live on.
   * @param a - The starting coordinate.
   * @param b - The ending coordinate.
   * @returns The shortest signed difference from `a` to `b`.
   * @since 2.0.0
   * @example
   * ```ts
   * // 20 degrees forward across the 360/0 seam, not 340 back:
   * Dimension.delta(Dimension.degrees, 350, 10) // 20
   * ```
   */
  (d: Dimension, a: number, b: number): number
  /**
   * Computes the shortest signed difference from `a` to `b`.
   *
   * @param a - The starting coordinate.
   * @param b - The ending coordinate.
   * @returns A function that takes a dimension and returns the shortest
   *   signed difference.
   * @since 2.0.0
   */
  (a: number, b: number): (d: Dimension) => number
} = internal.delta

export const congruent: {
  /**
   * Checks whether two coordinates name the same position on the axis. On
   * a cyclical axis the shortest wrapped difference is compared against a
   * band of `EPSILON * period`, so `2 * Math.PI - 1e-16` is congruent to
   * `0` under `radians`, and representatives whole periods apart agree
   * whenever their wrapped positions do. On a linear axis this is
   * `coincident` from `curvy/number`.
   *
   * Like `coincident`, the comparison is not transitive. See `PRECISION.md`
   * for the tolerance model.
   *
   * @param d - The axis the values live on.
   * @param a - The first coordinate.
   * @param b - The second coordinate.
   * @returns `true` if the coordinates name the same position, `false`
   *   otherwise.
   * @since 2.0.0
   */
  (d: Dimension, a: number, b: number): boolean
  /**
   * Checks whether two coordinates name the same position on the axis.
   *
   * @param a - The first coordinate.
   * @param b - The second coordinate.
   * @returns A function that takes a dimension and returns whether the
   *   coordinates name the same position.
   * @since 2.0.0
   */
  (a: number, b: number): (d: Dimension) => boolean
} = internal.congruent

export const contains: {
  /**
   * Checks whether a coordinate lies on the span `bounds`. On a cyclical
   * axis the span is a directed sweep, exactly as `CoordinateSystem.arc`
   * reads it: the sign of `end - start` picks the direction, a wrap
   * crossing is written by going past the period (`{ start: 350, end:
   * 370 }` covers the 20 degrees across the seam), and a sweep of a whole
   * period or more covers the entire axis. On a linear axis the span is
   * undirected and this is a plain min/max range check.
   *
   * Edges are exact. For tolerant edges use `containsApprox`.
   *
   * @param d - The axis the values live on.
   * @param bounds - The span, directed on cyclical axes.
   * @param value - The coordinate to test.
   * @returns `true` if the coordinate lies on the span, `false` otherwise.
   * @since 2.0.0
   */
  (d: Dimension, bounds: Bounds, value: number): boolean
  /**
   * Checks whether a coordinate lies on the span `bounds`.
   *
   * @param bounds - The span, directed on cyclical axes.
   * @param value - The coordinate to test.
   * @returns A function that takes a dimension and returns whether the
   *   coordinate lies on the span.
   * @since 2.0.0
   */
  (bounds: Bounds, value: number): (d: Dimension) => boolean
} = internal.contains

/**
 * Checks whether a coordinate lies on the span `bounds`, widening both
 * edges by `eps`. The span semantics are those of `contains`: directed
 * sweeps on cyclical axes, min/max ranges on linear ones.
 *
 * @param d - The axis the values live on.
 * @param bounds - The span, directed on cyclical axes.
 * @param value - The coordinate to test.
 * @param eps - The edge tolerance. Defaults to `EPSILON * period` on a
 *   cyclical axis and plain `EPSILON` (from `curvy/number`) on a linear
 *   one.
 * @returns `true` if the coordinate lies within `eps` of the span,
 *   `false` otherwise.
 * @since 2.0.0
 */
export const containsApprox: (
  d: Dimension,
  bounds: Bounds,
  value: number,
  eps?: number,
) => boolean = internal.containsApprox

export const unwrap: {
  /**
   * Lifts a sequence of cyclical coordinates to the covering space: the
   * first element is preserved as given, and each subsequent element is
   * shifted by whole periods so that consecutive differences are shortest
   * signed arcs. The lifted sequence interpolates without seam jumps —
   * this is the preprocessing step before splining through angles or hue.
   * Wrap sampled outputs back with `wrap`.
   *
   * On a linear axis, or when the input has fewer than two elements, the
   * input array is returned as-is.
   *
   * @param d - The axis the values live on.
   * @param values - The coordinate sequence to lift.
   * @returns The lifted sequence, same length as the input.
   * @since 2.0.0
   * @example
   * ```ts
   * // Hue keyframes crossing the seam lift to a monotone ramp:
   * Dimension.unwrap(Dimension.degrees, [350, 5, 20]) // [350, 365, 380]
   * ```
   */
  (d: Dimension, values: ReadonlyArray<number>): ReadonlyArray<number>
  /**
   * Lifts a sequence of cyclical coordinates to the covering space.
   *
   * @param values - The coordinate sequence to lift.
   * @returns A function that takes a dimension and returns the lifted
   *   sequence.
   * @since 2.0.0
   */
  (values: ReadonlyArray<number>): (d: Dimension) => ReadonlyArray<number>
} = internal.unwrap

export const lerp: {
  /**
   * Interpolates between two coordinates on the axis. On a cyclical axis
   * the interpolation runs along the shortest arc from `a` to `b`, and the
   * result is canonicalized to `[0, period)`; `t` outside `[0, 1]`
   * extrapolates along that same arc. On a linear axis this is the plain
   * affine interpolation `(1 - t) * a + t * b`, neither wrapped nor
   * clamped.
   *
   * @param d - The axis the values live on.
   * @param a - The coordinate at `t = 0`.
   * @param b - The coordinate at `t = 1`.
   * @param t - The interpolation parameter.
   * @returns The interpolated coordinate.
   * @since 2.0.0
   * @example
   * ```ts
   * // Halfway from 350 to 10 degrees is 0, the short way around:
   * Dimension.lerp(Dimension.degrees, 350, 10, 0.5) // 0
   * ```
   */
  (d: Dimension, a: number, b: number, t: number): number
  /**
   * Interpolates between two coordinates on the axis.
   *
   * @param a - The coordinate at `t = 0`.
   * @param b - The coordinate at `t = 1`.
   * @param t - The interpolation parameter.
   * @returns A function that takes a dimension and returns the
   *   interpolated coordinate.
   * @since 2.0.0
   */
  (a: number, b: number, t: number): (d: Dimension) => number
} = internal.lerp
