import * as CubicCurve2d from '../curve/cubic2d.ts'
import * as LinearCurve2d from '../curve/linear2d.ts'
import * as QuadraticCurve2d from '../curve/quadratic2d.ts'
import * as Interval from '../interval/interval.ts'
import { coincident } from '../number.ts'
import * as CubicPath2d from '../path/cubic2d.ts'
import * as LinearPath2d from '../path/linear2d.ts'
import * as QuadraticPath2d from '../path/quadratic2d.ts'
import type { IncreasingX, MonotonicX } from '../path/traits.ts'
import { Ops as cubicOps } from '../polynomial/cubic.internal.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import { Ops as linearOps } from '../polynomial/linear.internal.ts'
import * as LinearPolynomial from '../polynomial/linear.ts'
import type { PolynomialOps } from '../polynomial/polynomial.ts'
import { Ops as quadraticOps } from '../polynomial/quadratic.internal.ts'
import * as QuadraticPolynomial from '../polynomial/quadratic.ts'
import * as Solution from '../solution/solution.ts'
import { dual, invariant, Pipeable } from '../utils.ts'
import type { Piece, Piecewise } from './piecewise.ts'
import { type Contiguous, type Continuous, type Monotonic, PiecewiseTraits } from './traits.ts'

export const PiecewiseTypeId: unique symbol = Symbol('curvy/piecewise')
export type PiecewiseTypeId = typeof PiecewiseTypeId

// The generic `Piecewise` evaluates its pieces through a `PolynomialOps` bundle
// (defined in `polynomial/polynomial.ts`, the analog of `curve/curve2d.ts`).
// Each polynomial module exports its own `Ops`; the container holds the one
// matching its pieces' degree, resolved once at construction from the pieces'
// runtime kind, so evaluation carries no per-call dispatch.

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

// --- fromPath: refit a monotonic-x path into a function of x ----------------
//
// A segment whose x is affine in t maps t === u, so its y-polynomial already is
// the piece's y(u) — transcribed exactly, no inversion or subdivision (a linear
// path is entirely this case). A segment with genuine curvature in x has an
// algebraic, non-polynomial y(x); it is subdivided in x and each cell fitted in
// the piece-local u, bisecting until the fit tracks the curve within tolerance.
// Output degree matches the source path: linear -> linear, quadratic ->
// quadratic, cubic -> cubic.

const DEFAULT_TOLERANCE = 1e-4
const MAX_DEPTH = 16
const ERROR_SAMPLES = [0.25, 0.5, 0.75] as const

type Probe = { readonly y: number; readonly slope: number }

// The per-segment operations the adaptive refiner drives, independent of the
// segment's polynomial degree. `probeAtT` samples an endpoint (t known, no
// inversion); `probeAtX`/`trueYAtX` sample an interior x, inverting the
// monotonic x(t); `fit` builds a piece over [xLo, xHi] in local u and
// `evalPiece` samples it for the error test.
interface SegmentRefit<P> {
  probeAtT(t: number): Probe
  probeAtX(x: number): Probe
  trueYAtX(x: number): number
  fit(xLo: number, xHi: number, lo: Probe, hi: Probe): P
  evalPiece(p: P, u: number): number
}

// Bisect one segment in x until the fitted piece tracks the true curve within
// `threshold`. Endpoint probes thread through the recursion, so each interior x
// is inverted exactly once.
const refineCell = <P>(
  refit: SegmentRefit<P>,
  xLo: number,
  probeLo: Probe,
  xHi: number,
  probeHi: Probe,
  threshold: number,
  depth: number,
  out: Array<Piece<P>>,
): void => {
  const cell = refit.fit(xLo, xHi, probeLo, probeHi)

  if (depth < MAX_DEPTH) {
    const h = xHi - xLo
    for (const u of ERROR_SAMPLES) {
      const trueY = refit.trueYAtX(xLo + h * u)
      if (Math.abs(refit.evalPiece(cell, u) - trueY) > threshold) {
        const xMid = xLo + h / 2
        const probeMid = refit.probeAtX(xMid)
        refineCell(refit, xLo, probeLo, xMid, probeMid, threshold, depth + 1, out)
        refineCell(refit, xMid, probeMid, xHi, probeHi, threshold, depth + 1, out)
        return
      }
    }
  }

  out.push([Interval.make(xLo, xHi), cell])
}

