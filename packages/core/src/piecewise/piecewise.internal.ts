import * as Interval from '../interval/interval.ts'
import { coincident } from '../number.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import * as LinearPolynomial from '../polynomial/linear.ts'
import * as QuadraticPolynomial from '../polynomial/quadratic.ts'
import * as Solution from '../solution/solution.ts'
import { dual, invariant, Pipeable } from '../utils.ts'
import type { Piece, Piecewise } from './piecewise.ts'
import { type Contiguous, PiecewiseTraits } from './traits.ts'

export const PiecewiseTypeId: unique symbol = Symbol('curvy/piecewise')
export type PiecewiseTypeId = typeof PiecewiseTypeId

// The minimal per-degree operation bundle the generic `Piecewise` needs — the
// polynomial-degree analog of `Curve2dOps` in `curve/curve2d.ts`. Held once per
// `Piecewise` instance, resolved at construction from the pieces' runtime kind,
// so evaluation carries no per-call dispatch.
//
// Only `solve` for now. `derivative` joins here when that method lands, and it
// carries the wrinkle that going generic surfaces: differentiation lowers the
// degree (cubic -> quadratic -> linear), so the bundle will need a pointer to
// the lower-degree bundle to type the result. `unitRange` (for `boundingBox`)
// and the monotonicity refiners follow the same expansion.
/** @internal */
export interface PolynomialOps<P> {
  solve(p: P, u: number): number
}

const linearOps: PolynomialOps<LinearPolynomial.LinearPolynomial> = {
  solve: LinearPolynomial.solve,
}

const quadraticOps: PolynomialOps<QuadraticPolynomial.QuadraticPolynomial> = {
  solve: QuadraticPolynomial.solve,
}

const cubicOps: PolynomialOps<CubicPolynomial.CubicPolynomial> = {
  solve: CubicPolynomial.solve,
}

// Resolve the operation bundle from a polynomial's runtime kind. The three
// degrees share a call shape but not a `solve` — evaluating a cubic piece with
// the linear solver would silently drop its high-order terms — so the container
// must route to the right one. Dispatch happens once, in the factories.
const resolveOps = (p: unknown): PolynomialOps<unknown> => {
  if (CubicPolynomial.isCubicPolynomial(p)) {
    return cubicOps as PolynomialOps<unknown>
  }
  if (QuadraticPolynomial.isQuadraticPolynomial(p)) {
    return quadraticOps as PolynomialOps<unknown>
  }
  if (LinearPolynomial.isLinearPolynomial(p)) {
    return linearOps as PolynomialOps<unknown>
  }
  invariant(false, 'piecewise: unrecognized polynomial kind')
}

/** @internal */
class PiecewiseImpl<P> extends Pipeable implements Piecewise<P, unknown> {
  readonly [PiecewiseTypeId]: PiecewiseTypeId = PiecewiseTypeId
  declare readonly [PiecewiseTraits]: unknown

  readonly pieces: ReadonlyArray<Piece<P>>
  readonly ops: PolynomialOps<P>

  constructor(pieces: ReadonlyArray<Piece<P>>, ops: PolynomialOps<P>) {
    invariant(pieces.length > 0, 'piecewise requires at least one piece')
    super()
    this.pieces = pieces
    this.ops = ops
  }

  [Symbol.iterator](): IterableIterator<Piece<P>> {
    return this.pieces[Symbol.iterator]()
  }
}

/** @internal */
export const isPiecewise = (u: unknown): u is Piecewise<unknown> =>
  typeof u === 'object' && u !== null && PiecewiseTypeId in u

/** @internal */
export const fromArray = <P>(pieces: ReadonlyArray<Piece<P>>): Piecewise<P> => {
  invariant(pieces.length > 0, 'piecewise requires at least one piece')

  // Base invariant: ordered and non-overlapping — enough for `solve` to be
  // single-valued (a well-defined partial function). Gaps are permitted; the
  // `Contiguous` brand is what additionally rules them out.
  for (let i = 1; i < pieces.length; i++) {
    const prevEnd = (pieces[i - 1] as Piece<P>)[0].end
    const start = (pieces[i] as Piece<P>)[0].start
    invariant(
      start >= prevEnd || coincident(start, prevEnd),
      'piecewise pieces must be ordered and non-overlapping in x',
    )
  }

  return new PiecewiseImpl(pieces, resolveOps((pieces[0] as Piece<P>)[1]) as PolynomialOps<P>)
}

