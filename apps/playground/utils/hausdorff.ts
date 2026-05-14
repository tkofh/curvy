import type { CubicCurve2d, RationalCubicCurve2d } from 'curvy/curve'
import type { CubicPath2d } from 'curvy/path'

// Evaluator for a parametric 2D curve over s ∈ [0, 1]: returns the point and
// the (unnormalized) tangent. We only need the tangent for the bisection step,
// not as a unit vector, so we keep it raw.
type CurveEval = (s: number) => { px: number; py: number; tx: number; ty: number }

const polynomialCubicEval =
  (c: CubicCurve2d): CurveEval =>
  (s) => ({
    px: c.x.c0 + s * (c.x.c1 + s * (c.x.c2 + s * c.x.c3)),
    py: c.y.c0 + s * (c.y.c1 + s * (c.y.c2 + s * c.y.c3)),
    tx: c.x.c1 + s * (2 * c.x.c2 + s * 3 * c.x.c3),
    ty: c.y.c1 + s * (2 * c.y.c2 + s * 3 * c.y.c3),
  })

// R(s) = (X(s)/W(s), Y(s)/W(s))  →  R'(s) = ((X'W - XW')/W², (Y'W - YW')/W²)
const rationalCubicEval =
  (c: RationalCubicCurve2d): CurveEval =>
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

interface ClosestResult {
  s: number
  px: number
  py: number
  d2: number
}

// Find s ∈ [0, 1] minimizing |C(s) - q|² for a parametric curve C.
//
// Coarse sample → bracket → bisect on the squared-distance derivative:
//   ½ D²'(s) = (C(s) - q) · C'(s)
// changes sign from – to + across an interior local min, so once a neighboring
// pair of coarse samples brackets it, bisection converges geometrically. If
// neither bracket-end has the expected sign, the min is at sBest itself (a
// domain endpoint) and we return the coarse result.
const closestOnSegment = (
  eval_: CurveEval,
  qx: number,
  qy: number,
  coarseSamples = 32,
): ClosestResult => {
  let sBest = 0
  let pxBest = 0
  let pyBest = 0
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
      pxBest = px
      pyBest = py
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
    return { s: sBest, px: pxBest, py: pyBest, d2: d2Best }
  }

  for (let iter = 0; iter < 40; iter++) {
    const sMid = 0.5 * (lo + hi)
    if (gradient(sMid) > 0) hi = sMid
    else lo = sMid
    if (hi - lo < 1e-12) break
  }

  const s = 0.5 * (lo + hi)
  const { px, py } = eval_(s)
  const dx = px - qx
  const dy = py - qy
  const d2 = dx * dx + dy * dy
  if (d2 < d2Best) return { s, px, py, d2 }
  return { s: sBest, px: pxBest, py: pyBest, d2: d2Best }
}

const closestOnPath = (path: CubicPath2d, qx: number, qy: number): ClosestResult => {
  let best: ClosestResult = { s: 0, px: 0, py: 0, d2: Number.POSITIVE_INFINITY }
  for (const segment of path) {
    const r = closestOnSegment(polynomialCubicEval(segment), qx, qy)
    if (r.d2 < best.d2) best = r
  }
  return best
}

export interface OneSidedResult {
  distance: number
  sourceSample: { x: number; y: number }
  targetNearest: { x: number; y: number }
}

const oneSidedWorst = (
  source: CurveEval,
  closestOnTarget: (qx: number, qy: number) => ClosestResult,
  samples: number,
): OneSidedResult => {
  let d2Worst = 0
  let witnessX = 0
  let witnessY = 0
  let nearestX = 0
  let nearestY = 0
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const { px: qx, py: qy } = source(t)
    const r = closestOnTarget(qx, qy)
    if (r.d2 > d2Worst) {
      d2Worst = r.d2
      witnessX = qx
      witnessY = qy
      nearestX = r.px
      nearestY = r.py
    }
  }
  return {
    distance: Math.sqrt(d2Worst),
    sourceSample: { x: witnessX, y: witnessY },
    targetNearest: { x: nearestX, y: nearestY },
  }
}

export interface HausdorffResult {
  distance: number
  // Which sweep produced the max. The witness lives on the named source curve.
  direction: 'rational→polynomial' | 'polynomial→rational'
  witness: { x: number; y: number }
  nearest: { x: number; y: number }
  rationalToPolynomial: OneSidedResult
  polynomialToRational: OneSidedResult
}

/**
 * Sampling-based symmetric Hausdorff estimate between a rational cubic and a
 * polynomial cubic-path approximation of it.
 *
 * Strategy: sample each curve at `samples` points, project each sample onto
 * the other curve (coarse sample + bisection refinement to ~1e-12 in the
 * parameter), take the worst projection distance across both sweeps.
 *
 * Always biased low — it cannot exceed the true Hausdorff, so a "small" answer
 * here is suggestive but not a guarantee. Replaced by a certified subdivision
 * Hausdorff once we wire that in.
 */
export const hausdorffEstimate = (
  rational: RationalCubicCurve2d,
  approximation: CubicPath2d,
  samples = 200,
): HausdorffResult => {
  const rationalEval = rationalCubicEval(rational)
  const segments = [...approximation]

  const rationalToPolynomial = oneSidedWorst(
    rationalEval,
    (qx, qy) => closestOnPath(approximation, qx, qy),
    samples,
  )

  // Distribute samples across polynomial segments proportionally to segment
  // count. Endpoints are duplicated at segment joins, which is harmless for a
  // max-based metric.
  const samplesPerSegment = Math.max(2, Math.ceil(samples / Math.max(1, segments.length)))
  let polynomialToRational: OneSidedResult = {
    distance: 0,
    sourceSample: { x: 0, y: 0 },
    targetNearest: { x: 0, y: 0 },
  }
  for (const segment of segments) {
    const local = oneSidedWorst(
      polynomialCubicEval(segment),
      (qx, qy) => closestOnSegment(rationalEval, qx, qy),
      samplesPerSegment,
    )
    if (local.distance > polynomialToRational.distance) polynomialToRational = local
  }

  const rtpWins = rationalToPolynomial.distance >= polynomialToRational.distance
  return {
    distance: Math.max(rationalToPolynomial.distance, polynomialToRational.distance),
    direction: rtpWins ? 'rational→polynomial' : 'polynomial→rational',
    witness: rtpWins ? rationalToPolynomial.sourceSample : polynomialToRational.sourceSample,
    nearest: rtpWins ? rationalToPolynomial.targetNearest : polynomialToRational.targetNearest,
    rationalToPolynomial,
    polynomialToRational,
  }
}
