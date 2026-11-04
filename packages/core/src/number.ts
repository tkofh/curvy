import { dual } from './utils.ts'

const PRECISION = 8

/**
 * Default absolute tolerance for approximate equality, used as the `eps` of
 * `epsEquals` and the `absolute` floor of `coincident`.
 *
 * An absolute band is meaningful where the data's scale is fixed. Curve
 * parameter space is `[0, 1]` by construction, and there `1e-10` sits
 * ~450,000x above per-operation rounding noise (2^-52, ~2.2e-16 at order-1
 * magnitudes) yet far below any meaningful parameter separation. For data
 * with a different natural resolution, pass an explicit tolerance instead.
 * See `PRECISION.md` for where the library applies this band.
 *
 * @since 2.0.0
 */
export const EPSILON = 1e-10

/**
 * Default relative tolerance for sign and degeneracy decisions about
 * *computed* quantities — derivative values, determinants, discriminants.
 *
 * Scale-free. Multiply by the natural magnitude of the quantity under test
 * (e.g. the largest derivative value over the interval) to get an absolute
 * threshold. Values inside the resulting band are indistinguishable from
 * accumulated rounding noise and must not decide a sign question.
 *
 * The value sits ~4,500x above IEEE double rounding noise (2^-52, ~2.2e-16
 * relative per operation) — generous headroom for noise accumulated across a
 * construction pipeline — and far below any geometrically meaningful feature.
 *
 * @since 2.0.0
 */
export const RELATIVE_TOLERANCE = 1e-12

/**
 * Tests approximate equality of two numbers within an absolute tolerance.
 *
 * This is the raw absolute comparison, the right tool when the domain is
 * normalized by construction (curve parameter space, where `[0, 1]` makes an
 * absolute band meaningful) or when a caller-chosen absolute band is the
 * actual question. For identity questions about computed values of arbitrary
 * magnitude ("is this the same point / value?"), use `coincident`, which
 * adds a magnitude-relative term.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param eps - The maximum allowed absolute difference. Defaults to `EPSILON`.
 * @returns `true` when `|a - b| <= eps`.
 * @since 2.0.0
 */
export function epsEquals(a: number, b: number, eps: number = EPSILON): boolean {
  return Math.abs(a - b) <= eps
}

/**
 * Library-policy approximate equality: `true` when
 * `|a - b| <= absolute + relative * max(|a|, |b|)`.
 *
 * The relative term covers rounding noise accumulated by arithmetic, which
 * grows with the magnitude of the values. The absolute term covers the
 * neighborhood of zero, where relative comparison degenerates (no nonzero
 * value is relatively close to `0`). The band is strictly wider than the
 * plain absolute comparison, never narrower.
 *
 * Defaults: `absolute = EPSILON`, `relative = RELATIVE_TOLERANCE`. The
 * absolute floor assumes coordinates of order ~1. Pass an explicit
 * `absolute` when your data has a different natural resolution. Both
 * parameters are positional, mirroring `epsEquals`.
 *
 * A non-finite pair compares exactly. Against an infinity the band would be
 * infinite itself and call every finite value equal to it, and `Infinity`
 * minus itself is `NaN`, which would leave an infinity unequal to itself.
 * So an infinity equals only the infinity of the same sign, and `NaN`
 * equals nothing.
 *
 * Not transitive. `coincident(a, b)` and `coincident(b, c)` do not imply
 * `coincident(a, c)`, because chains of pairwise-coincident values can
 * drift beyond the band. Path continuity relies on exactly that. It claims
 * each junction's two knots agree, while a long path's first and last
 * knots may still sit far apart.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when the values are equal to within the combined band, or, when either is
 *   non-finite, identical.
 * @example
 * ```ts
 * coincident(0.1 + 0.2, 0.3) // true
 * coincident(Infinity, Infinity) // true
 * coincident(1e300, Infinity) // false
 * ```
 * @since 2.0.0
 */
export function coincident(
  a: number,
  b: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return a === b
  }
  return Math.abs(a - b) <= absolute + relative * Math.max(Math.abs(a), Math.abs(b))
}

// The ordering predicates. Each decides a discrete question about the order
// of two values with the `coincident` band, so that rounding noise never
// flips it. A non-finite pair compares exactly, as it does in `coincident`.

/**
 * Tests whether `a` comes strictly before `b`, beyond the `coincident` band.
 *
 * Values within rounding noise of each other are not ordered: neither comes
 * before the other. When either value is non-finite the comparison is the
 * exact `a < b`, so every finite value comes before `Infinity`, and `NaN`
 * comes before nothing. See `PRECISION.md`.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when `a < b` and the values do not coincide.
 * @example
 * ```ts
 * before(1, 2) // true
 * before(1, 1 + 1e-13) // false (rounding noise)
 * before(1e300, Infinity) // true
 * ```
 * @since 2.0.0
 */
