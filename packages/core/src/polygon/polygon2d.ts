import type { Winding } from '../coordinates/coordinateSystem.ts'
import type { Closed } from '../interval/interval.ts'
import type { Interval2d } from '../interval/interval2d.ts'
import type { LinearPath2d } from '../path/linear2d.ts'
import type { RationalCubicPath2d } from '../path/rationalCubic2d.ts'
import type * as Solution from '../solution/solution.ts'
import type { Affine2d } from '../transform/affine2d.ts'
import type { Value } from '../utils/value.ts'
import type { Vector2 } from '../vector/vector2.ts'
import * as internal from './internal/polygon2d.ts'
import type { Convex, PolygonTraits } from './internal/traits.ts'

export type { Convex } from './internal/traits.ts'

/**
 * A closed polygon in the plane: a cycle of vertices joined by straight
 * edges, with an implicit closing edge from the last vertex back to the
 * first.
 *
 * Construct with `make`, `fromArray`, `fromTuples`, or `convexHull`. Any
 * three or more finite vertices make a polygon, including collinear,
 * repeated, and self-intersecting ones. Operations that need more state
 * it in their types: clipping, splitting, and insetting take a
 * `Polygon2d<Convex>`, which `isConvex` and `asConvex` establish.
 *
 * Orientation uses the coordinates module's `Winding`. Vertices that rotate
 * `+x` toward `+y` wind `'clockwise'`, as they appear in an SVG viewport
 * where y points down. That is counterclockwise on a y-up plot.
 *
 * Iterating a polygon yields its vertices in order, so it spreads into an
 * array and works with `for..of`.
 *
 * The `Traits` type parameter is a phantom marker that accumulates trait
 * brands such as `Convex`. The runtime value carries no trait data.
 *
 * @since 2.0.0
 */
export interface Polygon2d<out Traits = unknown> extends Value.Instance, Iterable<Vector2> {
  readonly '~curvy/Polygon2d': '~curvy/Polygon2d'
  readonly [PolygonTraits]: Traits
  /**
   * The vertices in order. The closing edge runs from the last vertex back
   * to the first, so the first vertex is not repeated at the end.
   */
  readonly vertices: ReadonlyArray<Vector2>
}

/**
 * The two pieces of a convex polygon cut by a line, as `split` returns
 * them.
 *
 * @since 2.0.0
 */
export interface Split {
  /**
   * The piece on the side the cut's normal points toward. `none` when no
   * part of the polygon lies strictly on that side.
   */
  readonly front: Solution.AtMostOne<Polygon2d<Convex>>
  /**
   * The piece on the side the cut's normal points away from. `none` when no
   * part of the polygon lies strictly on that side.
   */
  readonly back: Solution.AtMostOne<Polygon2d<Convex>>
}

/**
 * Checks if a value is a `Polygon2d`.
 *
 * True only for values built by this module's constructors, which carry
 * the brand. An object with a `vertices` array is not a `Polygon2d`.
 *
 * @param p - The value to check.
 * @returns `true` if the value is a `Polygon2d`, `false` otherwise.
 * @since 2.0.0
 */
export const isPolygon2d: (p: unknown) => p is Polygon2d = internal.isPolygon2d

/**
 * Creates a `Polygon2d` from three or more vertices.
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
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  ...rest: ReadonlyArray<Vector2>
) => Polygon2d = internal.make

/**
 * Creates a `Polygon2d` from an array of vertices.
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
export const fromArray: (vertices: ReadonlyArray<Vector2>) => Polygon2d = internal.fromArray

/**
 * Creates a `Polygon2d` from an array of `[x, y]` tuples.
 *
 * @param tuples - The vertices in order, as `[x, y]` pairs.
 * @returns A polygon with the given vertices.
 * @throws `Error` when there are fewer than 3 tuples, or a coordinate is
 *   not finite.
 * @since 2.0.0
 */
export const fromTuples: (tuples: ReadonlyArray<readonly [number, number]>) => Polygon2d =
  internal.fromTuples

export const equals: {
  /**
   * Checks whether two polygons have the same vertices in the same order,
   * comparing each pair with `Vector2.equals`.
   *
   * The comparison is of representations, not regions. The same square
   * started from a different corner, or traced the other way, is not
   * equal.
   *
   * @param a - The first polygon.
   * @param b - The second polygon.
   * @returns `true` when both have the same vertex count and every vertex
   *   pair coincides.
   * @since 2.0.0
   */
  (a: Polygon2d, b: Polygon2d): boolean
  /**
   * Checks whether two polygons have the same vertices in the same order.
   *
   * @param b - The polygon to compare against.
   * @returns A function that takes a polygon and returns whether it equals `b`.
   * @since 2.0.0
   */
  (b: Polygon2d): (a: Polygon2d) => boolean
} = internal.equals

