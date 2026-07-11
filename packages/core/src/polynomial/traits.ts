/**
 * Trait brands for polynomials.
 *
 * Brands are phantom types. They exist only at the type level and carry no
 * runtime data. A polynomial value at runtime is identical regardless of the
 * traits attached to its type. Refiners (`isMonotonic`, `isIncreasing`, ...) and
 * assertions (`asMonotonic`, ...) on each polynomial module attach these brands
 * to the polynomial's `Traits` parameter at the type level.
 *
 * The intersection model is "trait accumulation": a polynomial typed as
 * `LinearPolynomial<Increasing>` carries both the `Monotonic` and `Increasing`
 * brands, since `Increasing` extends `Monotonic`.
 *
 * @since 2.0.0
 */

declare const MonotonicId: unique symbol
/**
 * Brand for *strictly* monotonic polynomials. `monotonicity()` returns
 * `Increasing` or `Decreasing`. The constant case is excluded. Constants
 * have no useful inverse refinement.
 *
 * @since 2.0.0
 */
export type Monotonic = { readonly [MonotonicId]: 'monotonic' }

declare const IncreasingId: unique symbol
/**
 * Brand for strictly increasing polynomials. Implies `Monotonic`.
 *
 * @since 2.0.0
 */
export type Increasing = Monotonic & { readonly [IncreasingId]: 'increasing' }

declare const DecreasingId: unique symbol
/**
 * Brand for strictly decreasing polynomials. Implies `Monotonic`.
 *
 * @since 2.0.0
 */
export type Decreasing = Monotonic & { readonly [DecreasingId]: 'decreasing' }

/**
 * Phantom property key used by polynomial interfaces to hold their `Traits`
 * type parameter. The runtime object never has a value at this key — the
 * `declare` modifier on the impl class makes the property type-visible only.
 * The symbol itself is exported as a real value so that bundlers can resolve
 * the computed key reference even though the property is never assigned.
 *
 * @since 2.0.0
 */
export const PolynomialTraits: unique symbol = Symbol.for('curvy/polynomial/traits')
export type PolynomialTraits = typeof PolynomialTraits
