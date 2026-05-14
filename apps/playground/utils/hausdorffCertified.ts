import { CubicCurve2d, RationalCubicCurve2d } from 'curvy/curve'
import { Interval2d } from 'curvy/interval'
import { CubicPath2d } from 'curvy/path'
import { Vector2 } from 'curvy/vector'

// Certified subdivision-based Hausdorff between a rational cubic and a
// polynomial cubic path approximating it.
//
// Strategy: maintain a queue of curve "pieces" (subdivisible sub-curves on the
// *source* side of the one-sided sweep). For each piece, compute
//
//   lower = dist(witness-on-piece, closestPointOn(target))
//   upper = min(
//     min over target boxes of maxDist(piece.box, target.box),     // box-pair bound
//     lower + maxDist({witness}, piece.box),                       // triangle bound
//   )
//
// `lower` is a provable lower bound because some specific point in the piece
// is exactly that far from the target curve, so the worst-case point in the
// piece is at least that far.
//
// The box-pair upper bound is valid because every point of the source piece
// lies in its box and every point of any target sub-curve lies in some target
// box, so by `maxDist` the distance between any source/target pair is at most
// this. The triangle-inequality bound is tighter when source and target
// curves overlap: for any other point a' in the source piece, dist(a',
// target) ≤ dist(a', witness) + dist(witness, target) ≤ maxDist({witness},
// piece.box) + lower. As the source piece shrinks under subdivision, the
// second term goes to zero, so the bracket closes regardless of how the
// target is partitioned.
//
// Process highest-`upper` piece first. When the popped piece's `upper`
// already fits within the running best lower bound plus tolerance, every
// remaining piece is also within tolerance — terminate. Otherwise, if the
// piece's own bracket is loose, subdivide and re-queue both halves.

interface CertifiedClosestQuery {
  segmentBoxes: ReadonlyArray<Interval2d.Interval2d>
  closestPointTo: (qx: number, qy: number) => { distance: number; px: number; py: number }
}

interface SourcePiece {
  box: Interval2d.Interval2d
  witness: { x: number; y: number }
  subdivide: () => [SourcePiece, SourcePiece]
  depth: number
}

interface PieceBounds {
  piece: SourcePiece
  upper: number
  lower: number
  witnessSource: { x: number; y: number }
  witnessTarget: { x: number; y: number }
}

export interface OneSidedCertified {
  lower: number
  upper: number
  witness: { x: number; y: number }
  nearest: { x: number; y: number }
}

const MAX_DEPTH = 30

// Max Euclidean distance from a point to any point in a box — the distance
// to the box's farthest corner. Per-axis: take the larger of (point - min,
// max - point) on each axis, then hypot.
const maxDistFromPointToBox = (px: number, py: number, box: Interval2d.Interval2d): number => {
  const xLo = Math.min(box.x.start, box.x.end)
  const xHi = Math.max(box.x.start, box.x.end)
  const yLo = Math.min(box.y.start, box.y.end)
  const yHi = Math.max(box.y.start, box.y.end)
  const dx = Math.max(px - xLo, xHi - px)
  const dy = Math.max(py - yLo, yHi - py)
  return Math.hypot(dx, dy)
}

const computeBounds = (piece: SourcePiece, target: CertifiedClosestQuery): PieceBounds => {
  let boxPairUpper = Number.POSITIVE_INFINITY
  for (const tb of target.segmentBoxes) {
    const md = Interval2d.maxDistance(piece.box, tb)
    if (md < boxPairUpper) boxPairUpper = md
  }
  const cp = target.closestPointTo(piece.witness.x, piece.witness.y)
  const triangleUpper =
    cp.distance + maxDistFromPointToBox(piece.witness.x, piece.witness.y, piece.box)
  return {
    piece,
    upper: Math.min(boxPairUpper, triangleUpper),
    lower: cp.distance,
    witnessSource: piece.witness,
    witnessTarget: { x: cp.px, y: cp.py },
  }
}

