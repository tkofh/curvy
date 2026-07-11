import * as internal from './interval.internal.ts'
import type { Pipeable } from '../utils.ts'

/**
 * A `start`/`end` pair carrying no endpoint-inclusivity information: the
 * structural counterpart of `Interval`. Any value with numeric `start` and
 * `end` fields satisfies it, in any order — unlike `Interval`, nothing
 * enforces `start <= end`.
 *
 * Operations that never read inclusivity (e.g. `lerp`, `normalize`,
 * `remap`, `size`) accept `Bounds`.
 *
 * @since 2.0.0
 */
export interface Bounds {
  /**
   * The start of the range. On a branded `Interval` the constructors
   * enforce `start <= end`. A structural `Bounds` may hold its endpoints
   * in either order.
   */
  readonly start: number
  /**
   * The end of the range. On a branded `Interval` the constructors
   * enforce `start <= end`. A structural `Bounds` may hold its endpoints
   * in either order.
   */
  readonly end: number
}

/**
 * A mathematical interval. Discriminated union of four variants by endpoint
 * inclusivity: `Closed`, `OpenStart`, `OpenEnd`, `Open`. Operations that
 * depend on inclusivity (e.g. `contains`, `filter`, `equals`) dispatch on
 * the `kind` field. Operations that don't read inclusivity accept the
 * broader `Bounds` type.
 *
 * `start <= end` always holds. The constructors enforce it. All fields are
 * readonly. No operation mutates an interval. Operations return new
 * instances, except that a conversion to a kind the input already has may
 * return the input itself.
 *
 * @since 1.0.0
 */
export type Interval = Closed | OpenStart | OpenEnd | Open

/**
 * `[start, end]`: both endpoints included.
 *
 * @since 2.0.0
 */
export interface Closed extends Pipeable, Bounds {
  readonly kind: 'closed'
}

/**
 * `(start, end]`: start excluded, end included.
 *
 * @since 2.0.0
 */
export interface OpenStart extends Pipeable, Bounds {
  readonly kind: 'open-start'
}

/**
 * `[start, end)`: start included, end excluded.
 *
 * @since 2.0.0
 */
export interface OpenEnd extends Pipeable, Bounds {
  readonly kind: 'open-end'
}

/**
 * `(start, end)`: both endpoints excluded.
 *
 * @since 2.0.0
 */
export interface Open extends Pipeable, Bounds {
  readonly kind: 'open'
}

/**
 * Checks if a value is an `Interval`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. A structural `{ start, end }` object is `Bounds`, not an
 * `Interval`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Interval`, `false` otherwise.
 * @since 1.0.0
 */
export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const equals: {
  /**
   * Checks if two `Interval` instances are approximately equal.
   *
   * Both endpoints and the kind must match: a `Closed` and an `OpenStart`
   * with the same numeric endpoints are not equal. Use `aligned` for the
   * looser "same numeric range" check.
   *
   * Endpoints are compared with `coincident` from `curvy/number`, an
   * absolute-plus-relative tolerance band. See `PRECISION.md` for the
   * mechanics.
   *
   * @param a - The first interval.
   * @param b - The second interval.
   * @returns `true` when both intervals share a kind and both endpoints are within tolerance.
   * @since 2.0.0
   */
  (a: Interval, b: Interval): boolean
  /**
   * Checks if two `Interval` instances are approximately equal.
   *
   * @param b - The second interval.
   * @returns A function that takes the first interval and returns the comparison result.
   * @since 2.0.0
   */
  (b: Interval): (a: Interval) => boolean
} = internal.equals

export const aligned: {
  /**
   * Checks if two values share the same numeric range, ignoring endpoint
   * inclusivity. Accepts any `Bounds`-shaped value.
   *
   * Endpoints are compared with `coincident` from `curvy/number`, an
   * absolute-plus-relative tolerance band. See `PRECISION.md` for the
   * mechanics.
   *
   * @param a - The first bounds.
   * @param b - The second bounds.
   * @returns `true` when both endpoints are within tolerance.
   * @since 2.0.0
   */
  (a: Bounds, b: Bounds): boolean
  /**
   * Checks if two values share the same numeric range, ignoring endpoint
   * inclusivity.
   *
   * @param b - The second bounds.
   * @returns A function that takes the first bounds and returns the comparison result.
   * @since 2.0.0
   */
  (b: Bounds): (a: Bounds) => boolean
} = internal.aligned

