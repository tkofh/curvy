import type { Closed } from '../interval/interval.ts'
import type * as Solution from '../solution/solution.ts'
import type { Pipeable } from '../utils.ts'
import * as internal from './piecewise.internal.ts'
import type { PiecewiseTypeId } from './piecewise.internal.ts'
import type { Contiguous, PiecewiseTraits } from './traits.ts'

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
 * Creates a `Piecewise` from a list of breakpoints and one polynomial per
 * span, the "pp-form" constructor. Piece `i` covers `[breaks[i],
 * breaks[i + 1]]` and is governed by `polynomials[i]`, evaluated in that span's
 * local normalized coordinate (see `Piece`).
 *
 * @param breaks - The x breakpoints, ascending. Must have exactly one more entry than `polynomials`.
 * @param polynomials - One polynomial per span, in order.
 * @returns A new `Piecewise` whose pieces tile `[breaks[0], breaks[breaks.length - 1]]`.
 * @throws `Error` when `breaks.length !== polynomials.length + 1`, or when the breaks are not ascending.
 * @since 2.0.0
 */
export const fromBreaks: <P>(
  breaks: ReadonlyArray<number>,
  polynomials: ReadonlyArray<P>,
) => Piecewise<P> = internal.fromBreaks

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
   * @param pp - The piecewise function.
   * @param x - The input value.
   * @returns The value `y` at `x`, or `none` when `x` lands in no piece.
   * @since 2.0.0
   */
  <P>(pp: Piecewise<P>, x: number): Solution.AtMostOne<number>
  /**
   * Evaluates the function at `x`.
   *
   * @param x - The input value.
   * @returns A function that takes a `Piecewise` and returns `y` at `x`, or `none`.
   * @since 2.0.0
   */
  (x: number): <P>(pp: Piecewise<P>) => Solution.AtMostOne<number>
} = internal.solve as never

/**
 * Returns the closed x-`Interval` the function spans, from the first piece's
 * start to the last piece's end. For a `Contiguous` value this is the exact
 * domain; for a gapped one it is the enclosing hull (gaps included).
 *
 * @param pp - The piecewise function.
 * @returns The `[first piece start, last piece end]` interval.
 * @since 2.0.0
 */
export const domain: <P>(pp: Piecewise<P>) => Closed = internal.domain

/**
 * Checks if the pieces tile their domain with no gaps — each piece starting
 * where the previous ended, within `coincident` tolerance (see `PRECISION.md`).
 * Adds `Contiguous` to the value's traits.
 *
 * @param pp - The piecewise function to check.
 * @returns `true` when the pieces are gapless, narrowing to `Piecewise<P, T & Contiguous>`.
 * @since 2.0.0
 */
export const isContiguous: <P, T>(pp: Piecewise<P, T>) => pp is Piecewise<P, T & Contiguous> =
  internal.isContiguous

/**
 * Asserts that the pieces tile their domain with no gaps, throwing on failure.
 *
 * @param pp - The piecewise function to assert against.
 * @returns The same value, with `Contiguous` added to its traits.
 * @throws `Error` when a gap exists between two consecutive pieces.
 * @since 2.0.0
 */
export const asContiguous: <P, T>(pp: Piecewise<P, T>) => Piecewise<P, T & Contiguous> =
  internal.asContiguous

export const append: {
  /**
   * Appends a piece to the end of a `Piecewise`. The new piece must not overlap
   * the current last piece.
   *
   * @param pp - The piecewise function to append to.
   * @param piece - The piece to append.
   * @returns A new `Piecewise` with the piece appended.
   * @throws `Error` when the appended piece overlaps the current last piece in x.
   * @since 2.0.0
   */
  <P>(pp: Piecewise<P>, piece: Piece<P>): Piecewise<P>
  /**
   * Appends a piece to the end of a `Piecewise`.
   *
   * @param piece - The piece to append.
   * @returns A function that takes a `Piecewise` and returns a new one with the piece appended.
   * @since 2.0.0
   */
  <P>(piece: Piece<P>): (pp: Piecewise<P>) => Piecewise<P>
} = internal.append as never

export const mapPolynomials: {
  /**
   * Applies a transform to every piece's polynomial, preserving the pieces'
   * intervals. The transform must return the same polynomial degree it
   * receives — the container reuses its resolved evaluation strategy.
   *
   * @param pp - The piecewise function.
   * @param f - The per-piece polynomial transform.
   * @returns A new `Piecewise` with each polynomial mapped, over the same intervals.
   * @since 2.0.0
   */
  <P>(pp: Piecewise<P>, f: (p: P) => P): Piecewise<P>
  /**
   * Applies a transform to every piece's polynomial.
   *
   * @param f - The per-piece polynomial transform.
   * @returns A function that takes a `Piecewise` and returns the mapped value.
   * @since 2.0.0
   */
  <P>(f: (p: P) => P): (pp: Piecewise<P>) => Piecewise<P>
} = internal.mapPolynomials as never