export function before(
  a: number,
  b: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return a < b && !coincident(a, b, absolute, relative)
}

/**
 * Tests whether `a` comes at or before `b`, within the `coincident` band.
 *
 * The closed counterpart of `before`: `atMost(a, b)` is `!before(b, a)` for
 * every pair but those with a `NaN`, which nothing is at most. When either
 * value is non-finite the comparison is the exact `a <= b`. See
 * `PRECISION.md`.
 *
 * @param a - The first value.
 * @param b - The second value.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when `a <= b` or the values coincide.
 * @example
 * ```ts
 * atMost(2, 1) // false
 * atMost(1 + 1e-13, 1) // true (rounding noise)
 * ```
 * @since 2.0.0
 */
export function atMost(
  a: number,
  b: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return a <= b || coincident(a, b, absolute, relative)
}

/**
 * Tests whether `x` lies in the closed range `[low, high]`, within the
 * `coincident` band at each end.
 *
 * @param x - The value.
 * @param low - The lesser bound.
 * @param high - The greater bound.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when `atMost(low, x)` and `atMost(x, high)`.
 * @example
 * ```ts
 * within(0, 0, 1) // true
 * within(1 + 1e-13, 0, 1) // true (rounding noise)
 * within(2, 0, 1) // false
 * ```
 * @since 2.0.0
 */
export function within(
  x: number,
  low: number,
  high: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return atMost(low, x, absolute, relative) && atMost(x, high, absolute, relative)
}

/**
 * Tests whether `x` lies strictly inside the range `(low, high)`, beyond the
 * `coincident` band at each end.
 *
 * @param x - The value.
 * @param low - The lesser bound.
 * @param high - The greater bound.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when `before(low, x)` and `before(x, high)`.
 * @example
 * ```ts
 * inside(0.5, 0, 1) // true
 * inside(1e-13, 0, 1) // false (rounding noise from the bound)
 * ```
 * @since 2.0.0
 */
export function inside(
  x: number,
  low: number,
  high: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return before(low, x, absolute, relative) && before(x, high, absolute, relative)
}

/**
 * Tests whether the ranges `[a0, a1]` and `[b0, b1]` share more than a
 * point, beyond the `coincident` band. Ranges that only touch end to end, or
 * come within rounding noise of touching, do not overlap. A range without
 * length overlaps one that it lies strictly inside.
 *
 * Each range is given as its lesser bound, then its greater.
 *
 * @param a0 - The lesser bound of the first range.
 * @param a1 - The greater bound of the first range.
 * @param b0 - The lesser bound of the second range.
 * @param b1 - The greater bound of the second range.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when each range starts strictly before the other ends.
 * @example
 * ```ts
 * overlaps(0, 2, 1, 3) // true
 * overlaps(0, 1, 1, 2) // false (they only touch)
 * overlaps(1, 1, 0, 2) // true (a point strictly inside)
 * ```
 * @since 2.0.0
 */
export function overlaps(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return before(a0, b1, absolute, relative) && before(b0, a1, absolute, relative)
}

/**
 * Tests whether the ranges `[a0, a1]` and `[b0, b1]` share at least a
 * point, within the `coincident` band. Ranges that touch end to end, or come
 * within rounding noise of touching, do.
 *
 * Each range is given as its lesser bound, then its greater.
 *
 * @param a0 - The lesser bound of the first range.
 * @param a1 - The greater bound of the first range.
 * @param b0 - The lesser bound of the second range.
 * @param b1 - The greater bound of the second range.
 * @param absolute - Absolute floor of the band. Defaults to `EPSILON`.
 * @param relative - Magnitude-proportional term of the band. Defaults to `RELATIVE_TOLERANCE`.
 * @returns `true` when each range starts at or before the other ends.
 * @example
 * ```ts
 * touches(0, 1, 1, 2) // true
 * touches(0, 1, 2, 3) // false
 * ```
 * @since 2.0.0
 */
export function touches(
  a0: number,
  a1: number,
  b0: number,
  b1: number,
  absolute: number = EPSILON,
  relative: number = RELATIVE_TOLERANCE,
): boolean {
  return atMost(a0, b1, absolute, relative) && atMost(b0, a1, absolute, relative)
}

/**
 * Snaps near-zero values to exactly zero for stable sign tests.
 *
 * @param value - The value to test.
 * @param eps - The threshold below which `value` is considered zero.
 * @returns `0` when `|value| < eps`, otherwise `value` unchanged.
 * @since 2.0.0
 */
export function clampToZero(value: number, eps: number): number {
  return Math.abs(value) < eps ? 0 : value
}