// Fit a cubic in the cell-local u = (x - xLo) / (xHi - xLo) matching value and
// slope at both ends. x is affine in u with dx/du = h, so the u-space endpoint
// velocities are h * mLo and h * mHi. Hermite -> monomial.
const fitCubicCell = (
  xLo: number,
  xHi: number,
  lo: Probe,
  hi: Probe,
): CubicPolynomial.CubicPolynomial => {
  const h = xHi - xLo
  const dY = hi.y - lo.y
  return CubicPolynomial.make(
    lo.y,
    h * lo.slope,
    3 * dY - 2 * h * lo.slope - h * hi.slope,
    -2 * dY + h * lo.slope + h * hi.slope,
  )
}

// A quadratic cell has room for both endpoint values and the left-endpoint slope
// (3 coefficients); the right slope falls out. Bisection drives the fit to
// tolerance regardless of which slope is pinned.
const fitQuadraticCell = (
  xLo: number,
  xHi: number,
  lo: Probe,
  hi: Probe,
): QuadraticPolynomial.QuadraticPolynomial => {
  const c1 = (xHi - xLo) * lo.slope
  return QuadraticPolynomial.make(lo.y, c1, hi.y - lo.y - c1)
}

// Invert a segment's (monotonic) x-polynomial to the parameter t at which
// x(t) = x. `clipApprox` keeps the single in-[0, 1] root, tolerating one that
// lands a few ulps outside the unit interval from solver roundoff.
const clipToParam = (roots: Solution.Solution<number>): number => {
  const t = Solution.valueOrUndefined(roots.pipe(Solution.clipApprox(Interval.unit)))
  invariant(t !== undefined, 'piecewise fromPath: x is not on the segment (non-monotonic source?)')
  return t
}

// dy/dx = y'(t) / x'(t) by the chain rule. x'(t) is zero only at a vertical
// tangent, impossible in the interior of a monotonic-x segment; the guard covers
// a grazing endpoint tangent.
const cubicRefit = (
  seg: CubicCurve2d.CubicCurve2d,
): SegmentRefit<CubicPolynomial.CubicPolynomial> => {
  const invertX = (x: number) => clipToParam(CubicPolynomial.solveInverse(seg.x, x))
  const probeAtT = (t: number): Probe => {
    const dx = seg.x.c1 + t * (2 * seg.x.c2 + 3 * t * seg.x.c3)
    const dy = seg.y.c1 + t * (2 * seg.y.c2 + 3 * t * seg.y.c3)
    return { y: CubicPolynomial.solve(seg.y, t), slope: dx === 0 ? 0 : dy / dx }
  }
  return {
    probeAtT,
    probeAtX: (x) => probeAtT(invertX(x)),
    trueYAtX: (x) => CubicPolynomial.solve(seg.y, invertX(x)),
    fit: fitCubicCell,
    evalPiece: CubicPolynomial.solve,
  }
}

const quadraticRefit = (
  seg: QuadraticCurve2d.QuadraticCurve2d,
): SegmentRefit<QuadraticPolynomial.QuadraticPolynomial> => {
  const invertX = (x: number) => clipToParam(QuadraticPolynomial.solveInverse(seg.x, x))
  const probeAtT = (t: number): Probe => {
    const dx = seg.x.c1 + 2 * seg.x.c2 * t
    const dy = seg.y.c1 + 2 * seg.y.c2 * t
    return { y: QuadraticPolynomial.solve(seg.y, t), slope: dx === 0 ? 0 : dy / dx }
  }
  return {
    probeAtT,
    probeAtX: (x) => probeAtT(invertX(x)),
    trueYAtX: (x) => QuadraticPolynomial.solve(seg.y, invertX(x)),
    fit: fitQuadraticCell,
    evalPiece: QuadraticPolynomial.solve,
  }
}

// The error budget is a fraction of the curve's y-range — the metric the source
// problem measures deviation in. A flat curve falls back to an absolute band.
const errorThreshold = (yScale: number, options?: { readonly tolerance?: number }): number =>
  (options?.tolerance ?? DEFAULT_TOLERANCE) * (yScale === 0 ? 1 : yScale)

const fromLinearPath = (
  path: LinearPath2d.LinearPath2d<IncreasingX>,
): Piecewise<LinearPolynomial.LinearPolynomial, Contiguous> => {
  // Linear x is always affine, so t === u and each seg.y already is y(u), exact.
  const out: Array<Piece<LinearPolynomial.LinearPolynomial>> = []
  for (const seg of path) {
    out.push([Interval.make(LinearCurve2d.startPoint(seg).x, LinearCurve2d.endPoint(seg).x), seg.y])
  }
  return asContiguous(fromArray(out))
}

