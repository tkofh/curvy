import { RELATIVE_TOLERANCE } from '../number.ts'

/**
 * Classification of a function's monotonicity on an interval.
 *
 * Encoded as a 2-bit sign-coverage bitmask of the function's derivative:
 *   - bit 0 (`Increasing`): derivative takes positive values
 *   - bit 1 (`Decreasing`): derivative takes negative values
 *
 * The four states fall out of the encoding:
 *
 *   - `0` (`Constant`): derivative = 0 everywhere in the interval
 *   - `1` (`Increasing`): >= 0, with at least one value > 0
 *   - `2` (`Decreasing`): <= 0, with at least one value < 0
 *   - `3` (`None`): crosses zero
 *
 * The encoding makes the bitwise OR of two adjacent subintervals'
 * classifications the classification of their union, so monotonicity can
 * be computed by recursive subdivision without custom combine logic.
 *
 * @since 2.0.0
 */
export type Monotonicity = 0 | 1 | 2 | 3

/**
 * Subset of `Monotonicity` excluding the indeterminate `None` state.
 * Returned by classifiers operating on functions whose derivative cannot
 * change sign on the interval (e.g., linear polynomials, whose derivative is
 * constant).
 *
 * @since 2.0.0
 */
export type GuaranteedMonotonicity = 0 | 1 | 2

/**
 * Derivative is identically zero on the interval. The function is constant.
 *
 * @since 2.0.0
 */
export const Constant = 0 as const

/**
 * Derivative is non-negative in the interval with at least one strictly
 * positive sample. The function is strictly increasing.
 *
 * @since 2.0.0
 */
export const Increasing = 1 as const

/**
 * Derivative is non-positive in the interval with at least one strictly
 * negative sample. The function is strictly decreasing.
 *
 * @since 2.0.0
 */
export const Decreasing = 2 as const

/**
 * Derivative crosses zero on the interval. The function has at least one
 * interior extremum and is not monotonic in either direction.
 *
 * @since 2.0.0
 */
export const None = 3 as const

/**
 * Checks if a classification is strictly directional: `Increasing` or
 * `Decreasing`, the cases that admit unique inverse.
 *
 * @param m - The monotonicity classification.
 * @returns `true` when `m` is `Increasing` or `Decreasing`, narrowing to `1 | 2`.
 * @since 2.0.0
 */
export const isStrict = (m: Monotonicity): m is 1 | 2 => m === Increasing || m === Decreasing

/**
 * Classifies the monotonicity of a function given its values at two interval
 * endpoints, when the function is known a priori to be monotonic on the
 * spanning interval (e.g., a linear polynomial).
 *
 * The comparison is exact. Endpoint values one ulp apart classify as
 * increasing or decreasing, never `Constant`. Use `fromDerivativeRange`
 * when the inputs carry rounding noise.
 *
 * @param s0 - The function value at the start of the interval.
 * @param s1 - The function value at the end of the interval.
 * @returns The classification: `Increasing`, `Decreasing`, or `Constant`.
 * @since 2.0.0
 */
export const fromComparison = (s0: number, s1: number): GuaranteedMonotonicity =>
  s0 < s1 ? Increasing : s0 > s1 ? Decreasing : Constant

/**
 * Classifies monotonicity from the extreme values of a function's derivative
 * over an interval, tolerating rounding noise in the derivative.
 *
 * `min` and `max` must be the true range extremes of the derivative on the
 * interval (for a polynomial derivative, its values at the interval endpoints
 * and at any interior stationary point). Each bound sets its sign-coverage
 * bit only when it exceeds the tolerance, so a derivative that merely grazes
 * zero, or dips past it by an amount indistinguishable from rounding noise,
 * does not register as a crossing.
 *
 * The default tolerance is `RELATIVE_TOLERANCE` scaled by the larger
 * bound magnitude, making the classification invariant under scaling of the
 * input data. Derivative values are used rather than derivative *root
 * locations* because values are well-conditioned where roots are not. A root
 * computed from rounded coefficients can land on either side of an interval
 * boundary, while the value it corresponds to stays pinned near zero.
 *
 * @param min - The smallest derivative value reached on the interval.
 * @param max - The largest derivative value reached on the interval.
 * @param tolerance - Absolute threshold below which a derivative value is treated as zero. Defaults to `RELATIVE_TOLERANCE * max(|min|, |max|)`.
 * @returns The sign-coverage classification.
 * @example
 * ```ts
 * fromDerivativeRange(0, 2) // Increasing
 * fromDerivativeRange(-1e-15, 2) // Increasing (the dip is below tolerance)
 * fromDerivativeRange(-1, 2) // None
 * ```
 * @since 2.0.0
 */
export const fromDerivativeRange = (min: number, max: number, tolerance?: number): Monotonicity => {
  const t = tolerance ?? RELATIVE_TOLERANCE * Math.max(Math.abs(min), Math.abs(max))
  return ((max > t ? Increasing : Constant) | (min < -t ? Decreasing : Constant)) as Monotonicity
}