export const make: {
  /**
   * Creates a new closed `Interval` instance.
   *
   * @param point - The point of the interval.
   * @returns A new `Closed` interval `[point, point]`.
   * @since 1.0.0
   */
  (point: number): Closed
  /**
   * Creates a new closed `Interval` instance.
   *
   * @param start - The start of the interval.
   * @param end - The end of the interval. Must be at least `start`.
   * @returns A new `Closed` interval `[start, end]`.
   * @throws `Error` when `end < start`.
   * @since 1.0.0
   */
  (start: number, end: number): Closed
} = internal.make

export const makeOpenStart: {
  /**
   * Creates a new left-open `Interval` instance.
   *
   * @param point - The point of the interval.
   * @returns A new `OpenStart` interval `(point, point]` (degenerate, empty).
   * @since 2.0.0
   */
  (point: number): OpenStart
  /**
   * Creates a new left-open `Interval` instance.
   *
   * @param start - The start of the interval (excluded).
   * @param end - The end of the interval (included). Must be at least `start`.
   * @returns A new `OpenStart` interval `(start, end]`.
   * @throws `Error` when `end < start`.
   * @since 2.0.0
   */
  (start: number, end: number): OpenStart
} = internal.makeOpenStart

export const makeOpenEnd: {
  /**
   * Creates a new right-open `Interval` instance.
   *
   * @param point - The point of the interval.
   * @returns A new `OpenEnd` interval `[point, point)` (degenerate, empty).
   * @since 2.0.0
   */
  (point: number): OpenEnd
  /**
   * Creates a new right-open `Interval` instance.
   *
   * @param start - The start of the interval (included).
   * @param end - The end of the interval (excluded). Must be at least `start`.
   * @returns A new `OpenEnd` interval `[start, end)`.
   * @throws `Error` when `end < start`.
   * @since 2.0.0
   */
  (start: number, end: number): OpenEnd
} = internal.makeOpenEnd

export const makeOpen: {
  /**
   * Creates a new fully open `Interval` instance.
   *
   * @param point - The point of the interval.
   * @returns A new `Open` interval `(point, point)` (degenerate, empty).
   * @since 2.0.0
   */
  (point: number): Open
  /**
   * Creates a new fully open `Interval` instance.
   *
   * @param start - The start of the interval (excluded).
   * @param end - The end of the interval (excluded). Must be at least `start`.
   * @returns A new `Open` interval `(start, end)`.
   * @throws `Error` when `end < start`.
   * @since 2.0.0
   */
  (start: number, end: number): Open
} = internal.makeOpen

export const fromSize: {
  /**
   * Creates a new closed `Interval` instance from a size.
   *
   * @param size - The size of the interval. Must be non-negative.
   * @returns A new `Closed` interval `[0, size]`.
   * @throws `Error` when `size` is negative.
   * @since 1.0.0
   */
  (size: number): Closed
  /**
   * Creates a new closed `Interval` instance from a size.
   *
   * @param start - The start of the interval.
   * @param size - The size of the interval. Must be non-negative.
   * @returns A new `Closed` interval `[start, start + size]`.
   * @throws `Error` when `size` is negative.
   * @since 1.0.0
   */
  (start: number, size: number): Closed
} = internal.fromSize

/**
 * Creates a new closed `Interval` from a minimum and maximum value, in any order.
 *
 * @param values - The values to take the min and max of. At least one is required.
 * @returns A new `Closed` interval `[min(values), max(values)]`.
 * @throws `Error` when called with no values.
 * @since 1.0.0
 */
export const fromMinMax: (...values: ReadonlyArray<number>) => Closed = internal.fromMinMax

/**
 * Calculates the size of an interval.
 *
 * Kind-agnostic: `size` of `[0, 1]` and `(0, 1)` are both `1`.
 *
 * @param i - The bounds to calculate the size of.
 * @returns The absolute difference `|end - start|`. Never negative, even for reversed structural `Bounds`.
 * @since 1.0.0
 */
export const size: (i: Bounds) => number = internal.size

export const contains: {
  /**
   * Checks if a value is contained within an interval. Endpoint inclusivity
   * follows the interval's `kind`.
   *
   * @param interval - The interval to check.
   * @param value - The value to check.
   * @returns `true` if the value is contained within the interval, `false` otherwise.
   * @since 1.0.0
   */
  (interval: Interval, value: number): boolean
  /**
   * Checks if a value is contained within an interval. Endpoint inclusivity
   * follows the interval's `kind`.
   *
   * @param value - The value to check.
   * @returns A function that takes an interval and returns `true` if the value is contained within the interval, `false` otherwise.
   * @since 1.0.0
   */
  (value: number): (interval: Interval) => boolean
} = internal.contains