const fromQuadraticPath = (
  path: QuadraticPath2d.QuadraticPath2d<IncreasingX>,
  options?: { readonly tolerance?: number },
): Piecewise<QuadraticPolynomial.QuadraticPolynomial, Contiguous> => {
  const threshold = errorThreshold(Interval.size(QuadraticPath2d.boundingBox(path).y), options)
  const out: Array<Piece<QuadraticPolynomial.QuadraticPolynomial>> = []
  for (const seg of path) {
    const xLo = QuadraticCurve2d.startPoint(seg).x
    const xHi = QuadraticCurve2d.endPoint(seg).x
    if (seg.x.c2 === 0) {
      out.push([Interval.make(xLo, xHi), seg.y]) // affine x: t === u, exact
      continue
    }
    const refit = quadraticRefit(seg)
    refineCell(refit, xLo, refit.probeAtT(0), xHi, refit.probeAtT(1), threshold, 0, out)
  }
  return asContiguous(fromArray(out))
}

const fromCubicPath = (
  path: CubicPath2d.CubicPath2d<IncreasingX>,
  options?: { readonly tolerance?: number },
): Piecewise<CubicPolynomial.CubicPolynomial, Contiguous> => {
  const threshold = errorThreshold(Interval.size(CubicPath2d.boundingBox(path).y), options)
  const out: Array<Piece<CubicPolynomial.CubicPolynomial>> = []
  for (const seg of path) {
    const xLo = CubicCurve2d.startPoint(seg).x
    const xHi = CubicCurve2d.endPoint(seg).x
    if (seg.x.c2 === 0 && seg.x.c3 === 0) {
      out.push([Interval.make(xLo, xHi), seg.y]) // affine x: t === u, exact
      continue
    }
    const refit = cubicRefit(seg)
    refineCell(refit, xLo, refit.probeAtT(0), xHi, refit.probeAtT(1), threshold, 0, out)
  }
  return asContiguous(fromArray(out))
}

