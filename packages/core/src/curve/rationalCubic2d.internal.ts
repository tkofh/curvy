import * as Characteristic from '../characteristic/characteristic.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import { dual, Pipeable } from '../utils.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import * as Solution from '../solution/solution.ts'
import { invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import * as Vector4 from '../vector/vector4.ts'
import * as CubicCurve2d from './cubic2d.ts'
import type { RationalCubicCurve2d } from './rationalCubic2d.ts'

export const RationalCubicCurve2dTypeId: unique symbol = Symbol('curvy/curve/rationalCubic2d')
export type RationalCubicCurve2dTypeId = typeof RationalCubicCurve2dTypeId

// Phantom property key carrying the per-axis trait tuple. Unlike `CubicCurve2d`
// where traits flow through to the underlying polynomials, rational curve
// traits are properties of the projected rational functions x(t)/w(t) and
// y(t)/w(t) — not of any individual polynomial — so the brand lives on the
// curve itself.
/** @internal */
export const RationalCurveTraits: unique symbol = Symbol.for('curvy/curve/rationalCubic2d/traits')
/** @internal */
export type RationalCurveTraits = typeof RationalCurveTraits

/** @internal */
export class RationalCubicCurve2dImpl
  extends Pipeable
  implements RationalCubicCurve2d<unknown, unknown>
{
  readonly [RationalCubicCurve2dTypeId]: RationalCubicCurve2dTypeId = RationalCubicCurve2dTypeId
  declare readonly [RationalCurveTraits]: [unknown, unknown]

  readonly x: CubicPolynomial.CubicPolynomial
  readonly y: CubicPolynomial.CubicPolynomial
  readonly w: CubicPolynomial.CubicPolynomial

  constructor(
    x: CubicPolynomial.CubicPolynomial,
    y: CubicPolynomial.CubicPolynomial,
    w: CubicPolynomial.CubicPolynomial,
  ) {
    super()
    this.x = x
    this.y = y
    this.w = w
  }
}

/** @internal */
export const isRationalCubicCurve2d = (c: unknown): c is RationalCubicCurve2d =>
  typeof c === 'object' && c !== null && RationalCubicCurve2dTypeId in c

/** @internal */
export const fromPolynomials = (
  x: CubicPolynomial.CubicPolynomial,
  y: CubicPolynomial.CubicPolynomial,
  w: CubicPolynomial.CubicPolynomial,
): RationalCubicCurve2d => new RationalCubicCurve2dImpl(x, y, w)

// Applies the cubic Bézier characteristic matrix in homogeneous space —
// each control point is lifted to `(w·x, w·y, w)` and the same matrix that
// drives `CubicCurve2d.fromBezierPoints` runs on each of the three channels
// independently. The shared `w` polynomial is the projective denominator;
// at solve time, x(t)/w(t) and y(t)/w(t) project the curve back to the plane.
//
// This is Freya Holmér's "matrix IS the spline" framing extended to rational:
// same matrix, three channels instead of two, one projection at the end.
/** @internal */
export const fromBezierPoints = (
  p0: Vector2.Weighted,
  p1: Vector2.Weighted,
  p2: Vector2.Weighted,
  p3: Vector2.Weighted,
): RationalCubicCurve2d =>
  new RationalCubicCurve2dImpl(
    ...Characteristic.apply(
      Characteristic.cubicBezier,
      // Lift each control point to homogeneous (w·x, w·y, w), then transpose
      // the four lifted CPs into three per-channel Vector4s for the matrix.
      ...Vector4.transpose([p0, p1, p2, p3], (p) => [p.x * p.weight, p.y * p.weight, p.weight]),
    ),
  )

// Gregory-Delbourgo style monotone rational cubic Hermite easing.
//
// Construction: rational cubic with *linear* denominator embedded in the 2D
// pipeline by pinning x(t) = t exactly. With endpoint weights α at t=0 and
// β at t=1, the Hermite conditions y(0)=0, y(1)=1, y'(0)=m₀, y'(1)=m₁
// produce a closed-form cubic numerator. Monotonicity of y(t) is then a
// degree-3 polynomial sign question — verified rigorously with the existing
// cubic root-finder.
//
// The 2D embedding stores three polynomials in cubic form:
//   X(t) = t · Q(t)        (quadratic, c3 = 0)        so x(t)/w(t) = t
//   Y(t) = cubic numerator
//   W(t) = Q(t) = α + (β-α)·t  (linear, c2 = c3 = 0)
//
// The α = m₀+1, β = m₁+1 choice is a serviceable heuristic — it makes
// smoothstep (m₀=m₁=0) and linear (m₀=m₁=1) fall out for free, gives a
// useful operating range for moderate slopes, and throws cleanly on inputs
// it can't handle. Finding the optimal α, β formula for a wider input range
// is a v2 problem.
/** @internal */
export const makeMonotonicEasing = (startSlope: number, endSlope: number): RationalCubicCurve2d => {
  invariant(
    Number.isFinite(startSlope) && startSlope >= 0,
    'makeMonotonicEasing: startSlope must be finite and ≥ 0',
  )
  invariant(
    Number.isFinite(endSlope) && endSlope >= 0,
    'makeMonotonicEasing: endSlope must be finite and ≥ 0',
  )

  const m0 = startSlope
  const m1 = endSlope
  const alpha = m0 + 1
  const beta = m1 + 1

  // Numerator P(t) cubic coefficients, derived from Hermite conditions
  // y(0)=0, y(1)=1, y'(0)=m₀·α/α = m₀, y'(1)=(m₁·β + (β-α))/β = m₁:
  //   c0 = 0
  //   c1 = m₀·α
  //   c2 = β·(2 - m₁) + α·(1 - 2m₀)
  //   c3 = β·(m₁ - 1) + α·(m₀ - 1)
  const pC0 = 0
  const pC1 = m0 * alpha
  const pC2 = beta * (2 - m1) + alpha * (1 - 2 * m0)
  const pC3 = beta * (m1 - 1) + alpha * (m0 - 1)

  // Denominator Q(t) = α + (β-α)·t — linear, stored as cubic with c2=c3=0.
  const qC0 = alpha
  const qC1 = beta - alpha

  // X(t) = t · Q(t) = α·t + (β-α)·t² — quadratic, stored as cubic with c3=0.
  const xC1 = alpha
  const xC2 = beta - alpha

  const xPoly = CubicPolynomial.make(0, xC1, xC2, 0)
  const yPoly = CubicPolynomial.make(pC0, pC1, pC2, pC3)
  const wPoly = CubicPolynomial.make(qC0, qC1, 0, 0)

  // Verify monotonicity of y(t) = P(t)/Q(t) on (0, 1).
  //
  // sign(y'(t)) = sign(P'·Q - P·Q')  (since Q > 0 on [0,1])
  //
  // P' is degree 2, Q is degree 1, Q' is constant — so P'·Q - P·Q' is a
  // degree-3 polynomial. We compute its coefficients and clip the roots to
  // the strict interior (0, 1); any surviving root where the polynomial
  // changes sign means y'(t) crosses zero inside the interval and the curve
  // is not monotonic.
  //
  //   q(t) = m₀·α² + 2·α·a·t + (3·α·b + a·(β-α))·t² + 2·b·(β-α)·t³
  // where a = β(2-m₁) + α(1-2m₀), b = β(m₁-1) + α(m₀-1) — i.e. c2 and c3.
  const monoQ = CubicPolynomial.make(
    m0 * alpha * alpha,
    2 * alpha * pC2,
    3 * alpha * pC3 + pC2 * (beta - alpha),
    2 * pC3 * (beta - alpha),
  )

  const interiorRoots = monoQ.pipe(CubicPolynomial.roots, Solution.clip(Interval.unitOpen))
  for (const t of interiorRoots) {
    // Check sign on both sides of the root. If the polynomial changes sign
    // across this point, monotonicity is violated.
    const epsilon = 1e-6
    const lo = Math.max(0, t - epsilon)
    const hi = Math.min(1, t + epsilon)
    const signLo = Math.sign(CubicPolynomial.solve(monoQ, lo))
    const signHi = Math.sign(CubicPolynomial.solve(monoQ, hi))
    invariant(
      signLo * signHi >= 0,
      `makeMonotonicEasing: slopes (${m0}, ${m1}) produce a non-monotonic curve with the default Gregory-Delbourgo construction. Try smaller slopes or use a different easing form.`,
    )
  }

  return new RationalCubicCurve2dImpl(xPoly, yPoly, wPoly)
}

/** @internal */
export const solve = dual<
  (t: number) => (c: RationalCubicCurve2d) => Vector2.Vector2,
  (c: RationalCubicCurve2d, t: number) => Vector2.Vector2
>(2, (c: RationalCubicCurve2d, t: number) => {
  const w = CubicPolynomial.solve(c.w, t)
  return Vector2.make(CubicPolynomial.solve(c.x, t) / w, CubicPolynomial.solve(c.y, t) / w)
})

// Inverse-solve x(t)/w(t) = X by finding roots of X(t) - X·w(t) = 0.
// Both X(t) and w(t) are cubic in t, so their linear combination is also
// cubic — solvable with the existing cubic root-finder. Solutions outside
// the [0, 1] unit interval are discarded; for each surviving t, y(t)/w(t)
// is evaluated. The brand-aware overload narrows to `AtMostOne` for curves
// known to be x-monotonic.
/** @internal */
export const solveAtX = dual(
  2,
  (c: RationalCubicCurve2d, x: number): Solution.Solution<number> =>
    CubicPolynomial.make(
      c.x.c0 - x * c.w.c0,
      c.x.c1 - x * c.w.c1,
      c.x.c2 - x * c.w.c2,
      c.x.c3 - x * c.w.c3,
    ).pipe(
      CubicPolynomial.roots,
      Solution.clip(Interval.unit),
      Solution.map((t) => CubicPolynomial.solve(c.y, t) / CubicPolynomial.solve(c.w, t)),
    ),
)

/** @internal */
export const solveAtY = dual(
  2,
  (c: RationalCubicCurve2d, y: number): Solution.Solution<number> =>
    CubicPolynomial.make(
      c.y.c0 - y * c.w.c0,
      c.y.c1 - y * c.w.c1,
      c.y.c2 - y * c.w.c2,
      c.y.c3 - y * c.w.c3,
    ).pipe(
      CubicPolynomial.roots,
      Solution.clip(Interval.unit),
      Solution.map((t) => CubicPolynomial.solve(c.x, t) / CubicPolynomial.solve(c.w, t)),
    ),
)

// Approximation cap. At depth 20 we'd emit up to 2²⁰ ≈ 1M segments for one
// input curve — well past any sane target — so the cap is really just a guard
// against pathological tolerances (e.g. tolerance approaching 0).
const MAX_APPROX_DEPTH = 20

// Builds the polynomial-cubic candidate for one rational segment by:
//   1. Inverting Bernstein → monomial on each of x, y, w to recover the four
//      homogeneous Bézier control points (Xᵢ, Yᵢ, Wᵢ).
//   2. Projecting each CP back to 2D as (Xᵢ/Wᵢ, Yᵢ/Wᵢ).
//   3. Lifting those 2D CPs back to a polynomial cubic via fromBezierPoints.
// The result matches the rational at t=0 and t=1 exactly and matches endpoint
// tangent directions, but interior shape diverges whenever the weights are
// not all equal.
const buildCubicCandidate = (c: RationalCubicCurve2d): CubicCurve2d.CubicCurve2d => {
  const x0 = c.x.c0
  const x1 = c.x.c0 + c.x.c1 / 3
  const x2 = c.x.c0 + (2 * c.x.c1) / 3 + c.x.c2 / 3
  const x3 = c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3

  const y0 = c.y.c0
  const y1 = c.y.c0 + c.y.c1 / 3
  const y2 = c.y.c0 + (2 * c.y.c1) / 3 + c.y.c2 / 3
  const y3 = c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3

  const w0 = c.w.c0
  const w1 = c.w.c0 + c.w.c1 / 3
  const w2 = c.w.c0 + (2 * c.w.c1) / 3 + c.w.c2 / 3
  const w3 = c.w.c0 + c.w.c1 + c.w.c2 + c.w.c3

  return CubicCurve2d.fromBezierPoints(
    Vector2.make(x0 / w0, y0 / w0),
    Vector2.make(x1 / w1, y1 / w1),
    Vector2.make(x2 / w2, y2 / w2),
    Vector2.make(x3 / w3, y3 / w3),
  )
}

// Splits a rational cubic at parameter `t ∈ (0, 1)` by applying
// `CubicPolynomial.subdivide` independently to each of x, y, w. Equivalent to
// de Casteljau on the homogeneous control polygon but stays in monomial form
// throughout, so no Bernstein round-trip is required.
/** @internal */
export const subdivide = dual<
  (t: number) => (c: RationalCubicCurve2d) => [RationalCubicCurve2d, RationalCubicCurve2d],
  (c: RationalCubicCurve2d, t: number) => [RationalCubicCurve2d, RationalCubicCurve2d]
>(2, (c: RationalCubicCurve2d, t: number) => {
  const [leftX, rightX] = CubicPolynomial.subdivide(c.x, t)
  const [leftY, rightY] = CubicPolynomial.subdivide(c.y, t)
  const [leftW, rightW] = CubicPolynomial.subdivide(c.w, t)

  return [
    new RationalCubicCurve2dImpl(leftX, leftY, leftW),
    new RationalCubicCurve2dImpl(rightX, rightY, rightW),
  ]
})

// Loose bounding box from the rational's projected Bézier control polygon.
//
// Rational Bézier curves with positive weights satisfy the projected
// convex-hull property: the curve lies inside the convex hull of the four
// projected 2D control points (Wᵢ⁻¹·Xᵢ, Wᵢ⁻¹·Yᵢ). Their AABB is a strict
// superset of the hull, so it is a valid (and cheap) bound on the curve.
//
// Looser than a true tight box — for that we'd need the extrema of x(t)/w(t)
// and y(t)/w(t), each a degree-5 root problem — but tight enough for
// subdivision-based geometric queries, which compensate via depth.
/** @internal */
export const boundingBox = (
  c: RationalCubicCurve2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  // Bernstein control points recovered from monomial coefficients — same
  // inversion as `buildCubicCandidate`.
  const x0 = c.x.c0
  const x1 = c.x.c0 + c.x.c1 / 3
  const x2 = c.x.c0 + (2 * c.x.c1) / 3 + c.x.c2 / 3
  const x3 = c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3

  const y0 = c.y.c0
  const y1 = c.y.c0 + c.y.c1 / 3
  const y2 = c.y.c0 + (2 * c.y.c1) / 3 + c.y.c2 / 3
  const y3 = c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3

  const w0 = c.w.c0
  const w1 = c.w.c0 + c.w.c1 / 3
  const w2 = c.w.c0 + (2 * c.w.c1) / 3 + c.w.c2 / 3
  const w3 = c.w.c0 + c.w.c1 + c.w.c2 + c.w.c3

  return Interval2d.fromVectors(
    Vector2.make(x0 / w0, y0 / w0),
    Vector2.make(x1 / w1, y1 / w1),
    Vector2.make(x2 / w2, y2 / w2),
    Vector2.make(x3 / w3, y3 / w3),
  )
}

// Certified Hausdorff-within-tolerance check between a rational and a
// candidate polynomial cubic.
//
// `approximateAsCubicCurves` uses this as the stopping criterion: when it
// returns `true`, every point on the rational is provably within `tolerance`
// of the candidate, and every point on the candidate is within `tolerance` of
// the rational. When `false`, the rational is subdivided and the procedure
// recurses.
//
// Implementation: for each direction (rational → candidate, candidate →
// rational), run a depth-first subdivision on the source side. At each
// piece, compute
//
//   lower = dist(witness-on-piece, target)
//   upper = min(
//     lower + maxDist(witness, piece.box),     // triangle inequality bound
//     maxDist(piece.box, target.box),          // box-pair bound
//   )
//
// Both upper bounds are provable; their min is too. The triangle bound
// shrinks proportionally to source box diameter, so it dominates when source
// and target overlap (which they usually do here — the candidate matches the
// rational at endpoints and tangents). Early-terminate on the first piece
// whose `lower` exceeds `tolerance` (definitive miss) or accept whenever
// every piece's `upper` ≤ tolerance.

const MAX_HAUSDORFF_DEPTH = 30

// Coarse sample + bisection on the squared-distance derivative. Returns the
// minimum squared distance from (qx, qy) to a parametric curve described by
// `eval_`. Stationary points of (P(s) - q) · P'(s) are local extrema of
// D²(s); 32 coarse samples reliably bracket the global min for cubic-degree
// curves (which have at most ~5 critical points of squared distance).
const closestSquaredDistance = (
  eval_: (s: number) => { px: number; py: number; tx: number; ty: number },
  qx: number,
  qy: number,
): number => {
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

const polynomialEval = (c: CubicCurve2d.CubicCurve2d, s: number) => ({
  px: c.x.c0 + s * (c.x.c1 + s * (c.x.c2 + s * c.x.c3)),
  py: c.y.c0 + s * (c.y.c1 + s * (c.y.c2 + s * c.y.c3)),
  tx: c.x.c1 + s * (2 * c.x.c2 + s * 3 * c.x.c3),
  ty: c.y.c1 + s * (2 * c.y.c2 + s * 3 * c.y.c3),
})

// R(s) = (X(s)/W(s), Y(s)/W(s))  →  R'(s) = ((X'W - XW')/W², (Y'W - YW')/W²)
const rationalEval = (c: RationalCubicCurve2d, s: number) => {
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

const maxDistFromPointToBox = (px: number, py: number, box: Interval2d.Interval2d): number => {
  const xLo = Math.min(box.x.start, box.x.end)
  const xHi = Math.max(box.x.start, box.x.end)
  const yLo = Math.min(box.y.start, box.y.end)
  const yHi = Math.max(box.y.start, box.y.end)
  const dx = Math.max(px - xLo, xHi - px)
  const dy = Math.max(py - yLo, yHi - py)
  return Math.hypot(dx, dy)
}

// Subdivide a polynomial cubic curve at parameter t by subdividing each
// per-axis polynomial independently — the polynomial split is exact and in
// monomial form.
const subdividePolynomial = (
  c: CubicCurve2d.CubicCurve2d,
  t: number,
): [CubicCurve2d.CubicCurve2d, CubicCurve2d.CubicCurve2d] => {
  const [leftX, rightX] = CubicPolynomial.subdivide(c.x, t)
  const [leftY, rightY] = CubicPolynomial.subdivide(c.y, t)
  return [CubicCurve2d.fromPolynomials(leftX, leftY), CubicCurve2d.fromPolynomials(rightX, rightY)]
}

interface CertifiedPiece {
  box: Interval2d.Interval2d
  witnessX: number
  witnessY: number
  depth: number
  subdivide(): [CertifiedPiece, CertifiedPiece]
}

const rationalPiece = (c: RationalCubicCurve2d, depth = 0): CertifiedPiece => {
  const wMid = CubicPolynomial.solve(c.w, 0.5)
  const witnessX = CubicPolynomial.solve(c.x, 0.5) / wMid
  const witnessY = CubicPolynomial.solve(c.y, 0.5) / wMid
  return {
    box: boundingBox(c),
    witnessX,
    witnessY,
    depth,
    subdivide: () => {
      const [left, right] = subdivide(c, 0.5)
      return [rationalPiece(left, depth + 1), rationalPiece(right, depth + 1)]
    },
  }
}

const polynomialPiece = (c: CubicCurve2d.CubicCurve2d, depth = 0): CertifiedPiece => {
  const witnessX = CubicPolynomial.solve(c.x, 0.5)
  const witnessY = CubicPolynomial.solve(c.y, 0.5)
  return {
    box: CubicCurve2d.boundingBox(c),
    witnessX,
    witnessY,
    depth,
    subdivide: () => {
      const [left, right] = subdividePolynomial(c, 0.5)
      return [polynomialPiece(left, depth + 1), polynomialPiece(right, depth + 1)]
    },
  }
}

const oneSidedWithinTolerance = (
  initialPiece: CertifiedPiece,
  targetBox: Interval2d.Interval2d,
  targetClosestSquared: (qx: number, qy: number) => number,
  tolerance: number,
): boolean => {
  const tol2 = tolerance * tolerance
  const stack: Array<CertifiedPiece> = [initialPiece]
  while (stack.length > 0) {
    const piece = stack.pop() as CertifiedPiece
    const lower2 = targetClosestSquared(piece.witnessX, piece.witnessY)
    if (lower2 > tol2) {
      return false
    }
    const lower = Math.sqrt(lower2)
    const triangleUpper = lower + maxDistFromPointToBox(piece.witnessX, piece.witnessY, piece.box)
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

const hausdorffWithinTolerance = (
  rational: RationalCubicCurve2d,
  candidate: CubicCurve2d.CubicCurve2d,
  tolerance: number,
): boolean => {
  // Algebraic fast path: when the denominator polynomial is constant — every
  // weighted Bézier control point shares the same weight, so the rational
  // reduces to a polynomial cubic — `buildCubicCandidate` is exact. The
  // Bernstein → monomial transform produces exact zero higher coefficients
  // for a uniform input (integer cancellation), and `CubicPolynomial.subdivide`
  // preserves constants, so this check holds at every recursion depth.
  //
  // Without this fast path the subdivision Hausdorff would take ~30 levels
  // to certify the coincident-curve case at sub-pixel tolerances, even
  // though the answer is exactly zero.
  if (rational.w.c1 === 0 && rational.w.c2 === 0 && rational.w.c3 === 0) {
    return true
  }

  const candidateBox = CubicCurve2d.boundingBox(candidate)
  if (
    !oneSidedWithinTolerance(
      rationalPiece(rational),
      candidateBox,
      (qx, qy) => closestSquaredDistance((s) => polynomialEval(candidate, s), qx, qy),
      tolerance,
    )
  ) {
    return false
  }
  const rationalBox = boundingBox(rational)
  return oneSidedWithinTolerance(
    polynomialPiece(candidate),
    rationalBox,
    (qx, qy) => closestSquaredDistance((s) => rationalEval(rational, s), qx, qy),
    tolerance,
  )
}

/** @internal */
export const approximateAsCubicCurves = dual<
  (tolerance: number) => (c: RationalCubicCurve2d) => ReadonlyArray<CubicCurve2d.CubicCurve2d>,
  (c: RationalCubicCurve2d, tolerance: number) => ReadonlyArray<CubicCurve2d.CubicCurve2d>
>(2, (c: RationalCubicCurve2d, tolerance: number) => {
  invariant(
    Number.isFinite(tolerance) && tolerance > 0,
    'approximateAsCubicCurves: tolerance must be finite and > 0',
  )

  const out: Array<CubicCurve2d.CubicCurve2d> = []
  const recurse = (curr: RationalCubicCurve2d, depth: number): void => {
    const candidate = buildCubicCandidate(curr)
    if (depth >= MAX_APPROX_DEPTH || hausdorffWithinTolerance(curr, candidate, tolerance)) {
      out.push(candidate)
      return
    }
    const [left, right] = subdivide(curr, 0.5)
    recurse(left, depth + 1)
    recurse(right, depth + 1)
  }
  recurse(c, 0)
  return out
})
