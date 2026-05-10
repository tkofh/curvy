/**
 * Trait brands for paths.
 *
 * Brands are phantom types — they exist only at the type level and carry no
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

/**
 * Phantom property key used by path interfaces to hold their `Trait` type
 * parameter. The runtime object never has a value at this key.
 *
 * @since 2.0.0
 */
export const PathTraits: unique symbol = Symbol.for('curvy/path/traits')
export type PathTraits = typeof PathTraits