/**
 * Float-tolerant containment: returns `true` if `value` is in the interval or
 * within `eps` of either boundary. Endpoint inclusivity is ignored — at the
 * `EPSILON` scale the open/closed distinction loses meaning, and the use case
 * is "is this query approximately in this range, accounting for float drift?".
 * Use `contains` if you need kind-strict semantics.
 *
 * @param interval - The interval to check against.
 * @param value - The value to check.
 * @param eps - The absolute tolerance. Defaults to `EPSILON` from `curvy/number`.
 * @returns `true` when `interval.start - eps <= value <= interval.end + eps`.
 * @since 2.0.0
 */
export const containsApprox: (interval: Interval, value: number, eps?: number) => boolean =
  internal.containsApprox

export const containsInterval: {
  /**
   * Checks if `inner` is a subset of `outer`: every point of `inner` is
   * also in `outer`.
   *
   * Respects endpoint inclusivity on both sides. A closed inner endpoint
   * must lie inside the outer or on one of its closed boundaries. An open
   * inner endpoint may also sit exactly on an open outer boundary.
   * Endpoint comparisons are exact — no tolerance is applied.
   *
   * @param outer - The enclosing interval.
   * @param inner - The candidate inner interval.
   * @returns `true` when `inner` is a subset of `outer`.
   * @since 2.0.0
   */
  (outer: Interval, inner: Interval): boolean
  /**
   * Checks if the given interval is a subset of another.
   *
   * @param inner - The candidate inner interval.
   * @returns A function that takes the outer interval and returns the containment result.
   * @since 2.0.0
   */
  (inner: Interval): (outer: Interval) => boolean
} = internal.containsInterval

export const union: {
  /**
   * Returns the smallest interval enclosing both inputs. Each endpoint's
   * inclusivity follows the input that contributed it. When both endpoints
   * tie, the result is closed at that point if either input includes it.
   *
   * The enclosing hull, not a set union: disjoint inputs are bridged, gap
   * included.
   *
   * @param a - The first interval.
   * @param b - The second interval.
   * @returns A new interval enclosing both inputs.
   * @since 2.0.0
   */
  (a: Interval, b: Interval): Interval
  /**
   * Returns the smallest interval enclosing both inputs.
   *
   * @param b - The second interval.
   * @returns A function that takes the first interval and returns the union.
   * @since 2.0.0
   */
  (b: Interval): (a: Interval) => Interval
} = internal.union

export const filter: {
  /**
   * Filters an array of values to those contained within an interval.
   * Endpoint inclusivity follows the interval's `kind`.
   *
   * @param interval - The interval to filter the values to.
   * @param value - The values to filter.
   * @returns The values inside the interval. The static type mirrors the input array. The runtime array may be shorter.
   * @since 1.0.0
   */
  <V extends ReadonlyArray<number>>(interval: Interval, value: V): V
  /**
   * Filters an array of values to those contained within an interval.
   *
   * @param value - The values to filter.
   * @returns A function that takes an interval and returns the filtered values.
   * @since 1.0.0
   */
  <V extends ReadonlyArray<number>>(value: V): (interval: Interval) => V
} = internal.filter

export const clamp: {
  /**
   * Clamps a value to be within bounds. Kind-agnostic: clamps to the
   * numeric range regardless of endpoint inclusivity. Assumes
   * `start <= end` (structural `Bounds` do not enforce it).
   *
   * @param interval - The bounds to clamp the value to.
   * @param value - The value to clamp.
   * @returns The clamped value.
   * @since 1.0.0
   */
  (interval: Bounds, value: number): number
  /**
   * Clamps a value to be within bounds. Kind-agnostic.
   *
   * @param value - The value to clamp.
   * @returns A function that takes bounds and returns the clamped value.
   * @since 1.0.0
   */
  (value: number): (interval: Bounds) => number
  /**
   * Clamps an array of values to be within bounds. Kind-agnostic.
   *
   * @param interval - The bounds to clamp the values to.
   * @param value - The values to clamp.
   * @returns The clamped values.
   * @since 1.0.0
   */
  (interval: Bounds, value: ReadonlyArray<number>): ReadonlyArray<number>
  /**
   * Clamps an array of values to be within bounds. Kind-agnostic.
   *
   * @param value - The values to clamp.
   * @returns A function that takes bounds and returns the clamped values.
   * @since 1.0.0
   */
  (value: ReadonlyArray<number>): (interval: Bounds) => ReadonlyArray<number>
} = internal.clamp

