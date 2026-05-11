import * as Characteristic from '../characteristic'
import * as Interval from '../interval'
import { dual, Pipeable } from '../pipe'
import * as CubicPolynomial from '../polynomial/cubic'
import * as Solution from '../solution'
import { invariant } from '../utils'
import * as Vector2 from '../vector/vector2'
import * as Vector4 from '../vector/vector4'
import type { RationalCubicCurve2d } from './rationalCubic2d'

export const RationalCubicCurve2dTypeId: unique symbol = Symbol('curvy/curve/rationalCubic2d')
export type RationalCubicCurve2dTypeId = typeof RationalCubicCurve2dTypeId

// Phantom property key carrying the per-axis trait tuple. Unlike `CubicCurve2d`
// where traits flow through to the underlying polynomials, rational curve
// traits are properties of the projected rational functions x(t)/w(t) and
// y(t)/w(t) — not of any individual polynomial — so the brand lives on the
// curve itself.
export const RationalCurveTraits: unique symbol = Symbol.for('curvy/curve/rationalCubic2d/traits')
export type RationalCurveTraits = typeof RationalCurveTraits

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

export const isRationalCubicCurve2d = (c: unknown): c is RationalCubicCurve2d =>
  typeof c === 'object' && c !== null && RationalCubicCurve2dTypeId in c

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
    if (signLo * signHi < 0) {
      throw new Error(
        `makeMonotonicEasing: slopes (${m0}, ${m1}) produce a non-monotonic curve with the default Gregory-Delbourgo construction. Try smaller slopes or use a different easing form.`,
      )
    }
  }

  return new RationalCubicCurve2dImpl(xPoly, yPoly, wPoly)
}

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
