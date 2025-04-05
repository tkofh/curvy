import * as internal from './interval.internal'
import type { Pipeable } from './pipe'

/**
 * A mathematical interval.
 *
 * All fields are readonly and immutable, and all operations create new instances.
 *
 * @since 1.0.0
 */
export interface Interval extends Pipeable {
  readonly start: number
  readonly end: number
}

/**
 * Checks if a value is an `Interval`.
 *
 * @param v - The value to check.
 * @returns `true` if the value is an `Interval`, `false` otherwise.
 * @since 1.0.0
 */
export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const make: {
  /**
   * Creates a new `Interval` instance.
   *
   * @param point - The point of the interval.
   * @returns A new `Interval` instance.
   * @since 1.0.0
   */
  (point: number): Interval
  /**
   * Creates a new `Interval` instance.
   *
   * @param start - The start of the interval.
   * @param end - The end of the interval.
   * @returns A new `Interval` instance.
   * @since 1.0.0
   */
  (start: number, end: number): Interval
} = internal.make

export const fromSize: {
  /**
   * Creates a new `Interval` instance from a size.
   *
   * @param size - The size of the interval.
   * @returns A new `Interval` instance.
   * @since 1.0.0
   */
  (size: number): Interval
  /**
   * Creates a new `Interval` instance from a size.
   *
   * @param size - The size of the interval.
   * @param start - The start of the interval.
   * @returns A new `Interval` instance.
   * @since 1.0.0
   */
  (start: number, size: number): Interval
} = internal.fromSize

/**
 * Creates a new `Interval` instance from a minimum and maximum value.
 *
 * @param values - The minimum and maximum values of the interval.
 * @returns A new `Interval` instance.
 * @since 1.0.0
 */
export const fromMinMax: (...values: ReadonlyArray<number>) => Interval = internal.fromMinMax

/**
 * Calculates the size of an interval.
 *
 * @param interval - The interval to calculate the size of.
 * @returns The size of the interval.
 * @since 1.0.0
 */
export const size: (i: Interval) => number = internal.size

export const contains: {
  /**
   * Checks if a value is contained within an interval.
   *
   * @param interval - The interval to check.
   * @param value - The value to check.
   * @param options - Options for the check.
   * @returns `true` if the value is contained within the interval, `false` otherwise.
   * @since 1.0.0
   */
  (
    interval: Interval,
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): boolean
  /**
   * Checks if a value is contained within an interval.
   *
   * @param value - The value to check.
   * @param options - Options for the check.
   * @returns A function that takes an interval and returns `true` if the value is contained within the interval, `false` otherwise.
   * @since 1.0.0
   */
  (
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): (interval: Interval) => boolean
} = internal.contains

export const filter: {
  /**
   * Filters a value to be within an interval.
   *
   * @param interval - The interval to filter the value to.
   * @param value - The value to filter.
   * @param options - Options for the filter.
   * @returns The filtered value.
   * @since 1.0.0
   */
  <V extends ReadonlyArray<number>>(
    interval: Interval,
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): V
  /**
   * Filters a value to be within an interval.
   *
   * @param value - The value to filter.
   * @param options - Options for the filter.
   * @returns A function that takes an interval and returns the filtered value.
   * @since 1.0.0
   */
  <V extends ReadonlyArray<number>>(
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): (interval: Interval) => V
} = internal.filter

export const clamp: {
  /**
   * Clamps a value to be within an interval.
   *
   * @param interval - The interval to clamp the value to.
   * @param value - The value to clamp.
   * @returns The clamped value.
   * @since 1.0.0
   */
  (interval: Interval, value: number): number
  /**
   * Clamps a value to be within an interval.
   *
   * @param value - The value to clamp.
   * @returns A function that takes an interval and returns the clamped value.
   * @since 1.0.0
   */
  (value: number): (interval: Interval) => number
  /**
   * Clamps an array of values to be within an interval.
   *
   * @param interval - The interval to clamp the values to.
   * @param value - The values to clamp.
   * @returns The clamped values.
   * @since 1.0.0
   */
  (interval: Interval, value: ReadonlyArray<number>): ReadonlyArray<number>
  /**
   * Clamps an array of values to be within an interval.
   *
   * @param value - The values to clamp.
   * @returns A function that takes an interval and returns the clamped values.
   * @since 1.0.0
   */
  (value: ReadonlyArray<number>): (interval: Interval) => ReadonlyArray<number>
} = internal.clamp

/**
 * The unit interval, which is the interval [0, 1].
 *
 * @since 1.0.0
 */
export const unit: Interval = internal.unit

/**
 * The biunit interval, which is the interval [-1, 1].
 *
 * @since 1.0.0
 */
export const biunit: Interval = internal.biunit

/**
 * Linearly interpolates a value within an interval.
 *
 * @param interval - The interval to interpolate within.
 * @param t - The interpolation factor, typically between 0 and 1.
 * @returns The interpolated value.
 * @since 1.0.0
 */
export const lerp: (interval: Interval, t: number) => number = internal.lerp

/**
 * Creates a linear interpolation function for an interval.
 *
 * @param interval - The interval to create the interpolation function for.
 * @returns A function that takes a factor `t` and returns the interpolated value.
 * @since 1.0.0
 */
export const toLerpFn: (interval: Interval) => (t: number) => number = internal.toLerpFn

/**
 * Normalizes a value within an interval.
 *
 * @param interval - The interval to normalize within.
 * @param x - The value to normalize.
 * @returns The normalized value.
 * @since 1.0.0
 */
export const normalize: (interval: Interval, x: number) => number = internal.normalize

/**
 * Creates a normalization function for an interval.
 *
 * @param interval - The interval to create the normalization function for.
 * @returns A function that takes a value `x` and returns the normalized value.
 * @since 1.0.0
 */
export const toNormalizeFn: (interval: Interval) => (x: number) => number = internal.toNormalizeFn

/**
 * Remaps a value from one interval to another.
 *
 * @param source - The source interval.
 * @param target - The target interval.
 * @param x - The value to remap.
 * @returns The remapped value.
 * @since 1.0.0
 */
export const remap: (source: Interval, target: Interval, x: number) => number = internal.remap

/**
 * Creates a remapping function for an interval.
 *
 * @param source - The source interval.
 * @param target - The target interval.
 * @returns A function that takes a value `x` and returns the remapped value.
 * @since 1.0.0
 */
export const toRemapFn: (source: Interval, target: Interval) => (x: number) => number =
  internal.toRemapFn

/**
 * Calculates the scale and shift needed to map a source interval to a target interval.
 *
 * @param source - The source interval.
 * @param target - The target interval.
 * @returns An object containing the scale and shift values.
 * @since 1.0.0
 */
export const scaleShift: (source: Interval, target: Interval) => ScaleShift = internal.scaleShift

/**
 * The scale and shift needed to map a source interval to a target interval.
 *
 * @since 1.0.0
 */
export interface ScaleShift {
  readonly scale: number
  readonly shift: number
}
