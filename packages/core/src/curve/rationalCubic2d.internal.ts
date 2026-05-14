import * as Characteristic from '../characteristic/characteristic.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import * as Monotonicity from '../monotonicity/monotonicity.ts'
import { dual, Pipeable } from '../utils.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import * as Solution from '../solution/solution.ts'
import type { Decreasing, Increasing, Monotonic } from '../polynomial/traits.ts'
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

// Monomial coefficients of the quartic q(t) = N'(t)·D(t) − N(t)·D'(t).
//
// Since `r(t) = N(t)/D(t)` and `r'(t) = (N'·D − N·D')/D²`, with D² > 0 wherever
// D ≠ 0, the sign of `r'` equals the sign of `q` on the unit interval (the
// documented invariant assumes D is nonvanishing on `[0, 1]`). So per-axis
// monotonicity of the rational reduces to sign analysis of `q`.
//
// `q` is the difference of two degree-5 products, but the leading t⁵ terms of
// `N'·D` and `N·D'` both equal `3·n₃·d₃` and cancel — so `q` is actually
// degree 4. (For equal-degree-n rationals, the derivative-numerator has degree
// `2n − 2`.) Five monomial coefficients suffice.
const derivativeNumeratorQuartic = (
  n: CubicPolynomial.CubicPolynomial,
  d: CubicPolynomial.CubicPolynomial,
): readonly [number, number, number, number, number] => [
  n.c1 * d.c0 - n.c0 * d.c1,
  2 * (n.c2 * d.c0 - n.c0 * d.c2),
  n.c2 * d.c1 - n.c1 * d.c2 + 3 * (n.c3 * d.c0 - n.c0 * d.c3),
  2 * (n.c3 * d.c1 - n.c1 * d.c3),
  n.c3 * d.c2 - n.c2 * d.c3,
]

// Monomial → Bernstein basis conversion for degree 4 on [0, 1].
//
//   bⱼ = Σᵢ₌₀..ⱼ C(j, i)/C(4, i) · cᵢ
//
// Closed-form for n = 4 using C(4,·) = (1, 4, 6, 4, 1). Five outputs.
const bernsteinFromQuarticMonomial = (
  c0: number,
  c1: number,
  c2: number,
  c3: number,
  c4: number,
): readonly [number, number, number, number, number] => [
  c0,
  c0 + c1 / 4,
  c0 + c1 / 2 + c2 / 6,
  c0 + (3 * c1) / 4 + c2 / 2 + c3 / 4,
  c0 + c1 + c2 + c3 + c4,
]

// At depth 32 the recursion has bracketed any sign change to an interval of
// width 2⁻³² ≈ 2 × 10⁻¹⁰ — well below floating-point noise for typical
// curve coefficients. Surviving ambiguity at this depth indicates a
// tangential zero (touches but does not cross), which we report as
// `Monotonicity.None`.
const BERNSTEIN_SIGN_MAX_DEPTH = 32

// Bernstein sign convexity check on `[0, 1]`, returning the monotonicity
// implied for a function whose derivative is the polynomial described by
// these Bernstein coefficients. The encoding of `Monotonicity` is the same
// 2-bit sign-coverage bitmask used internally here (bit 0 = "polynomial
// takes positive values", bit 1 = "takes negative values"), so we can build
// up the result and return it without translation.
//
// Single-level: by the convex-hull property of Bernstein form, a polynomial's
// range on `[0, 1]` is contained in the convex hull of its Bernstein control
// values — so the sign coverage of those values upper-bounds the sign
// coverage of the polynomial. When the control values are sign-uniform we're
// done; when not, the polynomial *might* still be sign-uniform (the hull is
// only an outer bound), so we subdivide and check on tighter intervals.
//
// Recursive: split at t = 0.5 via de Casteljau (exact in Bernstein basis),
// classify each half, then OR the coverages — `Increasing | Decreasing`
// (subintervals of opposite sign) automatically degenerates to `None`,
// matching the convex-union semantics of the sign sets. The depth cap turns
// this into a decision procedure except at tangential zeros.
const certifyBernsteinSign = (
  bs: readonly [number, number, number, number, number],
  depth = 0,
): Monotonicity.Monotonicity => {
  let m: Monotonicity.Monotonicity = Monotonicity.Constant
  for (let i = 0; i < 5; i++) {
    const b = bs[i] as number
    if (b > 0) {
      m = (m | Monotonicity.Increasing) as Monotonicity.Monotonicity
    } else if (b < 0) {
      m = (m | Monotonicity.Decreasing) as Monotonicity.Monotonicity
    }
  }
  if (m !== Monotonicity.None) {
    return m
  }
  if (depth >= BERNSTEIN_SIGN_MAX_DEPTH) {
    return Monotonicity.None
  }

  // de Casteljau at t = 0.5: each level averages adjacent values. Left half
  // Bernstein coefficients are the first entry of each column; right half are
  // the last entry of each column, read in reverse.
  const [b0, b1, b2, b3, b4] = bs
  const c0 = (b0 + b1) * 0.5
  const c1 = (b1 + b2) * 0.5
  const c2 = (b2 + b3) * 0.5
  const c3 = (b3 + b4) * 0.5
  const d0 = (c0 + c1) * 0.5
  const d1 = (c1 + c2) * 0.5
  const d2 = (c2 + c3) * 0.5
  const e0 = (d0 + d1) * 0.5
  const e1 = (d1 + d2) * 0.5
  const f = (e0 + e1) * 0.5

  return (certifyBernsteinSign([b0, c0, d0, e0, f], depth + 1) |
    certifyBernsteinSign([f, e1, d2, c3, b4], depth + 1)) as Monotonicity.Monotonicity
}