/** @internal */
export const make = <P>(...pieces: ReadonlyArray<Piece<P>>): Piecewise<P> => fromArray(pieces)

/** @internal */
export const fromBreaks = <P>(
  breaks: ReadonlyArray<number>,
  polynomials: ReadonlyArray<P>,
): Piecewise<P> => {
  invariant(
    breaks.length === polynomials.length + 1,
    'piecewise: breaks must have exactly one more entry than polynomials',
  )
  const pieces: Array<Piece<P>> = []
  for (let i = 0; i < polynomials.length; i++) {
    pieces.push([Interval.make(breaks[i] as number, breaks[i + 1] as number), polynomials[i] as P])
  }
  return fromArray(pieces)
}

// Find the piece bracketing `x` and evaluate its polynomial at the piece-local
// normalized coordinate `u = (x - domain.start) / size(domain)`. Pieces are
// ordered and non-overlapping, so the first bracketing piece is the only one.
// `containsApprox` admits `x` a grazing band outside a piece (float drift at a
// join), and the `u` clamp keeps that band from evaluating the polynomial off
// its `[0, 1]` domain. Returns `none` when `x` is outside every piece — for a
// `Contiguous` value that means outside `[domain.start, domain.end]`; for a
// gapped one it also covers the gaps.
/** @internal */
export const solve = dual(2, (pp: Piecewise<unknown>, x: number): Solution.AtMostOne<number> => {
  const impl = pp as PiecewiseImpl<unknown>
  for (const [domain, poly] of impl.pieces) {
    if (Interval.containsApprox(domain, x)) {
      const u = Interval.clamp(Interval.unit, Interval.normalize(domain, x))
      return Solution.one(impl.ops.solve(poly, u))
    }
  }
  return Solution.none
})

/** @internal */
export const domain = (pp: Piecewise<unknown>): Interval.Closed => {
  const impl = pp as PiecewiseImpl<unknown>
  const first = impl.pieces[0] as Piece<unknown>
  const last = impl.pieces[impl.pieces.length - 1] as Piece<unknown>
  return Interval.make(first[0].start, last[0].end)
}

/** @internal */
export const isContiguous = <P, T>(pp: Piecewise<P, T>): pp is Piecewise<P, T & Contiguous> => {
  const impl = pp as PiecewiseImpl<P>
  for (let i = 1; i < impl.pieces.length; i++) {
    const prevEnd = (impl.pieces[i - 1] as Piece<P>)[0].end
    const start = (impl.pieces[i] as Piece<P>)[0].start
    if (!coincident(start, prevEnd)) {
      return false
    }
  }
  return true
}

/** @internal */
export const asContiguous = <P, T>(pp: Piecewise<P, T>): Piecewise<P, T & Contiguous> => {
  invariant(isContiguous(pp), 'piecewise is not contiguous')
  return pp
}

/** @internal */
export const append = dual(
  2,
  (pp: Piecewise<unknown>, piece: Piece<unknown>): Piecewise<unknown> =>
    fromArray([...(pp as PiecewiseImpl<unknown>).pieces, piece]),
)

// Degree-preserving by contract: `f` must return the same polynomial degree it
// received, so the resolved ops bundle stays valid and the pieces are reused.
/** @internal */
export const mapPolynomials = dual(
  2,
  (pp: Piecewise<unknown>, f: (p: unknown) => unknown): Piecewise<unknown> => {
    const impl = pp as PiecewiseImpl<unknown>
    return new PiecewiseImpl(
      impl.pieces.map(([d, p]) => [d, f(p)] as Piece<unknown>),
      impl.ops,
    )
  },
)
