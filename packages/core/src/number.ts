import { dual } from './utils'

const PRECISION = 8

/**
 * Default tolerance for approximate equality between floating-point numbers.
 *
 * @since 1.1.0
 */
export const EPSILON = 1e-10

/**
 * Approximate equality between two numbers, within an absolute tolerance.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param eps - The maximum allowed absolute difference. Defaults to {@link EPSILON}.
 * @returns `true` when `|a - b| <= eps`.
 * @since 1.1.0
 */
export function epsEquals(a: number, b: number, eps: number = EPSILON): boolean {
  return Math.abs(a - b) <= eps
}

/**
 * Snaps near-zero values to exactly zero for stable sign tests.
 *
 * @param value - The value to test.
 * @param eps - The threshold below which `value` is considered zero.
 * @returns `0` when `|value| < eps`, otherwise `value` unchanged.
 * @since 1.1.0
 */
export function clampToZero(value: number, eps: number): number {
  return Math.abs(value) < eps ? 0 : value
}

/**
 * Rounding function that rounds a number to a specified precision.
 *
 * @param value - The number to round.
 * @param precision - The number of decimal places to round to (default is 8).
 * @returns The rounded number.
 * @example
 * ```ts
 * import { round } from 'curvy/utils'
 *
 * const roundedValue = round(1.23456789, 4) // 1.2346
 * const roundedValue2 = round(1.23456789) // 1.23456789
 * ```
 * @since 1.0.0
 */
export function round(value: number, precision = PRECISION): number {
  const scale = 10 ** precision
  const result = Math.round(value * scale) / scale
  if (result === 0) {
    return 0
  }
  return result
}

/**
 * Rounding function that rounds a number down to a specified precision.
 *
 * @param value - The number to round down.
 * @param precision - The number of decimal places to round down to (default is 8).
 * @returns The rounded down number.
 * @example
 * ```ts
 * import { roundDown } from 'curvy/utils'
 *
 * const roundedDownValue = roundDown(1.23456789, 4) // 1.2345
 * const roundedDownValue2 = roundDown(1.23456789) // 1.23456789
 * ```
 * @since 1.0.0
 */
export function roundDown(value: number, precision = PRECISION): number {
  const scale = 10 ** precision
  const result = Math.floor(value * scale) / scale
  if (result === 0) {
    return 0
  }
  return result
}

/**
 * Rounding function that rounds a number up to a specified precision.
 *
 * @param value - The number to round up.
 * @param precision - The number of decimal places to round up to (default is 8).
 * @returns The rounded up number.
 * @example
 * ```ts
 * import { roundUp } from 'curvy/utils'
 *
 * const roundedUpValue = roundUp(1.23456789, 4) // 1.2346
 * const roundedUpValue2 = roundUp(1.23456789) // 1.23456789
 * ```
 * @since 1.0.0
 */
export function roundUp(value: number, precision = PRECISION): number {
  const scale = 10 ** precision
  const result = Math.ceil(value * scale) / scale
  if (result === 0) {
    return 0
  }
  return result
}

export const lerp: {
  /**
   * Linearly interpolates between two values.
   *
   * @param t - The interpolation factor (between 0 and 1).
   * @param a - The start value.
   * @param b - The end value.
   * @returns The interpolated value.
   * @example
   * ```ts
   * import { lerp } from 'curvy/utils'
   *
   * lerp(0.5, 10, 20) // 15
   * ```
   * @since 1.0.0
   */
  (t: number, a: number, b: number): number
  /**
   * Linearly interpolates between two values.
   *
   * @param a - The start value.
   * @param b - The end value.
   * @returns A function that takes the interpolation factor and returns the interpolated value.
   * @example
   * ```ts
   * import { lerp } from 'curvy/utils'
   *
   * lerp(10, 20)(0.5) // 15
   * ```
   * @since 1.0.0
   */
  (a: number, b: number): (t: number) => number
} = dual(3, (t: number, a: number, b: number) => b * t + a * (1 - t))

export const normalize: {
  /**
   * Normalizes a value between two bounds to the unit interval.
   *
   * @param x - The value to normalize.
   * @param a - The lower bound.
   * @param b - The upper bound.
   * @returns The normalized value.
   * @example
   * ```ts
   * import { normalize } from 'curvy/utils'
   *
   * normalize(15, 10, 20) // 0.5
   * ```
   * @since 1.0.0
   */
  (x: number, a: number, b: number): number
  /**
   * Normalizes a value between two bounds to the unit interval.
   *
   * @param a - The lower bound.
   * @param b - The upper bound.
   * @returns A function that takes a value and returns the normalized value.
   * @example
   * ```ts
   * import { normalize } from 'curvy/utils'
   *
   * normalize(10, 20)(15) // 0.5
   * ```
   * @since 1.0.0
   */
  (a: number, b: number): (x: number) => number
} = dual(3, (x: number, a: number, b: number) => (x - a) / (b - a))

