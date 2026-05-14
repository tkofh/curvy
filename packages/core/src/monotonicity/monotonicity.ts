/**
 * Classification of a function's monotonicity on an interval.
 *
 * Encoded as a 2-bit sign-coverage bitmask of the function's derivative:
 *   - bit 0 (`Increasing`) — derivative takes positive values
 *   - bit 1 (`Decreasing`) — derivative takes negative values
 *
 * The four states fall out of the encoding:
 *
 *   | value | name         | derivative on the interval        |
 *   |-------|--------------|-----------------------------------|
 *   |   `0` | `Constant`   | ≡ 0                               |
 *   |   `1` | `Increasing` | ≥ 0, with at least one `> 0`      |
 *   |   `2` | `Decreasing` | ≤ 0, with at least one `< 0`      |
 *   |   `3` | `None`       | crosses zero                      |
 *
 * The numeric encoding is principled, not arbitrary: the bitwise OR of two
 * adjacent subintervals' classifications gives the classification of their
 * union, which lets monotonicity be computed by recursive subdivision
 * without any custom combine logic.
 *
 * @since 2.0.0
 */
export type Monotonicity = 0 | 1 | 2 | 3

/**
 * Subset of {@link Monotonicity} excluding the indeterminate `None` state.
 * Returned by classifiers operating on functions whose derivative cannot
 * change sign on the interval (e.g. linear polynomials, whose derivative is
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
 * Derivative is non-negative on the interval with at least one strictly
 * positive sample. The function is strictly increasing.
 *
 * @since 2.0.0
 */
export const Increasing = 1 as const

/**
 * Derivative is non-positive on the interval with at least one strictly
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
 * Type-narrowing predicate: refines a `Monotonicity` to `Increasing |
 * Decreasing` — the strict cases that admit a unique inverse.
 *
 * @param m - The monotonicity classification.
 * @returns `true` when `m` is `Increasing` or `Decreasing`.
 * @since 2.0.0
 */
export const isStrict = (m: Monotonicity): m is 1 | 2 => m === Increasing || m === Decreasing

/**
 * Classifies the monotonicity of a function given its values at two interval
 * endpoints, when the function is known a priori to be monotonic on the
 * spanning interval (e.g. a linear polynomial).
 *
 * @param s0 - The function value at the start of the interval.
 * @param s1 - The function value at the end of the interval.
 * @returns The classification — `Increasing`, `Decreasing`, or `Constant`.
 * @since 2.0.0
 */
export const fromComparison = (s0: number, s1: number): GuaranteedMonotonicity =>
  s0 < s1 ? Increasing : s0 > s1 ? Decreasing : Constant