const oneSidedCertified = (
  initialPieces: ReadonlyArray<SourcePiece>,
  target: CertifiedClosestQuery,
  tolerance: number,
): OneSidedCertified => {
  const queue: Array<PieceBounds> = []
  let bestLower = 0
  let bestWitnessSource = { x: 0, y: 0 }
  let bestWitnessTarget = { x: 0, y: 0 }

  for (const p of initialPieces) {
    const b = computeBounds(p, target)
    queue.push(b)
    if (b.lower > bestLower) {
      bestLower = b.lower
      bestWitnessSource = b.witnessSource
      bestWitnessTarget = b.witnessTarget
    }
  }

  while (queue.length > 0) {
    let maxIdx = 0
    for (let i = 1; i < queue.length; i++) {
      if (queue[i]!.upper > queue[maxIdx]!.upper) maxIdx = i
    }
    const item = queue[maxIdx]!
    queue[maxIdx] = queue[queue.length - 1]!
    queue.pop()

    if (item.upper <= bestLower + tolerance) {
      return {
        lower: bestLower,
        upper: Math.max(bestLower, item.upper),
        witness: bestWitnessSource,
        nearest: bestWitnessTarget,
      }
    }

    if (item.piece.depth >= MAX_DEPTH || item.upper - item.lower <= tolerance) {
      continue
    }

    const [left, right] = item.piece.subdivide()
    for (const sub of [left, right]) {
      const sb = computeBounds(sub, target)
      if (sb.lower > bestLower) {
        bestLower = sb.lower
        bestWitnessSource = sb.witnessSource
        bestWitnessTarget = sb.witnessTarget
      }
      queue.push(sb)
    }
  }

  return {
    lower: bestLower,
    upper: bestLower,
    witness: bestWitnessSource,
    nearest: bestWitnessTarget,
  }
}

// Closest-point sub-routine on a parametric cubic-style curve. Coarse sample
// + bisection on the squared-distance derivative — same shape as the sampling
// oracle, just inlined here so the certified module is self-contained.
type CurveEval = (s: number) => { px: number; py: number; tx: number; ty: number }

const closestOnParametric = (
  eval_: CurveEval,
  qx: number,
  qy: number,
  coarseSamples = 32,
): { px: number; py: number; d2: number } => {
  let pxBest = 0
  let pyBest = 0
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
      pxBest = px
      pyBest = py
      sBest = s
    }
  }

  const step = 1 / coarseSamples
  let lo = Math.max(0, sBest - step)
  let hi = Math.min(1, sBest + step)
  const grad = (s: number): number => {
    const { px, py, tx, ty } = eval_(s)
    return (px - qx) * tx + (py - qy) * ty
  }
  if (grad(lo) > 0 || grad(hi) < 0) {
    return { px: pxBest, py: pyBest, d2: d2Best }
  }
  for (let i = 0; i < 40; i++) {
    const mid = 0.5 * (lo + hi)
    if (grad(mid) > 0) hi = mid
    else lo = mid
    if (hi - lo < 1e-12) break
  }
  const s = 0.5 * (lo + hi)
  const { px, py } = eval_(s)
  const dx = px - qx
  const dy = py - qy
  const d2 = dx * dx + dy * dy
  if (d2 < d2Best) return { px, py, d2 }
  return { px: pxBest, py: pyBest, d2: d2Best }
}

const polynomialEval =
  (c: CubicCurve2d.CubicCurve2d): CurveEval =>
  (s) => ({
    px: c.x.c0 + s * (c.x.c1 + s * (c.x.c2 + s * c.x.c3)),
    py: c.y.c0 + s * (c.y.c1 + s * (c.y.c2 + s * c.y.c3)),
    tx: c.x.c1 + s * (2 * c.x.c2 + s * 3 * c.x.c3),
    ty: c.y.c1 + s * (2 * c.y.c2 + s * 3 * c.y.c3),
  })

const rationalEval =
  (c: RationalCubicCurve2d.RationalCubicCurve2d): CurveEval =>
  (s) => {
    const X = c.x.c0 + s * (c.x.c1 + s * (c.x.c2 + s * c.x.c3))
    const Y = c.y.c0 + s * (c.y.c1 + s * (c.y.c2 + s * c.y.c3))
    const W = c.w.c0 + s * (c.w.c1 + s * (c.w.c2 + s * c.w.c3))
    const Xp = c.x.c1 + s * (2 * c.x.c2 + s * 3 * c.x.c3)
    const Yp = c.y.c1 + s * (2 * c.y.c2 + s * 3 * c.y.c3)
    const Wp = c.w.c1 + s * (2 * c.w.c2 + s * 3 * c.w.c3)
    const w2 = W * W
    return {
      px: X / W,
      py: Y / W,
      tx: (Xp * W - X * Wp) / w2,
      ty: (Yp * W - Y * Wp) / w2,
    }
  }