/**
 * The signed area enclosed by a polygon, by the shoelace formula.
 *
 * Positive when the vertices wind `'clockwise'` in curvy's convention,
 * rotating `+x` toward `+y`. Negative when they wind the other way. A
 * self-intersecting polygon counts each region once per turn its outline
 * makes around it, with sign, so a figure eight can total zero.
 *
 * @param p - The polygon.
 * @returns The signed area, in squared coordinate units.
 * @example
 * ```ts
 * const square = Polygon2d.fromTuples([[0, 0], [2, 0], [2, 2], [0, 2]])
 *
 * Polygon2d.signedArea(square) // 4
 * Polygon2d.signedArea(Polygon2d.reverse(square)) // -4
 * ```
 * @since 2.0.0
 */
export const signedArea: (p: Polygon2d) => number = internal.signedArea

/**
 * The unsigned area enclosed by a polygon: the absolute value of
 * `signedArea`.
 *
 * @param p - The polygon.
 * @returns The area, in squared coordinate units.
 * @since 2.0.0
 */
export const area: (p: Polygon2d) => number = internal.area

/**
 * The direction a polygon's outline turns, as it appears on screen with y
 * pointing down.
 *
 * `'clockwise'` means the vertices rotate `+x` toward `+y`, the
 * coordinates module's `Winding` convention. On a y-up plot the same
 * polygon turns counterclockwise.
 *
 * A polygon with no area at working precision has no winding. Collinear or
 * coincident vertices are the usual cause. The cutoff scales with the
 * polygon's coordinates, as `PRECISION.md` describes.
 *
 * @param p - The polygon.
 * @returns The winding, or `none` when the polygon has no area.
 * @example
 * ```ts
 * // A projected face whose winding flipped is facing away from the eye.
 * const face = Polygon2d.fromTuples([[0, 0], [10, 0], [10, 10]])
 *
 * Polygon2d.winding(face) // Solution.one('clockwise')
 * Polygon2d.winding(Polygon2d.fromTuples([[0, 0], [1, 1], [2, 2]])) // Solution.none
 * ```
 * @since 2.0.0
 */
export const winding: (p: Polygon2d) => Solution.AtMostOne<Winding> = internal.winding

/**
 * The total length of a polygon's edges, closing edge included.
 *
 * @param p - The polygon.
 * @returns The perimeter, in coordinate units.
 * @since 2.0.0
 */
export const perimeter: (p: Polygon2d) => number = internal.perimeter

/**
 * The centroid of the region a polygon encloses: its center of mass as a
 * uniform flat plate, not the average of its vertices.
 *
 * Adding vertices along an edge moves a vertex average but leaves the
 * centroid alone.
 *
 * @param p - The polygon.
 * @returns The area centroid, or `none` when the polygon has no area at
 *   working precision, under the same cutoff as `winding`.
 * @since 2.0.0
 */
export const centroid: (p: Polygon2d) => Solution.AtMostOne<Vector2> = internal.centroid

/**
 * The smallest axis-aligned box containing a polygon.
 *
 * @param p - The polygon.
 * @returns A closed `Interval2d` spanning the vertices' x and y ranges.
 * @since 2.0.0
 */
export const boundingBox: (p: Polygon2d) => Interval2d<Closed, Closed> = internal.boundingBox

/**
 * Checks if a polygon is convex, narrowing it to `Polygon2d<T & Convex>`.
 *
 * Convex here means three things:
 *
 * - the polygon has area at working precision, as `winding` judges it
 * - every corner turns the same way
 * - the outline goes around once, so a pentagram is rejected
 *
 * Collinear vertices and repeated vertices are allowed. A vertex that
 * folds straight back along its incoming edge is not. Turns too small to
 * tell from rounding noise count as straight, with a cutoff that scales
 * with the polygon's coordinates. See `PRECISION.md`.
 *
 * @param p - The polygon to check.
 * @returns `true` when `p` is convex.
 * @since 2.0.0
 */
export const isConvex: <T>(p: Polygon2d<T>) => p is Polygon2d<T & Convex> = internal.isConvex

