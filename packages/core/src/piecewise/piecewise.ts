import type { Closed } from '../interval/interval.ts'
import type { CubicPath2d } from '../path/cubic2d.ts'
import type { IncreasingX } from '../path/traits.ts'
import type { CubicPolynomial } from '../polynomial/cubic.ts'
import type * as Solution from '../solution/solution.ts'
import type { Pipeable } from '../utils.ts'
import * as internal from './piecewise.internal.ts'
import type { PiecewiseTypeId } from './piecewise.internal.ts'
import type { Contiguous, Continuous, Monotonic, PiecewiseTraits } from './traits.ts'

export type { Contiguous, Continuous, Monotonic } from './traits.ts'

/**
 * One piece of a `Piecewise`: a closed x-`Interval` paired with the polynomial
 * that governs it there.
 *
 * The polynomial is evaluated in the piece's **local normalized coordinate**
 * `u = (x - domain.start) / size(domain)`, so every piece's polynomial lives
 * over `[0, 1]` no matter where its x-domain sits. That keeps the coefficients
 * well-conditioned at large x, matches the `[0, 1]` convention curvy's
 * parametric curves already use, and is the coordinate a viewport-relative CSS
 * expression wants — `(100vw - x0) / span` is exactly this `u`.
 *
 * @since 2.0.0
 */
export type Piece<P> = readonly [Closed, P]

/**
 * A piecewise polynomial function `y = f(x)`: a sequence of `[x-interval,
 * polynomial]` pieces, ordered and non-overlapping in x.
 *
 * This is the *explicit* counterpart to the parametric `CubicPath2d`. A path
 * maps `t -> (x, y)`, with each segment holding two polynomials; a `Piecewise`
 * maps `x -> y`, with each piece holding one. It is the "pp-form" of the
 * spline literature (MATLAB `mkpp`/`ppval`, SciPy `PPoly`): breakpoints plus a
 * local polynomial per interval. Because it has no parametric axis of its own,
 * it carries no `2d` suffix — its graph lives in the plane, but the object is
 * a function of one variable.
 *
 * `P` is the per-piece polynomial degree (`LinearPolynomial`,
 * `QuadraticPolynomial`, `CubicPolynomial`). The base value is a *partial*
 * function: the pieces may leave gaps in x. `Trait` accumulates brands that
 * narrow that — `Contiguous` (no gaps), `Continuous` (no jumps at the joins),
 * `Monotonic` (invertible in y) — via `isContiguous` and its siblings.
 *
 * All fields are readonly. No operation mutates a value. Iterating yields the
 * `[Interval, polynomial]` pieces in x order.
 *
 * @since 2.0.0
 */
export interface Piecewise<P, out Trait = unknown> extends Pipeable, Iterable<Piece<P>> {
  readonly [PiecewiseTypeId]: PiecewiseTypeId
  readonly [PiecewiseTraits]: Trait
}

/**
 * Checks if a value is a `Piecewise`.
 *
 * @param u - The value to check.
 * @returns `true` if the value is a `Piecewise`, `false` otherwise.
 * @since 2.0.0
 */
export const isPiecewise: (u: unknown) => u is Piecewise<unknown> = internal.isPiecewise

/**
 * Creates a `Piecewise` from an ordered sequence of `[interval, polynomial]`
 * pieces. All pieces must share a polynomial degree.
 *
 * The pieces must be ordered and non-overlapping in x; gaps are allowed. To
 * assert the stronger gapless property, refine the result with `isContiguous`
 * or `asContiguous`.
 *
 * @param pieces - The pieces, in ascending x order. At least one is required.
 * @returns A new `Piecewise`.
 * @throws `Error` when called with no pieces, or when two pieces overlap in x.
 * @since 2.0.0
 */
export const make: <P>(...pieces: ReadonlyArray<Piece<P>>) => Piecewise<P> = internal.make

/**
 * Creates a `Piecewise` from an array of `[interval, polynomial]` pieces.
 *
 * @param pieces - The pieces, in ascending x order. At least one is required.
 * @returns A new `Piecewise`.
 * @throws `Error` when the array is empty, or when two pieces overlap in x.
 * @since 2.0.0
 */
export const fromArray: <P>(pieces: ReadonlyArray<Piece<P>>) => Piecewise<P> = internal.fromArray

/**
 * Refits a strictly-increasing-x cubic path into a piecewise function of x,
 * approximating `y = f(x)` to within `tolerance`.
 *
 * A path's y is generally not a polynomial in x — inverting a nonlinear segment
 * `x(t)` leaves an algebraic function — so each source segment is subdivided in
 * x and fitted with a cubic matching value and slope (`dy/dx`) at the cell
 * endpoints, bisecting until the fit tracks the curve within tolerance. A
 * segment whose x is already affine (`x.c2` and `x.c3` both zero, as a linear
 * or graph-form source produces) is transcribed exactly, with no subdivision.
 *
 * @param path - A cubic path, branded strictly increasing in x.
 * @param options - `tolerance` bounds the deviation as a fraction of the path's
 *   y-range. Defaults to `1e-4`.
 * @returns A contiguous piecewise function whose pieces tile the path's x-range.
 * @since 2.0.0
 */