export const remap: {
  /**
   * Remaps a value from one range to another.
   *
   * @param x - The value to remap.
   * @param x1 - The lower bound of the original range.
   * @param x2 - The upper bound of the original range.
   * @param y1 - The lower bound of the new range.
   * @param y2 - The upper bound of the new range.
   * @returns The remapped value.
   * @example
   * ```ts
   * import { remap } from 'curvy/utils'
   *
   * remap(15, 10, 20, 0, 100) // 50
   * ```
   * @since 1.0.0
   */
  (x: number, x1: number, x2: number, y1: number, y2: number): number
  /**
   * Remaps a value from one range to another.
   *
   * @param x1 - The lower bound of the original range.
   * @param x2 - The upper bound of the original range.
   * @param y1 - The lower bound of the new range.
   * @param y2 - The upper bound of the new range.
   * @returns A function that takes a value and returns the remapped value.
   * @example
   * ```ts
   * import { remap } from 'curvy/utils'
   *
   * remap(10, 20, 0, 100)(15) // 50
   * ```
   * @since 1.0.0
   */
  (x1: number, x2: number, y1: number, y2: number): (x: number) => number
} = dual(
  5,
  (x: number, x1: number, x2: number, y1: number, y2: number) =>
    y1 + ((x - x1) / (x2 - x1)) * (y2 - y1),
)

export const clamp: {
  /**
   * Clamps a value between two bounds.
   *
   * @param value - The value to clamp.
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @returns The clamped value.
   * @example
   * ```ts
   * import { clamp } from 'curvy/utils'
   *
   * clamp(25, 10, 20) // 20
   * ```
   * @since 1.0.0
   */
  (value: number, min: number, max: number): number
  /**
   * Clamps a value between two bounds.
   *
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @returns A function that takes a value and returns the clamped value.
   * @example
   * ```ts
   * import { clamp } from 'curvy/utils'
   *
   * clamp(10, 20)(25) // 20
   * ```
   * @since 1.0.0
   */
  (min: number, max: number): (value: number) => number
} = dual(3, (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value,
)

export const clip: {
  /**
   * Clips a value to a specified range, returning a fallback value if the value is outside the range.
   *
   * @param value - The value to clip.
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @param onClip - The fallback value to return if the value is outside the range.
   * @returns The original value if within range, otherwise the fallback.
   * @example
   * ```ts
   * import { clip } from 'curvy/utils'
   *
   * clip(25, 10, 20, 15) // 15
   * ```
   * @since 1.0.0
   */
  <T>(value: number, min: number, max: number, onClip: T): T | number
  /**
   * Clips a value to a specified range, returning a fallback value if the value is outside the range.
   *
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @param onClip - The fallback value to return if the value is outside the range.
   * @returns A function that takes a value and returns it if within range, otherwise the fallback.
   * @example
   * ```ts
   * import { clip } from 'curvy/utils'
   *
   * clip(10, 20, 15)(25) // 15
   * ```
   * @since 1.0.0
   */
  <T>(min: number, max: number, onClip: T): (value: number) => T | number
} = dual(4, (value: number, min: number, max: number, onClip: unknown) =>
  value < min ? onClip : value > max ? onClip : value,
)

/**
 * Returns the minimum and maximum of two numbers.
 *
 * @param a - The first number.
 * @param b - The second number.
 * @returns A tuple containing the minimum and maximum values.
 * @example
 * ```ts
 * import { minMax } from 'curvy/utils'
 *
 * const [minValue, maxValue] = minMax(10, 20) // [10, 20]
 * const [minValue2, maxValue2] = minMax(20, 10) // [10, 20]
 * ```
 * @since 1.0.0
 */
export function minMax(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a]
}

/**
 * Calculates the modulus of a number.
 *
 * @param n - The number to calculate the modulus of.
 * @param m - The modulus.
 * @returns The modulus of the number.
 * @example
 * ```ts
 * import { mod } from 'curvy/utils'
 *
 * const modulus = mod(10, 3) // 1
 * const modulus2 = mod(-10, 3) // 2
 * ```
 * @since 1.0.0
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

