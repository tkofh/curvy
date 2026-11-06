// Certified Hausdorff checks by subdivision: the engine behind
// `RationalCubicCurve2d.approximateAsCubicCurves` and `CoordinateSystem.image`.
// Both fit a polynomial cubic candidate to a source curve they can't
// represent exactly, then ask `withinTolerance` whether every point of each
// curve is provably within `tolerance` of the other. A client supplies its
// source as a `CertifiedPiece` (a rigorous box, a witness point on the curve,
// exact bisection) plus a closest-distance query against it. Nothing here
// knows what the source is.
//
// Each one-sided check runs a depth-first subdivision on its source side. At
// each piece it computes
//
//   lower = dist(witness-on-piece, target)
//   upper = min(
//     lower + maxDist(witness, piece.box),     // triangle inequality bound
//     maxDist(piece.box, target.box),          // box-pair bound
//   )
//
// Both upper bounds are provable; their min is too. The triangle bound
// shrinks proportionally to source box diameter, so it dominates when source
// and target overlap (which they usually do — candidates match their source
// at endpoints and tangents). The walk early-terminates on the first piece
// whose `lower` exceeds `tolerance` (definitive miss) and accepts once every
// piece's `upper` <= tolerance.

import * as Interval2d from '../../interval/internal/interval2d.ts'
import type { Interval2d as Box } from '../../interval/interval2d.ts'
import * as CubicCurve2d from './cubic2d.ts'
import type { CubicCurve2d as Cubic } from '../cubic2d.ts'
import type * as Vector2 from '../../vector/vector2.ts'

// Approximation cap for the clients' fit-and-split recursions. At depth 20
// one input curve could emit up to 2^20 (~1M) segments — well past any sane
// target — so the cap is really just a guard against pathological tolerances
// (e.g. tolerance approaching 0). A piece that reaches it is emitted
// uncertified.
/** @internal */
export const MAX_APPROX_DEPTH = 20

const MAX_HAUSDORFF_DEPTH = 30

// A curve's point (px, py) and first derivative (tx, ty) at one parameter.
// Deliberately flat numbers rather than two `Vector2`s: closest-point search
// evaluates a curve ~70 times per query, and measured on 2026-11-05 a
// `Vector2` sample (built from the curve solvers, distances via
// `Vector2.subtract`/`Vector2.dot`) made the whole fit 1.65x-2.3x slower
// across `image` and `approximateAsCubicCurves`. The cost is allocation in
// that inner loop, so the samplers stay hand-written Horner forms.
/** @internal */
export interface CurveSample {
  readonly px: number
  readonly py: number
  readonly tx: number
  readonly ty: number
}

// Coarse sample + bisection on the squared-distance derivative. Returns the
// minimum squared distance from `q` to a parametric curve described by
// `eval_`. Stationary points of (P(s) - q) * P'(s) are local extrema of
// D^2(s); 32 coarse samples reliably bracket the global min for cubic-degree
// curves (which have at most ~5 critical points of squared distance). The
// result is the distance to a real curve point, so it never undershoots the
// true minimum, which keeps every bound built on it sound.
/** @internal */
export const closestSquaredDistance = (
  eval_: (s: number) => CurveSample,
  q: Vector2.Vector2,
): number => {
  const { x: qx, y: qy } = q
  const coarseSamples = 32
  let sBest = 0
  let d2Best = Number.POSITIVE_INFINITY
  for (let i = 0; i <= coarseSamples; i++) {
    const s = i / coarseSamples
    const { px, py } = eval_(s)
    const dx = px - qx
    const dy = py - qy
    const d2 = dx * dx + dy * dy
    if (d2 < d2Best) {
      d2Best = d2
      sBest = s
    }
  }
  const step = 1 / coarseSamples
  let lo = Math.max(0, sBest - step)
  let hi = Math.min(1, sBest + step)
  const gradient = (s: number): number => {
    const { px, py, tx, ty } = eval_(s)
    return (px - qx) * tx + (py - qy) * ty
  }
  if (gradient(lo) > 0 || gradient(hi) < 0) {
    return d2Best
  }
  for (let i = 0; i < 40; i++) {
    const m = 0.5 * (lo + hi)
    if (gradient(m) > 0) {
      hi = m
    } else {
      lo = m
    }
    if (hi - lo < 1e-12) {
      break
    }
  }
  const s = 0.5 * (lo + hi)
  const { px, py } = eval_(s)
  const dx = px - qx
  const dy = py - qy
  const d2 = dx * dx + dy * dy
  return d2 < d2Best ? d2 : d2Best
}

// The piece abstraction the one-sided walker consumes: a rigorous bounding
// box for the piece's span of the source curve, a witness point that lies ON
// the source curve, and exact bisection. Any curve family that can supply
// these three things can be certified against a candidate.
/** @internal */
export interface CertifiedPiece {
  readonly box: Box
  readonly witness: Vector2.Vector2
  readonly depth: number
  subdivide(): [CertifiedPiece, CertifiedPiece]
}

/** @internal */
export const polynomialPiece = (c: Cubic, depth = 0): CertifiedPiece => ({
  box: CubicCurve2d.boundingBox(c),
  witness: CubicCurve2d.solve(c, 0.5),
  depth,
  subdivide: () => {
    const [left, right] = CubicCurve2d.subdivide(c, 0.5)
    return [polynomialPiece(left, depth + 1), polynomialPiece(right, depth + 1)]
  },
})

// One-sided certified check: true when every point of the curve `initialPiece`
// spans is provably within `tolerance` of the target curve, which `targetEval`
// evaluates and `targetBox` encloses.
/** @internal */
export const oneSidedWithinTolerance = (
  initialPiece: CertifiedPiece,
  targetBox: Box,
  targetEval: (s: number) => CurveSample,
  tolerance: number,
): boolean => {
  const tol2 = tolerance * tolerance
  const stack: Array<CertifiedPiece> = [initialPiece]
  while (stack.length > 0) {
    const piece = stack.pop() as CertifiedPiece
    const lower2 = closestSquaredDistance(targetEval, piece.witness)
    if (lower2 > tol2) {
      return false
    }
    const lower = Math.sqrt(lower2)
    const triangleUpper = lower + Interval2d.maxDistanceToVector(piece.box, piece.witness)
    const boxPairUpper = Interval2d.maxDistance(piece.box, targetBox)
    const upper = triangleUpper < boxPairUpper ? triangleUpper : boxPairUpper
    if (upper <= tolerance) {
      continue
    }
    if (piece.depth >= MAX_HAUSDORFF_DEPTH) {
      return false
    }
    const [left, right] = piece.subdivide()
    stack.push(left, right)
  }
  return true
}

// Certified symmetric Hausdorff check between a source curve and a polynomial
// cubic candidate: true when every point of the source is provably within
// `tolerance` of the candidate and every point of the candidate is provably
// within `tolerance` of the source. `source` is the source's root piece, and
// its box doubles as the target box for the candidate-side walk; `sourceEval`
// evaluates the source curve on the root piece's parameter range.
/** @internal */
export const withinTolerance = (
  source: CertifiedPiece,
  sourceEval: (s: number) => CurveSample,
  candidate: Cubic,
  tolerance: number,
): boolean => {
  const candidateBox = CubicCurve2d.boundingBox(candidate)
  if (
    !oneSidedWithinTolerance(
      source,
      candidateBox,
      (s) => CubicCurve2d.solveWithDerivative(candidate, s),
      tolerance,
    )
  ) {
    return false
  }
  return oneSidedWithinTolerance(polynomialPiece(candidate), source.box, sourceEval, tolerance)
}