/**
 * Rounds `value` to `precision` decimal places.
 *
 * Rounding follows the stored binary value, not its decimal spelling. The
 * double nearest `1.005` sits just below it, so `round(1.005, 2)` is `1`,
 * not `1.01`. Ties round toward `+Infinity` (`Math.round` semantics).
 * `-0` normalizes to `0`.
 *
 * @param value - The number to round.
 * @param precision - Decimal places to keep. Defaults to `8`.
 * @returns `value` rounded to `precision` decimal places, never `-0`.
 * @example
 * ```ts
 * round(1.23456789, 4) // 1.2346
 * round(1.005, 2) // 1 (the stored double sits below the tie)
 * ```
 * @since 1.0.4
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
 * Rounds `value` down, toward `-Infinity`, to `precision` decimal places.
 *
 * For negative values, down moves away from zero. `roundDown(-1.231, 2)` is
 * `-1.24`, not `-1.23`. Rounding follows the stored binary value, not its
 * decimal spelling. `-0` normalizes to `0`.
 *
 * @param value - The number to round down.
 * @param precision - Decimal places to keep. Defaults to `8`.
 * @returns `value` rounded down to `precision` decimal places, never `-0`.
 * @example
 * ```ts
 * roundDown(1.23456789, 4) // 1.2345
 * roundDown(-1.231, 2) // -1.24
 * ```
 * @since 1.0.4
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
 * Rounds `value` up, toward `+Infinity`, to `precision` decimal places.
 *
 * For negative values, up moves toward zero. `roundUp(-1.239, 2)` is
 * `-1.23`, not `-1.24`. Rounding follows the stored binary value, not its
 * decimal spelling. `-0` normalizes to `0`.
 *
 * @param value - The number to round up.
 * @param precision - Decimal places to keep. Defaults to `8`.
 * @returns `value` rounded up to `precision` decimal places, never `-0`.
 * @example
 * ```ts
 * roundUp(1.23456789, 4) // 1.2346
 * roundUp(-1.239, 2) // -1.23
 * ```
 * @since 1.0.9
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
   * Linearly interpolates between `a` (at `t = 0`) and `b` (at `t = 1`).
   *
   * Exact at the endpoints. `t = 0` returns exactly `a`, and `t = 1` exactly
   * `b`. `t` is not clamped. Values outside `[0, 1]` extrapolate along the
   * same line.
   *
   * @param t - The interpolation factor. Not restricted to `[0, 1]`.
   * @param a - The value at `t = 0`.
   * @param b - The value at `t = 1`.
   * @returns The interpolated value `b * t + a * (1 - t)`.
   * @example
   * ```ts
   * lerp(0.5, 10, 20) // 15
   * lerp(2, 10, 20) // 30 (extrapolates)
   * ```
   * @since 1.0.4
   */
  (t: number, a: number, b: number): number
  /**
   * Linearly interpolates between two values.
   *
   * @param a - The value at `t = 0`.
   * @param b - The value at `t = 1`.
   * @returns A function that takes the interpolation factor and returns the interpolated value.
   * @example
   * ```ts
   * lerp(10, 20)(0.5) // 15
   * ```
   * @since 1.0.4
   */
  (a: number, b: number): (t: number) => number
} = dual(3, (t: number, a: number, b: number) => b * t + a * (1 - t))

export const normalize: {
  /**
   * Normalizes `x` from the range `[a, b]` to the unit interval.
   *
   * Not clamped. `x` outside `[a, b]` maps outside `[0, 1]` in proportion.
   * Degenerate bounds `a === b` divide by zero, producing `NaN` (when
   * `x === a`) or `+/-Infinity`.
   *
   * The inverse of `lerp` over the same bounds:
   * `normalize(lerp(t, a, b), a, b)` recovers `t` up to rounding.
   *
   * @param x - The value to normalize.
   * @param a - Range start. Maps to `0`.
   * @param b - Range end. Maps to `1`.
   * @returns `(x - a) / (b - a)`.
   * @example
   * ```ts
   * normalize(15, 10, 20) // 0.5
   * normalize(25, 10, 20) // 1.5 (not clamped)
   * ```
   * @since 1.0.4
   */
  (x: number, a: number, b: number): number
  /**
   * Normalizes a value from the given range to the unit interval.
   *
   * @param a - Range start. Maps to `0`.
   * @param b - Range end. Maps to `1`.
   * @returns A function that takes a value and returns the normalized value.
   * @example
   * ```ts
   * normalize(10, 20)(15) // 0.5
   * ```
   * @since 1.0.4
   */
  (a: number, b: number): (x: number) => number
} = dual(3, (x: number, a: number, b: number) => (x - a) / (b - a))