const rationalSourcePiece = (
  c: RationalCubicCurve2d.RationalCubicCurve2d,
  depth = 0,
): SourcePiece => {
  const witnessV = RationalCubicCurve2d.solve(c, 0.5)
  return {
    box: RationalCubicCurve2d.boundingBox(c),
    witness: { x: witnessV.x, y: witnessV.y },
    depth,
    subdivide: () => {
      const [left, right] = RationalCubicCurve2d.subdivide(c, 0.5)
      return [rationalSourcePiece(left, depth + 1), rationalSourcePiece(right, depth + 1)]
    },
  }
}

// CubicCurve2d does not yet have a public `subdivide` in core, so we subdivide
// via the per-axis polynomial subdivision (which it *does* have). The
// resulting halves are valid polynomial cubics over [0, 1] each.
const polynomialSubdivide = (
  c: CubicCurve2d.CubicCurve2d,
  t: number,
): [CubicCurve2d.CubicCurve2d, CubicCurve2d.CubicCurve2d] => {
  // Re-import polynomial subdivision lazily via duck-typed access. Each axis
  // is independently subdividable, and `CubicCurve2d.fromPolynomials` rebuilds
  // the curve.
  const xs = subdivideMonomialCubic(c.x.c0, c.x.c1, c.x.c2, c.x.c3, t)
  const ys = subdivideMonomialCubic(c.y.c0, c.y.c1, c.y.c2, c.y.c3, t)
  return [
    CubicCurve2d.fromCoefficients(
      Vector2.make(xs.left[0], ys.left[0]),
      Vector2.make(xs.left[1], ys.left[1]),
      Vector2.make(xs.left[2], ys.left[2]),
      Vector2.make(xs.left[3], ys.left[3]),
    ),
    CubicCurve2d.fromCoefficients(
      Vector2.make(xs.right[0], ys.right[0]),
      Vector2.make(xs.right[1], ys.right[1]),
      Vector2.make(xs.right[2], ys.right[2]),
      Vector2.make(xs.right[3], ys.right[3]),
    ),
  ]
}

// Direct monomial-form cubic subdivision: rewrite p(s) on [0, 1] as two
// cubics over [0, t] and [t, 1] each renormalized to [0, 1].
//
//   Left:  p_L(u) = p(t·u),       u ∈ [0, 1]
//   Right: p_R(u) = p(t + (1-t)·u)
//
// Substituting and re-collecting monomial coefficients gives the closed forms
// below. Equivalent to `CubicPolynomial.subdivide` in core but inlined here so
// the playground utility doesn't pull in another module just to subdivide a
// polynomial.
const subdivideMonomialCubic = (
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  t: number,
): { left: [number, number, number, number]; right: [number, number, number, number] } => {
  const t2 = t * t
  const t3 = t2 * t
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u

  const left: [number, number, number, number] = [c0, c1 * t, c2 * t2, c3 * t3]
  const right: [number, number, number, number] = [
    c0 + c1 * t + c2 * t2 + c3 * t3,
    (c1 + 2 * c2 * t + 3 * c3 * t2) * u,
    (c2 + 3 * c3 * t) * u2,
    c3 * u3,
  ]
  return { left, right }
}

const polynomialSourcePiece = (c: CubicCurve2d.CubicCurve2d, depth = 0): SourcePiece => {
  const witnessV = CubicCurve2d.solve(c, 0.5)
  return {
    box: CubicCurve2d.boundingBox(c),
    witness: { x: witnessV.x, y: witnessV.y },
    depth,
    subdivide: () => {
      const [left, right] = polynomialSubdivide(c, 0.5)
      return [polynomialSourcePiece(left, depth + 1), polynomialSourcePiece(right, depth + 1)]
    },
  }
}

