/**
 * Trait brands for piecewise polynomials.
 *
 * Brands are phantom types. They exist only at the type level and carry no
 * runtime data. A `Piecewise` value at runtime is identical regardless of the
 * traits attached to its type. Refiners (`isContiguous`) and assertions
 * (`asContiguous`) on the `Piecewise` module attach these brands to the value's
 * `Trait` parameter at the type level.
 *
 * The base `Piecewise<P>` is a *partial* function: its pieces are ordered and
 * non-overlapping in x, but may leave gaps. Brands narrow that: `Contiguous`
 * rules out gaps, `Continuous` additionally rules out jumps at the joins, and
 * `Monotonic` is a claim about the function's y over its whole domain.
 *
 * @since 2.0.0
 */

declare const ContiguousId: unique symbol
/**
 * Brand for piecewise polynomials whose pieces tile their domain with no gaps:
 * each piece's x-domain starts where the previous one ended (within
 * `coincident` tolerance; see `PRECISION.md`). A `Contiguous` function is total
 * on `[domain.start, domain.end]` — every x in that range lands in some piece.
 *
 * This is the brand a consumer that must cover the whole domain requires, e.g.
 * emitting a gapless `@media` ladder from the pieces.
 *
 * @since 2.0.0
 */
export type Contiguous = { readonly [ContiguousId]: 'contiguous' }

declare const ContinuousId: unique symbol
/**
 * Brand for piecewise polynomials that are contiguous *and* agree in value
 * across every join (`C^0`): the left piece's value at its end equals the right
 * piece's value at its start, within `coincident`. Continuity across a break
 * presupposes the break is shared, so `Continuous` implies `Contiguous`.
 *
 * @since 2.0.0
 */
export type Continuous = Contiguous & { readonly [ContinuousId]: 'continuous' }

declare const MonotonicId: unique symbol
/**
 * Brand for piecewise polynomials whose y is monotonic across the whole
 * domain. The image is then the two endpoint values, and the function is
 * invertible — the property an `x`-from-`y` solve requires.
 *
 * @since 2.0.0
 */
export type Monotonic = { readonly [MonotonicId]: 'monotonic' }

/**
 * Phantom property key used by the `Piecewise` interface to hold its `Trait`
 * type parameter. The runtime object never has a value at this key.
 *
 * @since 2.0.0
 */
export const PiecewiseTraits: unique symbol = Symbol.for('curvy/piecewise/traits')
export type PiecewiseTraits = typeof PiecewiseTraits