export const remap: {
  /**
   * Remaps `x` from the source range `[x1, x2]` to the target range
   * `[y1, y2]`, preserving its relative position.
   *
   * Not clamped. `x` outside the source range maps proportionally outside
   * the target range. A degenerate source range (`x1 === x2`) divides by
   * zero, producing `NaN` or `+/-Infinity`.
   *
   * @param x - The value to remap.
   * @param x1 - Source range start. Maps to `y1`.
   * @param x2 - Source range end. Maps to `y2`.
   * @param y1 - Target range start.
   * @param y2 - Target range end.
   * @returns `y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)`.
   * @example
   * ```ts
   * remap(15, 10, 20, 0, 100) // 50
   * ```
   * @since 1.0.4
   */
  (x: number, x1: number, x2: number, y1: number, y2: number): number
  /**
   * Remaps a value from a source range to a target range.
   *
   * @param x1 - Source range start. Maps to `y1`.
   * @param x2 - Source range end. Maps to `y2`.
   * @param y1 - Target range start.
   * @param y2 - Target range end.
   * @returns A function that takes a value and returns the remapped value.
   * @example
   * ```ts
   * remap(10, 20, 0, 100)(15) // 50
   * ```
   * @since 1.0.4
   */
  (x1: number, x2: number, y1: number, y2: number): (x: number) => number
} = dual(
  5,
  (x: number, x1: number, x2: number, y1: number, y2: number) =>
    y1 + ((x - x1) / (x2 - x1)) * (y2 - y1),
)

export const clamp: {
  /**
   * Clamps `value` to the closed range `[min, max]`.
   *
   * `NaN` passes through unchanged, because it compares false against both bounds.
   * Assumes `min <= max`.
   *
   * @param value - The value to clamp.
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @returns `value` when it lies in `[min, max]`, otherwise the nearer bound.
   * @example
   * ```ts
   * clamp(25, 10, 20) // 20
   * ```
   * @since 1.0.4
   */
  (value: number, min: number, max: number): number
  /**
   * Clamps a value to the closed range `[min, max]`.
   *
   * @param min - The lower bound.
   * @param max - The upper bound.
   * @returns A function that takes a value and returns the clamped value.
   * @example
   * ```ts
   * clamp(10, 20)(25) // 20
   * ```
   * @since 1.0.4
   */
  (min: number, max: number): (value: number) => number
} = dual(3, (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value,
)

export const clip: {
  /**
   * Returns `value` when it lies in `[min, max]` and `onClip` when it does
   * not.
   *
   * Bounds are inclusive. `value === min` and `value === max` both count as
   * inside. `NaN` also passes through, because it compares false against
   * both bounds. It is never replaced by `onClip`. Where `clamp` moves an
   * out-of-range value to the nearer bound, `clip` replaces it wholesale.
   *
   * @param value - The value to test against the range.
   * @param min - The lower bound, inclusive.
   * @param max - The upper bound, inclusive.
   * @param onClip - The fallback returned when `value` is out of range.
   * @returns `value` when in `[min, max]`, otherwise `onClip`.
   * @example
   * ```ts
   * clip(25, 10, 20, 15) // 15
   * clip(12, 10, 20, 15) // 12
   * ```
   * @since 1.0.4
   */
  <T>(value: number, min: number, max: number, onClip: T): T | number
  /**
   * Returns the value when it lies in `[min, max]` and `onClip` when it
   * does not.
   *
   * @param min - The lower bound, inclusive.
   * @param max - The upper bound, inclusive.
   * @param onClip - The fallback returned when the value is out of range.
   * @returns A function that takes a value and returns it when in range, otherwise `onClip`.
   * @example
   * ```ts
   * clip(10, 20, 15)(25) // 15
   * ```
   * @since 1.0.4
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
 * minMax(10, 20) // [10, 20]
 * minMax(20, 10) // [10, 20]
 * ```
 * @since 1.0.4
 */
export function minMax(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a]
}

/**
 * Computes `n` modulo `m`, with the result taking the sign of `m`.
 *
 * This is floored-division modulo. The remainder operator `%` takes the
 * sign of `n` instead. `mod(-10, 3)` is `2` where `-10 % 3` is `-1`. The
 * result lies in `[0, m)` for positive `m` and `(m, 0]` for negative `m`.
 * `m === 0` produces `NaN`.
 *
 * @param n - The dividend.
 * @param m - The modulus. The result takes its sign.
 * @returns `n` modulo `m`, in `[0, m)` for positive `m`.
 * @example
 * ```ts
 * mod(10, 3) // 1
 * mod(-10, 3) // 2 (where -10 % 3 is -1)
 * ```
 * @since 1.0.9
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}
