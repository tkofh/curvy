import * as internal from './interval.internal'
import type { Pipeable } from '../utils'

/**
 * The structural minimum: any value with numeric `start` and `end` fields.
 *
 * Operations that don't read endpoint inclusivity (e.g. `lerp`, `normalize`,
 * `remap`, `size`) accept `Bounds` so the signature itself documents what
 * the operation depends on.
 *
 * @since 2.0.0
 */
export interface Bounds {
  readonly start: number
  readonly end: number
}

/**
 * A mathematical interval. Discriminated union of four variants by endpoint
 * inclusivity: `Closed`, `OpenStart`, `OpenEnd`, `Open`. Operations that
 * depend on inclusivity (e.g. `contains`, `filter`, `equals`) dispatch on
 * the `kind` field; operations that don't accept the broader `Bounds` type.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export type Interval = Closed | OpenStart | OpenEnd | Open

/**
 * `[start, end]` — both endpoints included.
 *
 * @since 2.0.0
 */
export interface Closed extends Pipeable, Bounds {
  readonly kind: 'closed'
}

/**
 * `(start, end]` — start excluded, end included.
 *
 * @since 2.0.0
 */
export interface OpenStart extends Pipeable, Bounds {
  readonly kind: 'open-start'
}

/**
 * `[start, end)` — start included, end excluded.
 *
 * @since 2.0.0
 */
export interface OpenEnd extends Pipeable, Bounds {
  readonly kind: 'open-end'
}

/**
 * `(start, end)` — both endpoints excluded.
 *
 * @since 2.0.0
 */
export interface Open extends Pipeable, Bounds {
  readonly kind: 'open'
}

/**
 * Checks if a value is an `Interval`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Interval`, `false` otherwise.
 * @since 1.0.0
 */
export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const equals: {
  /**
   * Checks if two `Interval` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * Both endpoints AND the kind must match — a `Closed` and an `OpenStart` with
   * the same numeric endpoints are not equal. Use `aligned` for the looser
   * "same numeric range" check.
   *
   * @param a - The first interval.
   * @param b - The second interval.
   * @returns `true` when both intervals share a kind and both endpoints are within tolerance.
   * @since 1.1.0
   */
  (a: Interval, b: Interval): boolean
  /**
   * Checks if two `Interval` instances are approximately equal within the
   * default absolute tolerance ({@link EPSILON}).
   *
   * @param b - The second interval.
   * @returns A function that takes the first interval and returns the comparison result.
   * @since 1.1.0
   */
  (b: Interval): (a: Interval) => boolean
} = internal.equals

export const aligned: {
  /**
   * Checks if two values share the same numeric range, ignoring endpoint
   * inclusivity. Accepts any `Bounds`-shaped value.
   *
   * @param a - The first bounds.
   * @param b - The second bounds.
   * @returns `true` when both endpoints are within the default tolerance ({@link EPSILON}).
   * @since 2.0.0
   */
  (a: Bounds, b: Bounds): boolean
  /**
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
   * @param end - The end of the interval.
   * @returns A new `Closed` interval `[start, end]`.
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
   * @param end - The end of the interval (included).
   * @returns A new `OpenStart` interval `(start, end]`.
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
   * @param end - The end of the interval (excluded).
   * @returns A new `OpenEnd` interval `[start, end)`.
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
   * @param end - The end of the interval (excluded).
   * @returns A new `Open` interval `(start, end)`.
   * @since 2.0.0
   */
  (start: number, end: number): Open
} = internal.makeOpen

export const fromSize: {
  /**
   * Creates a new closed `Interval` instance from a size.
   *
   * @param size - The size of the interval.
   * @returns A new `Closed` interval `[0, size]`.
   * @since 1.0.0
   */
  (size: number): Closed
  /**
   * Creates a new closed `Interval` instance from a size.
   *
   * @param start - The start of the interval.
   * @param size - The size of the interval.
   * @returns A new `Closed` interval `[start, start + size]`.
   * @since 1.0.0
   */
  (start: number, size: number): Closed
} = internal.fromSize

/**
 * Creates a new closed `Interval` from a minimum and maximum value, in any order.
 *
 * @param values - The values to take the min and max of.
 * @returns A new `Closed` interval `[min(values), max(values)]`.
 * @since 1.0.0
 */
export const fromMinMax: (...values: ReadonlyArray<number>) => Closed = internal.fromMinMax

/**
 * Calculates the size of an interval.
 *
 * Kind-agnostic — `size` of `[0, 1]` and `(0, 1)` are both `1`.
 *
 * @param i - The bounds to calculate the size of.
 * @returns The size of the bounds.
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

export const containsInterval: {
  /**
   * Checks if `inner` is a subset of `outer` — every point of `inner` is also
   * in `outer`. Respects endpoint inclusivity on both sides: a closed inner
   * endpoint must be inside (or on a closed boundary of) the outer, while an
   * open inner endpoint can sit exactly on an open outer boundary.
   *
   * @param outer - The enclosing interval.
   * @param inner - The candidate inner interval.
   * @returns `true` when `inner` is a subset of `outer`.
   * @since 2.0.0
   */
  (outer: Interval, inner: Interval): boolean
  /**
   * @param inner - The candidate inner interval.
   * @returns A function that takes the outer interval and returns the containment result.
   * @since 2.0.0
   */
  (inner: Interval): (outer: Interval) => boolean
} = internal.containsInterval