/**
 * Asserts that a polygon is convex, under the definition `isConvex` uses.
 *
 * @param p - The polygon to assert against.
 * @returns The same polygon, typed with the `Convex` brand.
 * @throws `Error` when `p` is not convex.
 * @since 2.0.0
 */
export const asConvex: <T>(p: Polygon2d<T>) => Polygon2d<T & Convex> = internal.asConvex

/**
 * The smallest convex polygon containing every point in a set, by Andrew's
 * monotone chain.
 *
 * The hull's vertices are a subset of the input points. It drops points
 * that lie on a hull edge, and keeps one copy of repeated points. It winds
 * `'clockwise'`, rotating `+x` toward `+y`, starting from the point with
 * the smallest x (smallest y on a tie).
 *
 * @param points - The points to enclose, in any order.
 * @returns The hull, or `none` when the points span no area: fewer than
 *   three distinct points, or all of them on one line at working precision.
 * @example
 * ```ts
 * const hull = Polygon2d.convexHull([
 *   Vector2.make(0, 0),
 *   Vector2.make(4, 0),
 *   Vector2.make(2, 1), // interior, dropped
 *   Vector2.make(4, 4),
 *   Vector2.make(0, 4),
 *   Vector2.make(2, 4), // on an edge, dropped
 * ])
 *
 * Solution.map(hull, Polygon2d.toPathData) // Solution.one('M 0,0 L 4,0 L 4,4 L 0,4 Z')
 * ```
 * @since 2.0.0
 */
export const convexHull: (points: ReadonlyArray<Vector2>) => Solution.AtMostOne<Polygon2d<Convex>> =
  internal.convexHull

export const clip: {
  /**
   * Cuts a convex polygon with a line and keeps the part on the side the
   * normal points toward, by the Sutherland–Hodgman step.
   *
   * The line passes through `origin` perpendicular to `normal`. A point
   * `q` is kept when `Vector2.dot(q - origin, normal) >= 0`.
   *
   * - Vertices on the kept side or on the line stay exactly as they were.
   * - Each edge that crosses the line gains a vertex at the crossing.
   * - A polygon wholly on the kept side comes back unchanged, the same
   *   instance.
   *
   * A vertex within rounding distance of the line counts as on it, with a
   * cutoff that scales with the coordinates. See `PRECISION.md`. Use
   * `split` to keep both sides.
   *
   * @param p - The convex polygon to cut.
   * @param origin - Any point on the cutting line.
   * @param normal - A vector perpendicular to the line, pointing toward the
   *   side to keep. Its length doesn't matter.
   * @returns The kept piece, still convex and winding the same way as
   *   `p`, or `none` when nothing of non-zero area remains.
   * @throws `Error` when `normal` is zero or not finite, or `origin` is not
   *   finite.
   * @example
   * ```ts
   * const square = Polygon2d.asConvex(Polygon2d.fromTuples([[0, 0], [4, 0], [4, 4], [0, 4]]))
   *
   * // Keep everything left of x = 1: the normal points toward -x.
   * Polygon2d.clip(square, Vector2.make(1, 0), Vector2.make(-1, 0))
   * // Solution.one(Polygon2d((0, 0), (1, 0), (1, 4), (0, 4)))
   * ```
   * @since 2.0.0
   */
  (p: Polygon2d<Convex>, origin: Vector2, normal: Vector2): Solution.AtMostOne<Polygon2d<Convex>>
  /**
   * Cuts a convex polygon with a line and keeps the side the normal points
   * toward.
   *
   * @param origin - Any point on the cutting line.
   * @param normal - A vector perpendicular to the line, pointing toward the
   *   side to keep.
   * @returns A function that takes a convex polygon and returns the kept
   *   piece, or `none` when nothing remains.
   * @throws `Error` when `normal` is zero or not finite, or `origin` is not
   *   finite.
   * @since 2.0.0
   */
  (
    origin: Vector2,
    normal: Vector2,
  ): (p: Polygon2d<Convex>) => Solution.AtMostOne<Polygon2d<Convex>>
} = internal.clip