/**
 * Returns an interval with the start endpoint open. Preserves the end
 * endpoint's inclusivity, and returns the input itself when its start is
 * already open.
 *
 * @param i - The interval to convert.
 * @returns The same numeric range with the start excluded.
 * @since 2.0.0
 */
export const toStartOpen: {
  (i: Closed | OpenStart): OpenStart
  (i: OpenEnd | Open): Open
} = internal.toStartOpen

/**
 * Returns an interval with the start endpoint closed. Preserves the end
 * endpoint's inclusivity, and returns the input itself when its start is
 * already closed.
 *
 * @param i - The interval to convert.
 * @returns The same numeric range with the start included.
 * @since 2.0.0
 */
export const toStartClosed: {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenEnd
} = internal.toStartClosed

/**
 * Returns an interval with the end endpoint open. Preserves the start
 * endpoint's inclusivity, and returns the input itself when its end is
 * already open.
 *
 * @param i - The interval to convert.
 * @returns The same numeric range with the end excluded.
 * @since 2.0.0
 */
export const toEndOpen: {
  (i: Closed | OpenEnd): OpenEnd
  (i: OpenStart | Open): Open
} = internal.toEndOpen

/**
 * Returns an interval with the end endpoint closed. Preserves the start
 * endpoint's inclusivity, and returns the input itself when its end is
 * already closed.
 *
 * @param i - The interval to convert.
 * @returns The same numeric range with the end included.
 * @since 2.0.0
 */
export const toEndClosed: {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenStart
} = internal.toEndClosed

/**
 * Returns a closed interval over the same numeric range. Returns the
 * input itself when it is already closed.
 *
 * @param i - The interval to convert.
 * @returns A `Closed` interval with the same endpoints.
 * @since 2.0.0
 */
export const toClosed: (i: Interval) => Closed = internal.toClosed

/**
 * Returns a fully open interval over the same numeric range. Returns the
 * input itself when it is already open.
 *
 * @param i - The interval to convert.
 * @returns An `Open` interval with the same endpoints.
 * @since 2.0.0
 */
export const toOpen: (i: Interval) => Open = internal.toOpen

/**
 * Checks if an interval includes both endpoints — exactly kind `closed`.
 * For a single endpoint, use `isClosedAtStart` or `isClosedAtEnd`.
 *
 * @param i - The interval to test.
 * @returns `true` when `i.kind` is `closed`, narrowing to `Closed`.
 * @since 2.0.0
 */
export const isClosed: (i: Interval) => i is Closed = internal.isClosed

/**
 * Checks if an interval excludes both endpoints — exactly kind `open`.
 * For a single endpoint, use `isOpenAtStart` or `isOpenAtEnd`.
 *
 * @param i - The interval to test.
 * @returns `true` when `i.kind` is `open`, narrowing to `Open`.
 * @since 2.0.0
 */
export const isOpen: (i: Interval) => i is Open = internal.isOpen

/**
 * Checks if an interval is exactly kind `open-start`: start excluded, end
 * included. A fully `open` interval does not match. For any open start,
 * use `isOpenAtStart`.
 *
 * @param i - The interval to test.
 * @returns `true` when `i.kind` is `open-start`, narrowing to `OpenStart`.
 * @since 2.0.0
 */
export const isOpenStart: (i: Interval) => i is OpenStart = internal.isOpenStart

/**
 * Checks if an interval is exactly kind `open-end`: start included, end
 * excluded. A fully `open` interval does not match. For any open end, use
 * `isOpenAtEnd`.
 *
 * @param i - The interval to test.
 * @returns `true` when `i.kind` is `open-end`, narrowing to `OpenEnd`.
 * @since 2.0.0
 */
export const isOpenEnd: (i: Interval) => i is OpenEnd = internal.isOpenEnd

/**
 * Checks if an interval excludes its start endpoint: kinds `open-start`
 * and `open`.
 *
 * @param i - The interval to test.
 * @returns `true` when the start is excluded, narrowing to `OpenStart | Open`.
 * @since 2.0.0
 */
export const isOpenAtStart: (i: Interval) => i is OpenStart | Open = internal.isOpenAtStart

/**
 * Checks if an interval excludes its end endpoint: kinds `open-end` and
 * `open`.
 *
 * @param i - The interval to test.
 * @returns `true` when the end is excluded, narrowing to `OpenEnd | Open`.
 * @since 2.0.0
 */
export const isOpenAtEnd: (i: Interval) => i is OpenEnd | Open = internal.isOpenAtEnd