export const union: {
  /**
   * Returns the smallest interval enclosing both inputs. Each endpoint's
   * inclusivity follows the input that contributed it; when both endpoints
   * tie, the result is closed at that point if either input includes it.
   *
   * @param a - The first interval.
   * @param b - The second interval.
   * @returns A new interval enclosing both inputs.
   * @since 2.0.0
   */
  (a: Interval, b: Interval): Interval
  /**
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
   * @returns The filtered values.
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
   * Clamps a value to be within bounds. Kind-agnostic — clamps to the numeric
   * range regardless of endpoint inclusivity.
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
 * Returns an interval with the start endpoint open. Preserves the end endpoint's inclusivity.
 *
 * @since 2.0.0
 */
export const toStartOpen: {
  (i: Closed | OpenStart): OpenStart
  (i: OpenEnd | Open): Open
} = internal.toStartOpen

/**
 * Returns an interval with the start endpoint closed. Preserves the end endpoint's inclusivity.
 *
 * @since 2.0.0
 */
export const toStartClosed: {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenEnd
} = internal.toStartClosed

/**
 * Returns an interval with the end endpoint open. Preserves the start endpoint's inclusivity.
 *
 * @since 2.0.0
 */
export const toEndOpen: {
  (i: Closed | OpenEnd): OpenEnd
  (i: OpenStart | Open): Open
} = internal.toEndOpen

/**
 * Returns an interval with the end endpoint closed. Preserves the start endpoint's inclusivity.
 *
 * @since 2.0.0
 */
export const toEndClosed: {
  (i: Closed | OpenEnd): Closed
  (i: OpenStart | Open): OpenStart
} = internal.toEndClosed

/**
 * Returns a closed interval over the same numeric range.
 *
 * @since 2.0.0
 */
export const toClosed: (i: Interval) => Closed = internal.toClosed

/**
 * Returns a fully open interval over the same numeric range.
 *
 * @since 2.0.0
 */
export const toOpen: (i: Interval) => Open = internal.toOpen

/**
 * Type-narrowing predicate: refines `Interval` to `Closed`.
 *
 * @since 2.0.0
 */
export const isClosed: (i: Interval) => i is Closed = internal.isClosed

/**
 * Type-narrowing predicate: refines `Interval` to `Open`.
 *
 * @since 2.0.0
 */
export const isOpen: (i: Interval) => i is Open = internal.isOpen

/**
 * Type-narrowing predicate: refines `Interval` to `OpenStart`.
 *
 * @since 2.0.0
 */
export const isOpenStart: (i: Interval) => i is OpenStart = internal.isOpenStart

/**
 * Type-narrowing predicate: refines `Interval` to `OpenEnd`.
 *
 * @since 2.0.0
 */
export const isOpenEnd: (i: Interval) => i is OpenEnd = internal.isOpenEnd

/**
 * Type-narrowing predicate: refines `Interval` to those with an open start endpoint.
 *
 * @since 2.0.0
 */
export const isOpenAtStart: (i: Interval) => i is OpenStart | Open = internal.isOpenAtStart

/**
 * Type-narrowing predicate: refines `Interval` to those with an open end endpoint.
 *
 * @since 2.0.0
 */
export const isOpenAtEnd: (i: Interval) => i is OpenEnd | Open = internal.isOpenAtEnd

/**
 * Type-narrowing predicate: refines `Interval` to those with a closed start endpoint.
 *
 * @since 2.0.0
 */
export const isClosedAtStart: (i: Interval) => i is Closed | OpenEnd = internal.isClosedAtStart

/**
 * Type-narrowing predicate: refines `Interval` to those with a closed end endpoint.
 *
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
 * The open unit interval, `(0, 1)`. The symmetric open analog of {@link unit};
 * convenient for "strict interior" use cases such as filtering roots that
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
 * Linearly interpolates a value within bounds.
 *
 * @param interval - The bounds to interpolate within.
 * @param t - The interpolation factor, typically between 0 and 1.
 * @returns The interpolated value.
 * @since 1.0.0
 */
export const lerp: (interval: Bounds, t: number) => number = internal.lerp

/**
 * Creates a linear interpolation function for given bounds.
 *
 * @param interval - The bounds to create the interpolation function for.
 * @returns A function that takes a factor `t` and returns the interpolated value.
 * @since 1.0.0
 */
export const toLerpFn: (interval: Bounds) => (t: number) => number = internal.toLerpFn

/**
 * Normalizes a value within bounds.
 *
 * @param interval - The bounds to normalize within.
 * @param x - The value to normalize.
 * @returns The normalized value.
 * @since 1.0.0
 */
export const normalize: (interval: Bounds, x: number) => number = internal.normalize

/**
 * Creates a normalization function for given bounds.
 *
 * @param interval - The bounds to create the normalization function for.
 * @returns A function that takes a value `x` and returns the normalized value.
 * @since 1.0.0
 */
export const toNormalizeFn: (interval: Bounds) => (x: number) => number = internal.toNormalizeFn

/**
 * Remaps a value from one bounds to another.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @param x - The value to remap.
 * @returns The remapped value.
 * @since 1.0.0
 */
export const remap: (source: Bounds, target: Bounds, x: number) => number = internal.remap

/**
 * Creates a remapping function for given bounds.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @returns A function that takes a value `x` and returns the remapped value.
 * @since 1.0.0
 */
export const toRemapFn: (source: Bounds, target: Bounds) => (x: number) => number =
  internal.toRemapFn

/**
 * Calculates the scale and shift needed to map a source bounds to a target bounds.
 *
 * @param source - The source bounds.
 * @param target - The target bounds.
 * @returns An object containing the scale and shift values.
 * @since 1.0.0
 */
export const scaleShift: (source: Bounds, target: Bounds) => ScaleShift = internal.scaleShift

/**
 * The scale and shift needed to map a source bounds to a target bounds.
 *
 * @since 1.0.0
 */
export interface ScaleShift {
  readonly scale: number
  readonly shift: number
}