export const split: {
  /**
   * Cuts a convex polygon with a line into the pieces on either side.
   *
   * The line passes through `origin` perpendicular to `normal`. `front` is
   * the piece the normal points toward, `back` the other. Both are what
   * `clip` keeps with the normal one way and then the other. Vertices on
   * the line belong to both pieces, and an edge that crosses the line
   * gains the same crossing vertex in each.
   *
   * @param p - The convex polygon to cut.
   * @param origin - Any point on the cutting line.
   * @param normal - A vector perpendicular to the line, pointing toward the
   *   front side. Its length doesn't matter.
   * @returns The `front` and `back` pieces. Each is `none` when no part of
   *   `p` lies strictly on that side. When the line misses the polygon, one
   *   side holds `p` itself.
   * @throws `Error` when `normal` is zero or not finite, or `origin` is not
   *   finite.
   * @example
   * ```ts
   * const square = Polygon2d.asConvex(Polygon2d.fromTuples([[0, 0], [4, 0], [4, 4], [0, 4]]))
   *
   * // Cut along the diagonal y = x.
   * const { front, back } = Polygon2d.split(square, Vector2.zero, Vector2.make(-1, 1))
   *
   * front // Solution.one(Polygon2d((0, 0), (4, 4), (0, 4)))
   * back // Solution.one(Polygon2d((0, 0), (4, 0), (4, 4)))
   * ```
   * @since 2.0.0
   */
  (p: Polygon2d<Convex>, origin: Vector2, normal: Vector2): Split
  /**
   * Cuts a convex polygon with a line into the pieces on either side.
   *
   * @param origin - Any point on the cutting line.
   * @param normal - A vector perpendicular to the line, pointing toward the
   *   front side.
   * @returns A function that takes a convex polygon and returns its `front`
   *   and `back` pieces.
   * @throws `Error` when `normal` is zero or not finite, or `origin` is not
   *   finite.
   * @since 2.0.0
   */
  (origin: Vector2, normal: Vector2): (p: Polygon2d<Convex>) => Split
} = internal.split

export const inset: {
  /**
   * Shrinks a convex polygon by moving every edge inward by the same
   * distance.
   *
   * Corners stay sharp, so each vertex moves along its corner's bisector.
   * Short edges between sharp corners shrink faster than the rest. Once an
   * edge shrinks to nothing it drops out, and the result has fewer
   * vertices than `p`. A distance past the polygon's inradius leaves
   * nothing.
   *
   * @param p - The convex polygon to shrink.
   * @param distance - How far each edge moves inward, in coordinate units.
   *   `0` returns `p` itself.
   * @returns The inset polygon, convex and winding the same way as `p`, or
   *   `none` when the inset leaves no area.
   * @throws `Error` when `distance` is negative or not finite.
   * @example
   * ```ts
   * const plate = Polygon2d.asConvex(Polygon2d.fromTuples([[0, 0], [10, 0], [10, 4], [0, 4]]))
   *
   * Polygon2d.inset(plate, 1) // Solution.one(Polygon2d((1, 1), (9, 1), (9, 3), (1, 3)))
   * Polygon2d.inset(plate, 2) // Solution.none: the 4-unit side collapses
   * ```
   * @since 2.0.0
   */
  (p: Polygon2d<Convex>, distance: number): Solution.AtMostOne<Polygon2d<Convex>>
  /**
   * Shrinks a convex polygon by moving every edge inward by the same
   * distance.
   *
   * @param distance - How far each edge moves inward, in coordinate units.
   * @returns A function that takes a convex polygon and returns the inset
   *   polygon, or `none` when nothing remains.
   * @throws `Error` when `distance` is negative or not finite.
   * @since 2.0.0
   */
  (distance: number): (p: Polygon2d<Convex>) => Solution.AtMostOne<Polygon2d<Convex>>
} = internal.inset

/**
 * Reverses a polygon's vertex order, flipping its winding and the sign of
 * its `signedArea`.
 *
 * @param p - The polygon.
 * @returns A polygon with the same vertices in reverse order, and the same
 *   trait brands as `p`.
 * @since 2.0.0
 */
export const reverse: <T>(p: Polygon2d<T>) => Polygon2d<T> = internal.reverse

export const transform: {
  /**
   * Applies an `Affine2d` transform to every vertex of a polygon.
   *
   * The result carries no trait brands, matching every other curvy
   * `transform`. An affine image of a convex polygon is convex unless the
   * transform flattens it, so re-assert with `asConvex` where needed. A
   * reflection flips the winding.
   *
   * @param p - The polygon.
   * @param a - The affine transform.
   * @returns A polygon whose vertices are the images of `p`'s.
   * @since 2.0.0
   */
  (p: Polygon2d, a: Affine2d): Polygon2d
  /**
   * Applies an `Affine2d` transform to every vertex of a polygon.
   *
   * @param a - The affine transform.
   * @returns A function that takes a polygon and returns the transformed
   *   polygon.
   * @since 2.0.0
   */
  (a: Affine2d): (p: Polygon2d) => Polygon2d
} = internal.transform

