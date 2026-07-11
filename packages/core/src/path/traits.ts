/**
 * Trait brands for paths.
 *
 * Brands are phantom types. They exist only at the type level and carry no
 * runtime data. Refiners (`isContinuous`) and assertions (`asContinuous`) on
 * each path module attach these brands to the path's `Trait` parameter at the
 * type level.
 *
 * @since 2.0.0
 */

declare const ContinuousId: unique symbol
/**
 * Brand for paths whose adjacent curves connect at their join points (G⁰
 * continuity). Calling `toPathData` on a `Continuous` path skips the
 * per-segment discontinuity check and emits a single `M` followed by drawing
 * commands.
 *
 * @since 2.0.0
 */
export type Continuous = { readonly [ContinuousId]: 'continuous' }

declare const MonotonicXId: unique symbol
/**
 * Brand for paths whose x-coordinate is monotonic as the path parameter
 * `u ∈ [0, 1]` advances. Implies every segment's x-polynomial is monotonic
 * and that adjacent segments' x-ranges don't overlap (so the path is
 * monotonic in x across the join, modulo a small floating-point tolerance).
 *
 * `Monotonic{X,Y}` is the brand `solveAt{X,Y}` requires.
 *
 * @since 2.0.0
 */
export type MonotonicX = { readonly [MonotonicXId]: 'monotonic-x' }

declare const IncreasingXId: unique symbol
/**
 * Brand for paths whose x-coordinate is non-decreasing as the path parameter
 * advances. Implies `MonotonicX`.
 *
 * @since 2.0.0
 */
export type IncreasingX = MonotonicX & { readonly [IncreasingXId]: 'increasing-x' }

declare const DecreasingXId: unique symbol
/**
 * Brand for paths whose x-coordinate is non-increasing as the path parameter
 * advances. Implies `MonotonicX`.
 *
 * @since 2.0.0
 */
export type DecreasingX = MonotonicX & { readonly [DecreasingXId]: 'decreasing-x' }

declare const MonotonicYId: unique symbol
/**
 * Brand for paths whose y-coordinate is monotonic as the path parameter
 * advances. The y analog of `MonotonicX`.
 *
 * @since 2.0.0
 */
export type MonotonicY = { readonly [MonotonicYId]: 'monotonic-y' }

declare const IncreasingYId: unique symbol
/**
 * Brand for paths whose y-coordinate is non-decreasing as the path parameter
 * advances. Implies `MonotonicY`.
 *
 * @since 2.0.0
 */
export type IncreasingY = MonotonicY & { readonly [IncreasingYId]: 'increasing-y' }

declare const DecreasingYId: unique symbol
/**
 * Brand for paths whose y-coordinate is non-increasing as the path parameter
 * advances. Implies `MonotonicY`.
 *
 * @since 2.0.0
 */
export type DecreasingY = MonotonicY & { readonly [DecreasingYId]: 'decreasing-y' }

/**
 * Phantom property key used by path interfaces to hold their `Trait` type
 * parameter. The runtime object never has a value at this key.
 *
 * @since 2.0.0
 */
export const PathTraits: unique symbol = Symbol.for('curvy/path/traits')
export type PathTraits = typeof PathTraits