const axisMonotonicity = (
  numerator: CubicPolynomial.CubicPolynomial,
  denominator: CubicPolynomial.CubicPolynomial,
): Monotonicity.Monotonicity => {
  const [q0, q1, q2, q3, q4] = derivativeNumeratorQuartic(numerator, denominator)
  return certifyBernsteinSign(bernsteinFromQuarticMonomial(q0, q1, q2, q3, q4))
}

/** @internal */
export const xMonotonicity = (c: RationalCubicCurve2d): Monotonicity.Monotonicity =>
  axisMonotonicity(c.x, c.w)

/** @internal */
export const yMonotonicity = (c: RationalCubicCurve2d): Monotonicity.Monotonicity =>
  axisMonotonicity(c.y, c.w)

/** @internal */
export const isMonotonicX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Monotonic, YT> => Monotonicity.isStrict(xMonotonicity(c))

/** @internal */
export const isIncreasingX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Increasing, YT> => xMonotonicity(c) === Monotonicity.Increasing

/** @internal */
export const isDecreasingX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Decreasing, YT> => xMonotonicity(c) === Monotonicity.Decreasing

/** @internal */
export const isMonotonicY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT, YT & Monotonic> => Monotonicity.isStrict(yMonotonicity(c))

/** @internal */
export const isIncreasingY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT, YT & Increasing> => yMonotonicity(c) === Monotonicity.Increasing

/** @internal */
export const isDecreasingY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT, YT & Decreasing> => yMonotonicity(c) === Monotonicity.Decreasing

// Combined refiners compose from per-axis ones via TypeScript's narrowing of
// the && chain: each per-axis predicate attaches its brand to its own axis,
// and the intersection accumulates as expected.
/** @internal */
export const isMonotonic = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Monotonic, YT & Monotonic> => isMonotonicX(c) && isMonotonicY(c)

/** @internal */
export const isIncreasing = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasingX(c) && isIncreasingY(c)

/** @internal */
export const isDecreasing = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): c is RationalCubicCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasingX(c) && isDecreasingY(c)

const fail = (m: string): never => {
  throw new Error(m)
}

/** @internal */
export const asMonotonicX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Monotonic, YT> =>
  isMonotonicX(c) ? c : fail('rational cubic curve is not monotonic in x')

/** @internal */
export const asIncreasingX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Increasing, YT> =>
  isIncreasingX(c) ? c : fail('rational cubic curve is not increasing in x')

/** @internal */
export const asDecreasingX = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Decreasing, YT> =>
  isDecreasingX(c) ? c : fail('rational cubic curve is not decreasing in x')

/** @internal */
export const asMonotonicY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT, YT & Monotonic> =>
  isMonotonicY(c) ? c : fail('rational cubic curve is not monotonic in y')

/** @internal */
export const asIncreasingY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT, YT & Increasing> =>
  isIncreasingY(c) ? c : fail('rational cubic curve is not increasing in y')

/** @internal */
export const asDecreasingY = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT, YT & Decreasing> =>
  isDecreasingY(c) ? c : fail('rational cubic curve is not decreasing in y')

/** @internal */
export const asMonotonic = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Monotonic, YT & Monotonic> =>
  isMonotonic(c) ? c : fail('rational cubic curve is not monotonic in both axes')

/** @internal */
export const asIncreasing = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasing(c) ? c : fail('rational cubic curve is not increasing in both axes')

