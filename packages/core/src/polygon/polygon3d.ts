import type { Plane3d } from '../plane/plane3d.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine3d } from '../transform/affine3d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector3 } from '../vector/vector3.ts'
import * as internal from './internal/polygon3d.ts'
import type { Convex, Planar, PolygonTraits } from './internal/traits.ts'

export type { Convex, Planar } from './internal/traits.ts'

/**
 * A closed polygon in 3D space, such as a face of a solid: a cycle of
 * vertices joined by straight edges, with an implicit closing edge from
 * the last vertex back to the first.
 *
 * Construct with `make`, `fromArray`, or `fromTuples`. Any three or more
 * finite vertices make a polygon, including ones that don't lie in a
 * plane. Two trait brands narrow it:
 *
 * - `Planar`, from `isPlanar` and `asPlanar`, promises a plane, which
 *   `plane` returns.
 * - `Convex`, from `isConvex` and `asConvex`, is what `clip` and `split`
 *   take. A convex 3D polygon is also planar, so those checks grant
 *   `Planar` as well.
 *
 * Orientation comes from the right-hand rule. The polygon's `normal`
 * points toward the side from which its vertices run counterclockwise, in
 * the usual right-handed picture. A face of a solid listed that way from
 * outside has an outward normal.
 *
 * Iterating a polygon yields its vertices in order, so it spreads into an
 * array and works with `for..of`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands such as `Convex` and `Planar`. The runtime value carries no trait data.
 *
 * @since 2.0.0
 */
export interface Polygon3d<out Traits = unknown> extends Value.Instance, Iterable<Vector3> {
  readonly '~curvy/Polygon3d': '~curvy/Polygon3d'
  readonly [PolygonTraits]: Traits
  /**
   * The vertices in order. The closing edge runs from the last vertex back
   * to the first, so the first vertex is not repeated at the end.
   */
  readonly vertices: ReadonlyArray<Vector3>
}

/**
 * The two pieces of a convex polygon cut by a plane, as `split` returns
 * them.
 *
 * @since 2.0.0
 */
export interface Split {
  /**
   * The piece on the plane's front side, the side its normal points
   * toward. `none` when no part of the polygon lies in front, unless it
   * lies in the plane.
   */
  readonly front: Solution.AtMostOne<Polygon3d<Convex & Planar>>
  /**
   * The piece on the plane's back side. `none` when no part of the polygon
   * lies behind, unless it lies in the plane.
   */
  readonly back: Solution.AtMostOne<Polygon3d<Convex & Planar>>
}

/**
 * Checks if a value is a `Polygon3d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Polygon3d`, `false` otherwise.
 * @since 2.0.0
 */
export const isPolygon3d: (p: unknown) => p is Polygon3d = internal.isPolygon3d

/**
 * Creates a `Polygon3d` from three or more vertices.
 *
 * @param p0 - The first vertex.
 * @param p1 - The second vertex.
 * @param p2 - The third vertex.
 * @param rest - Any further vertices, in order.
 * @returns A polygon with the given vertices, closed from the last back to
 *   the first.
 * @throws `Error` when a vertex coordinate is not finite.
 * @since 2.0.0
 */
export const make: (
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  ...rest: ReadonlyArray<Vector3>
) => Polygon3d = internal.make

/**
 * Creates a `Polygon3d` from an array of vertices.
 *
 * The polygon keeps its own copy of the array, so later changes to the
 * input don't reach it.
 *
 * @param vertices - The vertices in order. Don't repeat the first vertex at
 *   the end: the closing edge is implicit.
 * @returns A polygon with the given vertices.
 * @throws `Error` when there are fewer than 3 vertices, or a vertex
 *   coordinate is not finite.
 * @since 2.0.0
 */
export const fromArray: (vertices: ReadonlyArray<Vector3>) => Polygon3d = internal.fromArray

/**
 * Creates a `Polygon3d` from an array of `[x, y, z]` tuples.
 *
 * @param tuples - The vertices in order, as `[x, y, z]` triples.
 * @returns A polygon with the given vertices.
 * @throws `Error` when there are fewer than 3 tuples, or a coordinate is
 *   not finite.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number, number]>) => Polygon3d =
  internal.fromTuples

export const equals: {
  /**
   * Checks whether two polygons have the same vertices in the same order,
   * comparing each pair with `Vector3.equals`.
   *
   * The comparison is of representations, not regions. The same face
   * started from a different corner, or traced the other way, is not
   * equal.
   *
   * @param a - The first polygon.
   * @param b - The second polygon.
   * @returns `true` when both have the same vertex count and every vertex
   *   pair coincides.
   * @since 2.0.0
   */
  (a: Polygon3d, b: Polygon3d): boolean
  /**
   * Checks whether two polygons have the same vertices in the same order.
   *
   * @param b - The polygon to compare against.
   * @returns A function that takes a polygon and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Polygon3d): (a: Polygon3d) => boolean
} = internal.equals

/**
 * The unit normal of a polygon, by Newell's method.
 *
 * The normal follows the right-hand rule: seen from the side it points
 * toward, the vertices run counterclockwise in the usual right-handed
 * picture. For a triangle `(a, b, c)` it is `cross(b - a, c - a)`,
 * normalized. Newell's method averages over every edge, so a face whose
 * vertices stray slightly from a plane still gets the normal of the plane
 * that fits it best.
 *
 * @param p - The polygon.
 * @returns The unit normal, or `none` when the polygon has no area at
 *   working precision. See `PRECISION.md`.
 * @example
 * ```ts
 * const face = Polygon3d.fromTuples([[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]])
 *
 * Polygon3d.normal(face) // Solution.one(Vector3(0, 0, 1))
 * Polygon3d.normal(Polygon3d.reverse(face)) // Solution.one(Vector3(0, 0, -1))
 * ```
 * @since 2.0.0
 */