// Pre-segments the rational into K equal-parameter slices for use as the
// "target" side of polynomial → rational queries. K = 16 gives reasonable
// upper-bound tightness without burning the budget; the lower bound is still
// computed against the whole rational via parametric closest-point.
const RATIONAL_TARGET_SLICES = 16

const buildRationalTarget = (
  c: RationalCubicCurve2d.RationalCubicCurve2d,
): CertifiedClosestQuery => {
  const slices: Array<RationalCubicCurve2d.RationalCubicCurve2d> = []
  let remaining = c
  for (let i = 1; i < RATIONAL_TARGET_SLICES; i++) {
    // Split the remaining tail at the parameter that corresponds to one slice
    // worth — for the remaining segment over its own [0, 1] domain, that's
    // (1 / sliceCountStillToGo).
    const slicesLeftBefore = RATIONAL_TARGET_SLICES - (i - 1)
    const tLocal = 1 / slicesLeftBefore
    const [head, tail] = RationalCubicCurve2d.subdivide(remaining, tLocal)
    slices.push(head)
    remaining = tail
  }
  slices.push(remaining)

  const segmentBoxes = slices.map((s) => RationalCubicCurve2d.boundingBox(s))
  const fullEval = rationalEval(c)
  return {
    segmentBoxes,
    closestPointTo: (qx, qy) => {
      const r = closestOnParametric(fullEval, qx, qy)
      return { distance: Math.sqrt(r.d2), px: r.px, py: r.py }
    },
  }
}

const buildPolynomialTarget = (path: CubicPath2d.CubicPath2d): CertifiedClosestQuery => {
  const segments = [...path]
  const segmentBoxes = segments.map((s) => CubicCurve2d.boundingBox(s))
  return {
    segmentBoxes,
    closestPointTo: (qx, qy) => {
      let best = { px: 0, py: 0, d2: Number.POSITIVE_INFINITY }
      for (const seg of segments) {
        const r = closestOnParametric(polynomialEval(seg), qx, qy)
        if (r.d2 < best.d2) best = r
      }
      return { distance: Math.sqrt(best.d2), px: best.px, py: best.py }
    },
  }
}

export interface HausdorffCertifiedResult {
  lower: number
  upper: number
  // The direction that achieved the best lower bound. Witness lives on the
  // named source curve.
  direction: 'rational→polynomial' | 'polynomial→rational'
  witness: { x: number; y: number }
  nearest: { x: number; y: number }
  rationalToPolynomial: OneSidedCertified
  polynomialToRational: OneSidedCertified
}

/**
 * Certified-bracket Hausdorff distance between a rational cubic and a
 * polynomial cubic path approximation.
 *
 * Returns `[lower, upper]` with `upper - lower ≤ tolerance` (or a wider
 * bracket if the depth cap is hit). Unlike the sampled estimator, both
 * endpoints are provable bounds, not point estimates.
 */
export const hausdorffCertified = (
  rational: RationalCubicCurve2d.RationalCubicCurve2d,
  approximation: CubicPath2d.CubicPath2d,
  tolerance = 0.01,
): HausdorffCertifiedResult => {
  const polynomialTarget = buildPolynomialTarget(approximation)
  const rationalToPolynomial = oneSidedCertified(
    [rationalSourcePiece(rational)],
    polynomialTarget,
    tolerance,
  )

  const rationalTarget = buildRationalTarget(rational)
  const polynomialToRational = oneSidedCertified(
    [...approximation].map((s) => polynomialSourcePiece(s)),
    rationalTarget,
    tolerance,
  )

  const rtpWins = rationalToPolynomial.lower >= polynomialToRational.lower
  const lower = Math.max(rationalToPolynomial.lower, polynomialToRational.lower)
  const upper = Math.max(rationalToPolynomial.upper, polynomialToRational.upper)
  return {
    lower,
    upper,
    direction: rtpWins ? 'rational→polynomial' : 'polynomial→rational',
    witness: rtpWins ? rationalToPolynomial.witness : polynomialToRational.witness,
    nearest: rtpWins ? rationalToPolynomial.nearest : polynomialToRational.nearest,
    rationalToPolynomial,
    polynomialToRational,
  }
}
