/**
 * Trait brands for affine transforms.
 *
 * The `Invertible` brand is shared with matrices (an invertible `Affine2d`
 * is one whose underlying 3×3 matrix is invertible), so it is re-exported
 * from the matrix traits module rather than redeclared here.
 *
 * @since 2.0.0
 */

export type { Invertible } from '../matrix/traits.ts'

/**
 * Phantom property key used by affine interfaces to hold their `Traits` type
 * parameter. The runtime object never has a value at this key — the `declare`
 * modifier on the impl class makes the property type-visible only.
 *
 * @since 2.0.0
 */
export const AffineTraits: unique symbol = Symbol.for('curvy/transform/affine/traits')
export type AffineTraits = typeof AffineTraits