export const fromPath: (
  path: CubicPath2d<IncreasingX>,
  options?: { readonly tolerance?: number },
) => Piecewise<CubicPolynomial, Contiguous> = internal.fromPath

export const solve: {
  /**
   * Evaluates the function at `x`, returning `y = f(x)`. Locates the piece
   * whose x-interval contains `x` and evaluates its polynomial at the local
   * coordinate `u = (x - domain.start) / size(domain)`. Returns `Solution.none`
   * when `x` is outside every piece — beyond the domain, or inside a gap of a
   * non-`Contiguous` value.
   *
   * `x` may graze a piece boundary by up to `EPSILON` (see `PRECISION.md`); the
   * evaluation clamps into the piece there rather than extrapolating.
   *
   * @param piecewise - The piecewise function.
   * @param x - The input value.
   * @returns The value `y` at `x`, or `none` when `x` lands in no piece.
   * @since 2.0.0
   */
  <P>(piecewise: Piecewise<P>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the function at `x`.
   *
   * @param x - The input value.
   * @returns A function that takes a `Piecewise` and returns `y` at `x`, or `none`.
   * @since 2.0.0
   */
  (x: number): <P>(piecewise: Piecewise<P>) => Solution.AtMostOne<number>
} = internal.solve as never

/**
 * Returns the closed x-`Interval` the function spans, from the first piece's
 * start to the last piece's end. For a `Contiguous` value this is the exact
 * domain; for a gapped one it is the enclosing hull (gaps included).
 *
 * @param piecewise - The piecewise function.
 * @returns The `[first piece start, last piece end]` interval.
 * @since 2.0.0
 */
export const domain: <P>(piecewise: Piecewise<P>) => Closed = internal.domain

/**
 * Computes the closed y-`Interval` the function attains — the union of each
 * piece's range over its domain, interior extrema included.
 *
 * @param piecewise - The piecewise function.
 * @returns The smallest closed interval enclosing every value `f(x)` takes.
 * @since 2.0.0
 */
export const boundingBox: <P>(piecewise: Piecewise<P>) => Closed = internal.boundingBox

/**
 * Checks if the pieces tile their domain with no gaps — each piece starting
 * where the previous ended, within `coincident` tolerance (see `PRECISION.md`).
 * Adds `Contiguous` to the value's traits.
 *
 * @param piecewise - The piecewise function to check.
 * @returns `true` when the pieces are gapless, narrowing to `Piecewise<P, T & Contiguous>`.
 * @since 2.0.0
 */
export const isContiguous: <P, T>(
  piecewise: Piecewise<P, T>,
) => piecewise is Piecewise<P, T & Contiguous> = internal.isContiguous

/**
 * Asserts that the pieces tile their domain with no gaps, throwing on failure.
 *
 * @param piecewise - The piecewise function to assert against.
 * @returns The same value, with `Contiguous` added to its traits.
 * @throws `Error` when a gap exists between two consecutive pieces.
 * @since 2.0.0
 */
export const asContiguous: <P, T>(piecewise: Piecewise<P, T>) => Piecewise<P, T & Contiguous> =
  internal.asContiguous

/**
 * Checks if the function is continuous: gapless, and agreeing in value across
 * every join (`C^0`), each compared with `coincident` tolerance (see
 * `PRECISION.md`). Adds `Continuous`, which implies `Contiguous`, to the traits.
 *
 * @param piecewise - The piecewise function to check.
 * @returns `true` when the function has no gaps and no jumps, narrowing to `Piecewise<P, T & Continuous>`.
 * @since 2.0.0
 */
export const isContinuous: <P, T>(
  piecewise: Piecewise<P, T>,
) => piecewise is Piecewise<P, T & Continuous> = internal.isContinuous

/**
 * Asserts that the function is continuous, throwing on failure.
 *
 * @param piecewise - The piecewise function to assert against.
 * @returns The same value, with `Continuous` added to its traits.
 * @throws `Error` when a gap or a jump exists between two consecutive pieces.
 * @since 2.0.0
 */
export const asContinuous: <P, T>(piecewise: Piecewise<P, T>) => Piecewise<P, T & Continuous> =
  internal.asContinuous

/**
 * Checks if the function's y is monotonic across the whole domain: every piece
 * strictly monotonic in one shared direction, with consecutive pieces' y-ranges
 * chaining without reversal (a backtrack within `coincident` still counts).
 * Adds `Monotonic` to the traits — the property inverting `y` back to `x` needs.
 *
 * @param piecewise - The piecewise function to check.
 * @returns `true` when `f` is monotonic in y, narrowing to `Piecewise<P, T & Monotonic>`.
 * @since 2.0.0
 */
export const isMonotonic: <P, T>(
  piecewise: Piecewise<P, T>,
) => piecewise is Piecewise<P, T & Monotonic> = internal.isMonotonic

/**
 * Asserts that the function's y is monotonic across its domain, throwing on
 * failure.
 *
 * @param piecewise - The piecewise function to assert against.
 * @returns The same value, with `Monotonic` added to its traits.
 * @throws `Error` when the function is not monotonic in y.
 * @since 2.0.0
 */
export const asMonotonic: <P, T>(piecewise: Piecewise<P, T>) => Piecewise<P, T & Monotonic> =
  internal.asMonotonic

export const append: {
  /**
   * Appends a piece to the end of a `Piecewise`. The new piece must not overlap
   * the current last piece.
   *
   * @param piecewise - The piecewise function to append to.
   * @param piece - The piece to append.
   * @returns A new `Piecewise` with the piece appended.
   * @throws `Error` when the appended piece overlaps the current last piece in x.
   * @since 2.0.0
   */
  <P>(piecewise: Piecewise<P>, piece: Piece<P>): Piecewise<P>
  /**
   * Appends a piece to the end of a `Piecewise`.
   *
   * @param piece - The piece to append.
   * @returns A function that takes a `Piecewise` and returns a new one with the piece appended.
   * @since 2.0.0
   */
  <P>(piece: Piece<P>): (piecewise: Piecewise<P>) => Piecewise<P>
} = internal.append as never

export const appendContiguous: {
  /**
   * Appends a piece to a `Contiguous` function, preserving the brand. The new
   * piece's x-domain must start where the current last piece ends (within
   * `coincident` tolerance; see `PRECISION.md`), leaving no gap.
   *
   * Only the new join is checked — the input's `Contiguous` brand already
   * vouches for the rest. The result carries `Contiguous` and drops any other
   * traits, since appending can still break them.
   *
   * @param pp - A contiguous piecewise function.
   * @param piece - The piece to append.
   * @returns A new `Contiguous` piecewise function with the piece appended.
   * @throws `Error` when the piece leaves a gap after the current last piece.
   * @since 2.0.0
   */
  <P>(piecewise: Piecewise<P, Contiguous>, piece: Piece<P>): Piecewise<P, Contiguous>
  /**
   * Appends a piece to a `Contiguous` function, preserving the brand.
   *
   * @param piece - The piece to append.
   * @returns A function that takes a `Contiguous` piecewise function and returns one with the piece appended.
   * @since 2.0.0
   */
  <P>(piece: Piece<P>): (piecewise: Piecewise<P, Contiguous>) => Piecewise<P, Contiguous>
} = internal.appendContiguous as never

export const appendContinuous: {
  /**
   * Appends a piece to a `Continuous` function, preserving the brand. The new
   * piece must join without a gap (as `appendContiguous`) and its value at the
   * join must agree with the current last piece's, both within `coincident`
   * tolerance (see `PRECISION.md`).
   *
   * The result carries `Continuous` and drops any other traits.
   *
   * @param pp - A continuous piecewise function.
   * @param piece - The piece to append.
   * @returns A new `Continuous` piecewise function with the piece appended.
   * @throws `Error` when the piece leaves a gap or its value jumps at the join.
   * @since 2.0.0
   */
  <P>(piecewise: Piecewise<P, Continuous>, piece: Piece<P>): Piecewise<P, Continuous>
  /**
   * Appends a piece to a `Continuous` function, preserving the brand.
   *
   * @param piece - The piece to append.
   * @returns A function that takes a `Continuous` piecewise function and returns one with the piece appended.
   * @since 2.0.0
   */
  <P>(piece: Piece<P>): (piecewise: Piecewise<P, Continuous>) => Piecewise<P, Continuous>
} = internal.appendContinuous as never

export const mapPolynomials: {
  /**
   * Applies a transform to every piece's polynomial, preserving the pieces'
   * intervals. The transform must return the same polynomial degree it
   * receives — the container reuses its resolved evaluation strategy.
   *
   * @param piecewise - The piecewise function.
   * @param f - The per-piece polynomial transform.
   * @returns A new `Piecewise` with each polynomial mapped, over the same intervals.
   * @since 2.0.0
   */
  <P>(piecewise: Piecewise<P>, f: (p: P) => P): Piecewise<P>
  /**
   * Applies a transform to every piece's polynomial.
   *
   * @param f - The per-piece polynomial transform.
   * @returns A function that takes a `Piecewise` and returns the mapped value.
   * @since 2.0.0
   */
  <P>(f: (p: P) => P): (piecewise: Piecewise<P>) => Piecewise<P>
} = internal.mapPolynomials as never
