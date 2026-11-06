/**
 * Trait brands for polygons.
 *
 * @since 2.0.0
 */

declare const ConvexId: unique symbol

/**
 * Trait brand for a polygon that is convex and non-degenerate: it winds
 * once around a region of non-zero area, and every corner turns the same
 * way. Collinear vertices and repeated vertices are allowed.
 *
 * Like every curvy brand, `Convex` is a claim at working precision. See
 * `PRECISION.md`.
 *
 * @since 2.0.0
 */
export type Convex = { readonly [ConvexId]: 'convex' }

/**
 * Phantom property key used by polygon interfaces to hold their `Traits`
 * type parameter. The runtime object never has a value at this key.
 *
 * @since 2.0.0
 */
export const PolygonTraits: unique symbol = Symbol.for('curvy/polygon/traits')
export type PolygonTraits = typeof PolygonTraits
