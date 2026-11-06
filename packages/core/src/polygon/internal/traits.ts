/**
 * Trait brands for polygons.
 *
 * @since 2.0.0
 */

declare const ConvexId: unique symbol
declare const PlanarId: unique symbol

/**
 * Trait brand for a polygon that is convex and non-degenerate: it winds
 * once around a region of non-zero area, and every corner turns the same
 * way. Collinear vertices and repeated vertices are allowed. A convex
 * `Polygon3d` also lies in a plane, so the checks and operations that
 * grant it `Convex` grant `Planar` too.
 *
 * Like every curvy brand, `Convex` is a claim at working precision. See
 * `PRECISION.md`.
 *
 * @since 2.0.0
 */
export type Convex = { readonly [ConvexId]: 'convex' }

/**
 * Trait brand for a `Polygon3d` that lies in a plane and has non-zero
 * area, so the plane is determined: every vertex lies on it, and the
 * vertices don't all fall on one line.
 *
 * Like every curvy brand, `Planar` is a claim at working precision. See
 * `PRECISION.md`.
 *
 * @since 2.0.0
 */
export type Planar = { readonly [PlanarId]: 'planar' }

/**
 * Phantom property key used by polygon interfaces to hold their `Traits`
 * type parameter. The runtime object never has a value at this key.
 *
 * @since 2.0.0
 */
export const PolygonTraits: unique symbol = Symbol.for('curvy/polygon/traits')
export type PolygonTraits = typeof PolygonTraits