// A decreasing-x path traces the same y = f(x) right-to-left; `reverse` flips it
// to increasing-x (same image, ascending pieces) before the degree-specific
// refit runs. Direction is detected at runtime — the `MonotonicX` brand alone
// doesn't say which way — and re-asserted after `reverse`, which drops brands.
/** @internal */
export const fromPath = (
  path:
    | LinearPath2d.LinearPath2d<MonotonicX>
    | QuadraticPath2d.QuadraticPath2d<MonotonicX>
    | CubicPath2d.CubicPath2d<MonotonicX>,
  options?: { readonly tolerance?: number },
): Piecewise<unknown, Contiguous> => {
  if (LinearPath2d.isLinearPath2d(path)) {
    return fromLinearPath(
      LinearPath2d.isIncreasingX(path)
        ? path
        : LinearPath2d.asIncreasingX(LinearPath2d.reverse(path)),
    )
  }
  if (QuadraticPath2d.isQuadraticPath2d(path)) {
    return fromQuadraticPath(
      QuadraticPath2d.isIncreasingX(path)
        ? path
        : QuadraticPath2d.asIncreasingX(QuadraticPath2d.reverse(path)),
      options,
    )
  }
  return fromCubicPath(
    CubicPath2d.isIncreasingX(path)
      ? path
      : CubicPath2d.asIncreasingX(CubicPath2d.reverse(path)),
    options,
  )
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

// y-image: the union of each piece's range over its local [0, 1], interior
// extrema included (delegated to the polynomial's `unitRange`).
/** @internal */
export const boundingBox = (pp: Piecewise<unknown>): Interval.Closed => {
  const impl = pp as PiecewiseImpl<unknown>
  let acc: Interval.Interval = impl.ops.unitRange((impl.pieces[0] as Piece<unknown>)[1])
  for (let i = 1; i < impl.pieces.length; i++) {
    acc = Interval.union(acc, impl.ops.unitRange((impl.pieces[i] as Piece<unknown>)[1]))
  }
  return Interval.toClosed(acc)
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
export const isContinuous = <P, T>(pp: Piecewise<P, T>): pp is Piecewise<P, T & Continuous> => {
  const impl = pp as PiecewiseImpl<unknown>
  for (let i = 1; i < impl.pieces.length; i++) {
    const [prevDom, prevPoly] = impl.pieces[i - 1] as Piece<unknown>
    const [dom, poly] = impl.pieces[i] as Piece<unknown>
    // gapless in x, and the values agree across the join (C^0).
    if (!coincident(dom.start, prevDom.end)) {
      return false
    }
    if (!coincident(impl.ops.solve(poly, 0), impl.ops.solve(prevPoly, 1))) {
      return false
    }
  }
  return true
}

/** @internal */
export const asContinuous = <P, T>(pp: Piecewise<P, T>): Piecewise<P, T & Continuous> => {
  invariant(isContinuous(pp), 'piecewise is not continuous')
  return pp
}

// The function is monotonic when every piece is monotonic in one shared
// direction and consecutive pieces' y-ranges chain in that direction — a knot
// that backtracks within the coincidence band still counts. Mirrors the
// per-axis path monotonicity check in `path/path2d.ts`.
const monotonicIn = (impl: PiecewiseImpl<unknown>, increasing: boolean): boolean => {
  let prevEnd = increasing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
  for (const [, poly] of impl.pieces) {
    if (!(increasing ? impl.ops.isIncreasing(poly) : impl.ops.isDecreasing(poly))) {
      return false
    }
    const start = impl.ops.solve(poly, 0)
    if (increasing ? start < prevEnd : start > prevEnd) {
      if (!coincident(start, prevEnd)) {
        return false
      }
    }
    prevEnd = impl.ops.solve(poly, 1)
  }
  return true
}

/** @internal */
export const isMonotonic = <P, T>(pp: Piecewise<P, T>): pp is Piecewise<P, T & Monotonic> => {
  const impl = pp as PiecewiseImpl<unknown>
  return monotonicIn(impl, true) || monotonicIn(impl, false)
}

/** @internal */
export const asMonotonic = <P, T>(pp: Piecewise<P, T>): Piecewise<P, T & Monotonic> => {
  invariant(isMonotonic(pp), 'piecewise is not monotonic')
  return pp
}

/** @internal */
export const append = dual(
  2,
  (pp: Piecewise<unknown>, piece: Piece<unknown>): Piecewise<unknown> =>
    fromArray([...(pp as PiecewiseImpl<unknown>).pieces, piece]),
)

// Trait-preserving appends. The input brand vouches for every existing join, so
// only the new one needs checking. The result keeps just the asserted brand —
// appending can still break others (e.g. `Monotonic`).
/** @internal */
export const appendContiguous = dual(
  2,
  (pp: Piecewise<unknown, Contiguous>, piece: Piece<unknown>): Piecewise<unknown, Contiguous> => {
    const impl = pp as PiecewiseImpl<unknown>
    const last = impl.pieces[impl.pieces.length - 1] as Piece<unknown>
    invariant(
      coincident(piece[0].start, last[0].end),
      'appendContiguous: the piece leaves a gap after the current last piece',
    )
    return fromArray([...impl.pieces, piece]) as Piecewise<unknown, Contiguous>
  },
)

/** @internal */
export const appendContinuous = dual(
  2,
  (pp: Piecewise<unknown, Continuous>, piece: Piece<unknown>): Piecewise<unknown, Continuous> => {
    const impl = pp as PiecewiseImpl<unknown>
    const last = impl.pieces[impl.pieces.length - 1] as Piece<unknown>
    invariant(
      coincident(piece[0].start, last[0].end),
      'appendContinuous: the piece leaves a gap after the current last piece',
    )
    invariant(
      coincident(impl.ops.solve(piece[1], 0), impl.ops.solve(last[1], 1)),
      'appendContinuous: the piece value jumps at the join',
    )
    return fromArray([...impl.pieces, piece]) as Piecewise<unknown, Continuous>
  },
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

// Differentiate with respect to x. Each piece polynomial is a function of the
// local u = (x - start) / width, so its x-derivative carries a chain-rule factor
// du/dx = 1 / width, folded in per piece by the ops. The intervals are kept; the
// degree drops by one (a linear piece's derivative is a constant, carried as a
// zero-slope linear). `fromArray` re-resolves the ops bundle for the lowered
// degree from the new pieces' runtime kind.
/** @internal */
export const derivative = (pp: Piecewise<unknown>): Piecewise<unknown> => {
  const impl = pp as PiecewiseImpl<unknown>
  return fromArray(
    impl.pieces.map(
      ([dom, poly]) => [dom, impl.ops.derivative(poly, 1 / Interval.size(dom))] as Piece<unknown>,
    ),
  )
}