export const normal: (p: Polygon3d) => Solution.AtMostOne<Vector3> = internal.normal

/**
 * The area a polygon encloses, seen along its normal.
 *
 * For a planar polygon this is its area. For one that strays from a
 * plane, it is the area of its shadow on the plane that fits it best.
 *
 * @param p - The polygon.
 * @returns The area, in squared coordinate units. Never negative.
 * @since 2.0.0
 */
export const area: (p: Polygon3d) => number = internal.area

/**
 * The total length of a polygon's edges, closing edge included.
 *
 * @param p - The polygon.
 * @returns The perimeter, in coordinate units.
 * @since 2.0.0
 */
export const perimeter: (p: Polygon3d) => number = internal.perimeter

/**
 * The centroid of the region a polygon encloses: its center of mass as a
 * uniform flat plate, not the average of its vertices.
 *
 * Adding vertices along an edge moves a vertex average but leaves the
 * centroid alone.
 *
 * @param p - The polygon.
 * @returns The area centroid, or `none` when the polygon has no area at
 *   working precision, under the same cutoff as `normal`.
 * @since 2.0.0
 */
export const centroid: (p: Polygon3d) => Solution.AtMostOne<Vector3> = internal.centroid

/**
 * Checks if a polygon lies in a plane, narrowing it to
 * `Polygon3d<T & Planar>`.
 *
 * Planar here means two things:
 *
 * - the polygon has area at working precision, as `normal` judges it, so
 *   its vertices don't all fall on one line
 * - every vertex lies on the plane through the average of the vertices,
 *   perpendicular to `normal`, within the band `clip` uses to call a
 *   vertex on a plane
 *
 * The band scales with the polygon's coordinates. See `PRECISION.md`.
 *
 * @param p - The polygon to check.
 * @returns `true` when `p` is planar.
 * @since 2.0.0
 */
export const isPlanar: <T>(p: Polygon3d<T>) => p is Polygon3d<T & Planar> = internal.isPlanar

/**
 * Asserts that a polygon lies in a plane, under the definition `isPlanar`
 * uses.
 *
 * @param p - The polygon to assert against.
 * @returns The same polygon, typed with the `Planar` brand.
 * @throws `Error` when `p` is not planar.
 * @example
 * ```ts
 * const face = Polygon3d.asPlanar(
 *   Polygon3d.fromTuples([[0, 0, 2], [1, 0, 2], [1, 1, 2], [0, 1, 2]]),
 * )
 *
 * Polygon3d.plane(face) // Plane3d(normal (0, 0, 1), offset 2)
 * ```
 * @since 2.0.0
 */
export const asPlanar: <T>(p: Polygon3d<T>) => Polygon3d<T & Planar> = internal.asPlanar

/**
 * The plane a planar polygon lies in.
 *
 * The plane passes through the average of the vertices, perpendicular to
 * `normal`, and its front is the side the normal points toward. A face of
 * a solid listed counterclockwise from outside gives a plane facing out of
 * the solid.
 *
 * @param p - The planar polygon, from `asPlanar`, `isPlanar`, or any
 *   operation that grants `Convex`.
 * @returns The polygon's plane.
 * @since 2.0.0
 */
export const plane: (p: Polygon3d<Planar>) => Plane3d = internal.plane

/**
 * Checks if a polygon is planar and convex, narrowing it to
 * `Polygon3d<T & Convex & Planar>`.
 *
 * Convex here means four things:
 *
 * - the polygon has area at working precision, as `normal` judges it
 * - every vertex lies on its plane, as `isPlanar` judges it
 * - seen along the normal, every corner turns the same way
 * - the outline goes around once, so a pentagram is rejected
 *
 * Collinear vertices and repeated vertices are allowed. A vertex that
 * folds straight back along its incoming edge is not. Both tolerances
 * scale with the polygon's coordinates. See `PRECISION.md`.
 *
 * @param p - The polygon to check.
 * @returns `true` when `p` is planar and convex.
 * @since 2.0.0
 */
export const isConvex: <T>(p: Polygon3d<T>) => p is Polygon3d<T & Convex & Planar> =
  internal.isConvex

