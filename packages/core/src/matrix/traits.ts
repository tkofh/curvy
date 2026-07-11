/**
 * Trait brands for matrices.
 *
 * Brands are phantom types: they exist only at the type level and carry no
 * runtime data. A matrix value at runtime is identical regardless of the
 * traits attached to its type. Refiners (`isInvertible`) and assertions
 * (`asInvertible`) on the `Matrix3x3` and `Matrix4x4` modules attach these
 * brands to the matrix's `Traits` parameter at the type level.
 *
 * @since 2.0.0
 */

declare const InvertibleId: unique symbol
/**
 * Brand for invertible matrices: matrices whose determinant exceeds
 * `RELATIVE_TOLERANCE` times the Hadamard bound (the product of the row
 * norms) — a scale-free singularity test. See `PRECISION.md` for the
 * mechanics.
 *
 * An `Invertible`-branded matrix narrows `inverse` (on `Matrix3x3` and
 * `Matrix4x4`) from `Solution.AtMostOne` to `Solution.One`.
 *
 * @since 2.0.0
 */
export type Invertible = { readonly [InvertibleId]: 'invertible' }

/**
 * Phantom property key used by matrix interfaces to hold their `Traits` type
 * parameter. The runtime object never has a value at this key — the `declare`
 * modifier on the impl class makes the property type-visible only. The symbol
 * itself is exported as a real value so that bundlers can resolve the
 * computed key reference even though the property is never assigned.
 *
 * @since 2.0.0
 */
export const MatrixTraits: unique symbol = Symbol.for('curvy/matrix/traits')
export type MatrixTraits = typeof MatrixTraits
