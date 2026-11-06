/**
 * Trait brands for quaternions.
 *
 * @since 2.0.0
 */

declare const UnitId: unique symbol

/**
 * Trait brand for a quaternion of length 1, the kind that represents a 3D
 * rotation.
 *
 * Like every curvy brand, `Unit` is a claim at working precision: the
 * squared length is within `EPSILON` of `1`. See `PRECISION.md`.
 *
 * @since 2.0.0
 */
export type Unit = { readonly [UnitId]: 'unit' }

/**
 * Phantom property key used by the quaternion interface to hold its
 * `Traits` type parameter. The runtime object never has a value at this
 * key.
 *
 * @since 2.0.0
 */
export const QuaternionTraits: unique symbol = Symbol.for('curvy/quaternion/traits')
export type QuaternionTraits = typeof QuaternionTraits