/**
 * Checks if an interval includes its start endpoint: kinds `closed` and
 * `open-end`.
 *
 * @param i - The interval to test.
 * @returns `true` when the start is included, narrowing to `Closed | OpenEnd`.
 * @since 2.0.0
 */
export const isClosedAtStart: (i: Interval) => i is Closed | OpenEnd = internal.isClosedAtStart

/**
 * Checks if an interval includes its end endpoint: kinds `closed` and
 * `open-start`.
 *
 * @param i - The interval to test.
 * @returns `true` when the end is included, narrowing to `Closed | OpenStart`.
 * @since 2.0.0
 */
export const isClosedAtEnd: (i: Interval) => i is Closed | OpenStart = internal.isClosedAtEnd

/**
 * The unit interval, `[0, 1]`.
 *
 * @since 1.0.0
 */
export const unit: Closed = internal.unit

/**
 * The open unit interval, `(0, 1)`. The symmetric open analog of `unit`.
 * Convenient for "strict interior" use cases such as filtering roots that
 * must lie strictly inside the unit parameter range.
 *
 * @since 2.0.0
 */
export const unitOpen: Open = internal.unitOpen

/**
 * The biunit interval, `[-1, 1]`.
 *
 * @since 1.0.0
 */
export const biunit: Closed = internal.biunit

/**
 * Linearly interpolates a value within bounds: `t = 0` returns exactly
 * `start`, `t = 1` exactly `end`.
 *
 * `t` is not clamped. Values outside `[0, 1]` extrapolate along the same
 * line.
 *
 * @param interval - The bounds to interpolate within.
 * @param t - The interpolation factor. Not restricted to `[0, 1]`.
 * @returns The value `(1 - t) * start + t * end`.
 * @since 1.0.0
 */
export const lerp: (interval: Bounds, t: number) => number = internal.lerp

/**
 * Creates a linear interpolation function for given bounds: the
 * single-argument form of `lerp`, shaped for `pipe` and `map`.
 *
 * @param interval - The bounds to interpolate within.
 * @returns A function that takes a factor `t` and returns the interpolated value.
 * @since 1.0.0
 */
export const toLerpFn: (interval: Bounds) => (t: number) => number = internal.toLerpFn

/**
 * Normalizes a value within bounds: `start` maps to `0` and `end` to `1`.
 *
 * Not clamped. Values outside the bounds map outside `[0, 1]`. Zero-size
 * bounds divide by zero, producing `NaN` or `±Infinity`.
 *
 * @param interval - The bounds to normalize within.
 * @param x - The value to normalize.
 * @returns The value `(x - start) / size(interval)`.
 * @since 1.0.0
 */
export const normalize: (interval: Bounds, x: number) => number = internal.normalize

/**
 * Creates a normalization function for given bounds: the single-argument
 * form of `normalize`, shaped for `pipe` and `map`.
 *
 * @param interval - The bounds to normalize within.
 * @returns A function that takes a value `x` and returns the normalized value.
 * @since 1.0.0
 */
export const toNormalizeFn: (interval: Bounds) => (x: number) => number = internal.toNormalizeFn

/**
 * Remaps a value from one bounds to another, preserving its relative
 * position.
 *
 * Not clamped. Values outside the source map proportionally outside the
 * target. A zero-size source divides by zero, producing `NaN` or
 * `±Infinity`.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @param x - The value to remap.
 * @returns The value `target.start + (x - source.start) * size(target) / size(source)`.
 * @since 1.0.0
 */
export const remap: (source: Bounds, target: Bounds, x: number) => number = internal.remap

/**
 * Creates a remapping function for given bounds: the single-argument form
 * of `remap`, shaped for `pipe` and `map`.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @returns A function that takes a value `x` and returns the remapped value.
 * @since 1.0.0
 */
export const toRemapFn: (source: Bounds, target: Bounds) => (x: number) => number =
  internal.toRemapFn

/**
 * Calculates the scale and shift that map `source` onto `target`.
 *
 * A zero-size source divides by zero, producing non-finite fields.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @returns The `scale` and `shift` such that `x * scale + shift` maps `source` onto `target`.
 * @since 1.0.0
 */
export const scaleShift: (source: Bounds, target: Bounds) => ScaleShift = internal.scaleShift

/**
 * The coefficients of the affine map `x * scale + shift` taking one
 * bounds onto another. Produced by `scaleShift`.
 *
 * @since 1.0.0
 */
export interface ScaleShift {
  /**
   * The multiplicative coefficient of the map `x * scale + shift`.
   */
  readonly scale: number
  /**
   * The additive coefficient of the map `x * scale + shift`.
   */
  readonly shift: number
}