/** @internal */
export const asDecreasing = <XT, YT>(
  c: RationalCubicCurve2d<XT, YT>,
): RationalCubicCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasing(c) ? c : fail('rational cubic curve is not decreasing in both axes')

// Depth cap for tight bounding box recursion. 2²⁰ ≈ 1M leaves is well past
// the point where any geometrically meaningful tolerance would still be
// driving subdivision — the cap is here to guard against tolerances
// approaching zero.
const MAX_BBOX_DEPTH = 20

/** @internal */
export const boundingBox = dual<
  (
    tolerance: number,
  ) => (c: RationalCubicCurve2d) => Interval2d.Interval2d<Interval.Closed, Interval.Closed>,
  (
    c: RationalCubicCurve2d,
    tolerance: number,
  ) => Interval2d.Interval2d<Interval.Closed, Interval.Closed>
>(2, (c: RationalCubicCurve2d, tolerance: number) => {
  invariant(
    Number.isFinite(tolerance) && tolerance > 0,
    'boundingBox: tolerance must be finite and > 0',
  )

  // Polynomial fast path: when W(t) is a constant (all weights equal at the
  // source), the curve coincides with a polynomial cubic and its tight box
  // is exact via the polynomial's per-axis range. No subdivision needed.
  if (c.w.c1 === 0 && c.w.c2 === 0 && c.w.c3 === 0) {
    const w = c.w.c0
    return Interval2d.make(
      CubicPolynomial.unitRange(
        CubicPolynomial.make(c.x.c0 / w, c.x.c1 / w, c.x.c2 / w, c.x.c3 / w),
      ),
      CubicPolynomial.unitRange(
        CubicPolynomial.make(c.y.c0 / w, c.y.c1 / w, c.y.c2 / w, c.y.c3 / w),
      ),
    )
  }

  // Per-segment recursion: union of leaf-segment hull AABBs, subdividing until
  // each leaf's hull is within `tolerance` per side of an inner reference that
  // is known to lie inside the curve's true range.
  //
  // The reference is the segment's endpoint AABB: `r(0)` and `r(1)` both lie
  // on the curve and therefore inside its true bounding box. So
  //   endpointBox ⊆ trueBox ⊆ hullBox
  // and the gap `hullBox − endpointBox` (per side) upper-bounds the gap
  // `hullBox − trueBox`. When that gap is ≤ tolerance on every side, the
  // leaf's hull box is provably within tolerance of its true range; the
  // union of all leaves is then within tolerance of the curve's tight box.
  const recurse = (
    curr: RationalCubicCurve2d,
    depth: number,
  ): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
    const hull = hullBoundingBox(curr)

    const w0 = curr.w.c0
    const x0 = curr.x.c0 / w0
    const y0 = curr.y.c0 / w0
    const w1 = curr.w.c0 + curr.w.c1 + curr.w.c2 + curr.w.c3
    const x1 = (curr.x.c0 + curr.x.c1 + curr.x.c2 + curr.x.c3) / w1
    const y1 = (curr.y.c0 + curr.y.c1 + curr.y.c2 + curr.y.c3) / w1

    const lowX = Math.min(x0, x1)
    const highX = Math.max(x0, x1)
    const lowY = Math.min(y0, y1)
    const highY = Math.max(y0, y1)

    const excess = Math.max(
      lowX - hull.x.start,
      hull.x.end - highX,
      lowY - hull.y.start,
      hull.y.end - highY,
    )

    if (excess <= tolerance || depth >= MAX_BBOX_DEPTH) {
      return hull
    }

    const [left, right] = subdivide(curr, 0.5)
    return Interval2d.union(recurse(left, depth + 1), recurse(right, depth + 1))
  }

  return recurse(c, 0)
})

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

// Loose hull-based bounding box from the rational's projected Bézier control
// polygon. Private leaf helper for the subdivision-based public `boundingBox`
// and for the Hausdorff machinery in `approximateAsCubicCurves`.
//
// Rational Bézier curves with positive weights satisfy the projected
// convex-hull property: the curve lies inside the convex hull of the four
// projected 2D control points (Wᵢ⁻¹·Xᵢ, Wᵢ⁻¹·Yᵢ). Their AABB is a strict
// superset of the hull, so it is a valid (and cheap) bound on the curve.
//
// Looser than the public tight box — for that we'd need the extrema of
// x(t)/w(t) and y(t)/w(t), each a degree-5 root problem — but tight enough
// for subdivision-based geometric queries, which compensate via depth.
const hullBoundingBox = (
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
    box: hullBoundingBox(c),
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
  const rationalBox = hullBoundingBox(rational)
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
