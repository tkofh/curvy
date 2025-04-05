import { dual } from './pipe'

/**
 * @since 1.0.0
 */
export const PRECISION = 8

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

/**
 * Linear interpolation function.
 *
 * @param t - The interpolation factor (between 0 and 1).
 * @param a - The start value.
 * @param b - The end value.
 * @returns The interpolated value.
 * @example
 * ```ts
 * import { lerp } from 'curvy/utils'
 *
 * const interpolatedValue = lerp(0.5, 10, 20) // 15
 * const interpolatedValue2 = lerp(0.5)(10, 20) // 15
 * ```
 * @since 1.0.0
 */
export const lerp: {
  (t: number, a: number, b: number): number
  (a: number, b: number): (t: number) => number
} = dual(3, (t: number, a: number, b: number): number => {
  return b * t + a * (1 - t)
})

/**
 * Normalizes a value between two bounds.
 *
 * @param x - The value to normalize.
 * @param a - The lower bound.
 * @param b - The upper bound.
 * @returns The normalized value.
 * @example
 * ```ts
 * import { normalize } from 'curvy/utils'
 *
 * const normalizedValue = normalize(15, 10, 20) // 0.5
 * const normalizedValue2 = normalize(10, 20)(15) // 0.5
 * ```
 * @since 1.0.0
 */
export const normalize: {
  (x: number, a: number, b: number): number
  (a: number, b: number): (x: number) => number
} = dual(3, (x: number, a: number, b: number): number => {
  return (x - a) / (b - a)
})

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
 * const remappedValue = remap(15, 10, 20, 0, 100) // 50
 * const remappedValue2 = remap(10, 20, 0, 100)(15) // 50
 * ```
 * @since 1.0.0
 */
export const remap: {
  (x: number, x1: number, x2: number, y1: number, y2: number): number
  (x1: number, x2: number, y1: number, y2: number): (x: number) => number
} = dual(5, (x: number, x1: number, x2: number, y1: number, y2: number): number => {
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)
})

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
 * const clampedValue = clamp(25, 10, 20) // 20
 * const clampedValue2 = clamp(10, 20)(25) // 20
 * ```
 * @since 1.0.0
 */
export const clamp: {
  (value: number, min: number, max: number): number
  (min: number, max: number): (value: number) => number
} = dual(3, (value: number, min: number, max: number) => {
  return value < min ? min : value > max ? max : value
})

/**
 * Clips a value to a specified range, returning a fallback value if the value is outside the range.
 *
 * @param value - The value to clip.
 * @param min - The lower bound.
 * @param max - The upper bound.
 * @param onClip - The fallback value to return if the value is outside the range.
 * @returns The clipped value or the fallback value.
 * @example
 * ```ts
 * import { clip } from 'curvy/utils'
 *
 * const clippedValue = clip(25, 10, 20, 15) // 15
 * const clippedValue2 = clip(10, 20, 15)(25) // 15
 * ```
 * @since 1.0.0
 */
export const clip: {
  <T>(value: number, min: number, max: number, onClip: T): T | number
  <T>(min: number, max: number, onClip: T): (value: number) => T | number
} = dual(4, (value: number, min: number, max: number, onClip: unknown) => {
  return value < min ? onClip : value > max ? onClip : value
})

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

/**
 * Asserts that a condition is true, throwing an error with the provided message if it is not.
 *
 * @param condition - The condition to assert.
 * @param message - The error message to throw if the condition is false.
 * @throws An error with the provided message if the condition is false.
 * @example
 * ```ts
 * import { invariant } from 'curvy/utils'
 *
 * invariant(1 + 1 === 2, 'Math is broken!') // No error
 * invariant(1 + 1 === 3, 'Math is broken!') // Throws: Math is broken!
 * ```
 * @since 1.0.0
 */
export function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}