/**
 * Converts a polygon to a `LinearPath2d` with one segment per edge,
 * closing edge included.
 *
 * The path ends where it starts, but path data from
 * `LinearPath2d.toPathData` ends with a line back to the start rather than
 * `Z`. For SVG output prefer `toPathData`, whose `Z` joins the last edge to
 * the first with the stroke's line join.
 *
 * @param p - The polygon.
 * @returns A path tracing the polygon's outline from its first vertex.
 * @since 2.0.0
 */
export const toPath: (p: Polygon2d) => LinearPath2d = internal.toPath

/**
 * Emits SVG path data for a polygon's outline: a move to the first vertex,
 * a line to each other vertex, then `Z`.
 *
 * @param p - The polygon.
 * @returns Path data such as `'M 0,0 L 4,0 L 4,4 Z'`.
 * @since 2.0.0
 */
export const toPathData: (p: Polygon2d) => string = internal.toPathData

export const rounded: {
  /**
   * Rounds a polygon's corners with circular fillets, as a
   * `RationalCubicPath2d`.
   *
   * Each fillet is the circle arc tangent to both edges at a corner. A
   * fillet never reaches past the midpoint of either adjacent edge. A
   * radius too large for its corner shrinks to the largest that fits, so
   * neighboring fillets meet but never overlap. Corners whose edges run
   * straight through, or that repeat a vertex, stay sharp. Concave corners
   * round the other way.
   *
   * The arcs are exact rational segments of at most a quarter turn, and
   * the edges between them are straight segments. For SVG output use
   * `roundedPathData`, which emits `A` commands.
   *
   * @param p - The polygon.
   * @param radius - The fillet radius in coordinate units, either one for
   *   every corner or an array with one per vertex, in vertex order. `0`
   *   keeps a corner sharp.
   * @returns A closed path starting where the first corner's fillet begins.
   * @throws `Error` when a radius is negative or not finite, or an array
   *   of radii doesn't have one entry per vertex.
   * @since 2.0.0
   */
  (p: Polygon2d, radius: number | ReadonlyArray<number>): RationalCubicPath2d
  /**
   * Rounds a polygon's corners with circular fillets, as a
   * `RationalCubicPath2d`.
   *
   * @param radius - The fillet radius in coordinate units, for every corner
   *   or one per vertex.
   * @returns A function that takes a polygon and returns its rounded
   *   outline.
   * @throws `Error` when a radius is negative or not finite, or an array
   *   of radii doesn't have one entry per vertex.
   * @since 2.0.0
   */
  (radius: number | ReadonlyArray<number>): (p: Polygon2d) => RationalCubicPath2d
} = internal.rounded

export const roundedPathData: {
  /**
   * Emits SVG path data for a polygon with circular fillets on its
   * corners.
   *
   * Each fillet is an exact `A` command, sized as in `rounded`: tangent to
   * both edges, never past either edge's midpoint, shrunk where the radius
   * doesn't fit. Sharp corners come out as plain `L` commands, and the
   * path closes with `Z`.
   *
   * @param p - The polygon.
   * @param radius - The fillet radius in coordinate units, either one for
   *   every corner or an array with one per vertex, in vertex order. `0`
   *   keeps a corner sharp.
   * @returns Path data starting where the first corner's fillet begins.
   * @throws `Error` when a radius is negative or not finite, or an array
   *   of radii doesn't have one entry per vertex.
   * @example
   * ```ts
   * const square = Polygon2d.fromTuples([[0, 0], [10, 0], [10, 10], [0, 10]])
   *
   * Polygon2d.roundedPathData(square, 2)
   * // 'M 0,2 A 2 2 0 0 1 2,0 L 8,0 A 2 2 0 0 1 10,2 L 10,8 A 2 2 0 0 1 8,10 L 2,10 A 2 2 0 0 1 0,8 Z'
   * ```
   * @since 2.0.0
   */
  (p: Polygon2d, radius: number | ReadonlyArray<number>): string
  /**
   * Emits SVG path data for a polygon with circular fillets on its
   * corners.
   *
   * @param radius - The fillet radius in coordinate units, for every corner
   *   or one per vertex.
   * @returns A function that takes a polygon and returns its rounded path
   *   data.
   * @throws `Error` when a radius is negative or not finite, or an array
   *   of radii doesn't have one entry per vertex.
   * @since 2.0.0
   */
  (radius: number | ReadonlyArray<number>): (p: Polygon2d) => string
} = internal.roundedPathData