/**
 * Asserts that a polygon is planar and convex, under the definition
 * `isConvex` uses.
 *
 * @param p - The polygon to assert against.
 * @returns The same polygon, typed with the `Convex` and `Planar` brands.
 * @throws `Error` when `p` is not planar and convex.
 * @since 2.0.0
 */
export const asConvex: <T>(p: Polygon3d<T>) => Polygon3d<T & Convex & Planar> = internal.asConvex

export const clip: {
  /**
   * Cuts a convex polygon with a plane and keeps the part on the plane's
   * front side, by the Sutherland–Hodgman step.
   *
   * A point `q` is kept when `Plane3d.signedDistance(plane, q) >= 0`.
   *
   * - Vertices in front of the plane or on it stay exactly as they were.
   * - Each edge that crosses the plane gains a vertex at the crossing.
   * - A polygon with no vertex behind the plane comes back unchanged, the
   *   same instance. That includes a polygon lying in the plane.
   *
   * A vertex within rounding distance of the plane counts as on it, with a
   * cutoff that scales with the coordinates. See `PRECISION.md`. Use
   * `split` to keep both sides, and `Plane3d.flip` to keep the back.
   *
   * @param p - The convex polygon to cut.
   * @param plane - The cutting plane, facing the side to keep.
   * @returns The kept piece, still convex and planar and with the same
   *   normal as `p`, or `none` when nothing of non-zero area remains.
   * @example
   * ```ts
   * const face = Polygon3d.asConvex(
   *   Polygon3d.fromTuples([[0, 0, 0], [4, 0, 0], [4, 4, 0], [0, 4, 0]]),
   * )
   *
   * // Keep the part with x <= 1: the plane x = 1, facing -x.
   * Polygon3d.clip(face, Plane3d.make(Vector3.make(-1, 0, 0), -1))
   * // Solution.one(Polygon3d((0, 0, 0), (1, 0, 0), (1, 4, 0), (0, 4, 0)))
   * ```
   * @since 2.0.0
   */
  (p: Polygon3d<Convex>, plane: Plane3d): Solution.AtMostOne<Polygon3d<Convex & Planar>>
  /**
   * Cuts a convex polygon with a plane and keeps the part on its front
   * side.
   *
   * @param plane - The cutting plane, facing the side to keep.
   * @returns A function that takes a convex polygon and returns the kept
   *   piece, or `none` when nothing remains.
   * @since 2.0.0
   */
  (plane: Plane3d): (p: Polygon3d<Convex>) => Solution.AtMostOne<Polygon3d<Convex & Planar>>
} = internal.clip

export const split: {
  /**
   * Cuts a convex polygon with a plane into the pieces on either side.
   *
   * `front` is the piece on the side the plane's normal points toward,
   * `back` the other. Both are what `clip` keeps with the plane one way and
   * then flipped. Vertices on the plane belong to both pieces, and an edge
   * that crosses the plane gains the same crossing vertex in each. A
   * polygon lying in the plane is both pieces.
   *
   * @param p - The convex polygon to cut.
   * @param plane - The cutting plane.
   * @returns The `front` and `back` pieces. When the plane misses the
   *   polygon, one side holds `p` itself and the other is `none`. When `p`
   *   lies in the plane, both hold it.
   * @since 2.0.0
   */
  (p: Polygon3d<Convex>, plane: Plane3d): Split
  /**
   * Cuts a convex polygon with a plane into the pieces on either side.
   *
   * @param plane - The cutting plane.
   * @returns A function that takes a convex polygon and returns its `front`
   *   and `back` pieces.
   * @since 2.0.0
   */
  (plane: Plane3d): (p: Polygon3d<Convex>) => Split
} = internal.split

/**
 * Reverses a polygon's vertex order, which flips its normal.
 *
 * @param p - The polygon.
 * @returns A polygon with the same vertices in reverse order, and the same
 *   trait brands as `p`.
 * @since 2.0.0
 */
export const reverse: <T>(p: Polygon3d<T>) => Polygon3d<T> = internal.reverse

export const transform: {
  /**
   * Applies an `Affine3d` transform to every vertex of a polygon.
   *
   * The result carries no trait brands, matching every other curvy
   * `transform`. An affine image of a planar polygon is planar, and of a
   * convex one convex, unless the transform flattens it, so re-assert with
   * `asPlanar` or `asConvex` where needed.
   *
   * A transform that mirrors space keeps the vertex order, which turns the
   * face inside out. The result's normal is then the negation of
   * `Affine3d.applyNormal` applied to the original's. Follow with `reverse`
   * to keep a solid's faces facing out.
   *
   * @param p - The polygon.
   * @param a - The affine transform.
   * @returns A polygon whose vertices are the images of `p`'s.
   * @since 2.0.0
   */
  (p: Polygon3d, a: Affine3d): Polygon3d
  /**
   * Applies an `Affine3d` transform to every vertex of a polygon.
   *
   * @param a - The affine transform.
   * @returns A function that takes a polygon and returns the transformed
   *   polygon.
   * @since 2.0.0
   */
  (a: Affine3d): (p: Polygon3d) => Polygon3d
} = internal.transform
