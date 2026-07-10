import { dual } from './utils.ts'

const PRECISION = 8

/**
 * Default tolerance for approximate equality between floating-point numbers.
 *
 * @since 1.1.0
 */
export const EPSILON = 1e-10

/**
 * Default relative tolerance for sign and degeneracy decisions about
 * *computed* quantities — derivative values, determinants, discriminants.
 *
 * Scale-free: multiply by the natural magnitude of the quantity under test
 * (e.g. the largest derivative value over the interval) to get an absolute
 * threshold. Values inside the resulting band are indistinguishable from
 * accumulated rounding noise and must not decide a sign question.
 *
 * The value sits ~4,500× above IEEE double rounding noise (2⁻⁵² ≈ 2.2e-16
 * relative per operation) — generous headroom for noise accumulated across a
 * construction pipeline — and far below any geometrically meaningful feature.
 *
 * @since 2.0.0
 */
export const RELATIVE_TOLERANCE = 1e-12

/**
 * Approximate equality between two numbers, within an absolute tolerance.
 *
 * This is the raw absolute comparison — the right tool when the domain is
 * normalized by construction (curve parameter space, where `[0, 1]` makes an
 * absolute band meaningful) or when a caller-chosen absolute band is the
 * actual question. For identity questions about computed values of arbitrary
 * magnitude ("is this the same point / value?"), use {@link coincident},
 * which adds a magnitude-relative term.
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
 * Library-policy approximate equality: `true` when
 * `|a - b| <= absolute + relative * max(|a|, |b|)`.
 *
 * The relative term covers rounding noise accumulated by arithmetic, which
 * grows with the magnitude of the values; the absolute term covers the
 * neighborhood of zero, where relative comparison degenerates (no nonzero
 * value is relatively close to `0`). The band is strictly wider than the
 * plain absolute comparison, never narrower.
 *
 * Defaults: `absolute = ` {@link EPSILON} — a modeling floor that assumes
 * coordinates of order ~1; pass an explicit value when your data has a
 * different natural resolution — and `relative = ` {@link RELATIVE_TOLERANCE}.
 *
 * Not transitive: `coincident(a, b)` and `coincident(b, c)` do not imply
 * `coincident(a, c)` — chains of pairwise-coincident values can drift beyond
 * the band. Pairwise semantics are intentional (e.g. path continuity checks
 * each junction locally).
 *
 * The tolerance parameters are positional, mirroring {@link epsEquals}: the
 * common override is `absolute` alone, for a domain with a known resolution.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param absolute - Absolute floor of the band. Defaults to {@link EPSILON}.
 * @param relative - Magnitude-proportional term of the band. Defaults to {@link RELATIVE_TOLERANCE}.
 * @returns `true` when the values are equal to within the combined band.
 * @since 2.0.0
 */
export function coincident(
  a: number,
  b: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return Math.abs(a - b) <= absolute + relative * Math.max(Math.abs(a), Math.abs(b))
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
 * import { round } from 'curvy/number'
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
 * import { roundDown } from 'curvy/number'
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
 * import { roundUp } from 'curvy/number'
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
   * import { lerp } from 'curvy/number'
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
   * import { lerp } from 'curvy/number'
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
   * import { normalize } from 'curvy/number'
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
   * import { normalize } from 'curvy/number'
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
   * import { remap } from 'curvy/number'
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
   * import { remap } from 'curvy/number'
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
   * import { clamp } from 'curvy/number'
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
   * import { clamp } from 'curvy/number'
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
   * import { clip } from 'curvy/number'
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
   * import { clip } from 'curvy/number'
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
 * import { minMax } from 'curvy/number'
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
 * import { mod } from 'curvy/number'
 *
 * const modulus = mod(10, 3) // 1
 * const modulus2 = mod(-10, 3) // 2
 * ```
 * @since 1.0.0
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
