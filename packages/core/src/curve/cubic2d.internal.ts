import * as Interval2d from '../interval/interval2d.ts'
import * as Characteristic from '../characteristic/characteristic.ts'
import * as Interval from '../interval/interval.ts'
import type * as Affine2d from '../transform/affine2d.ts'
import {
  GL32_W0,
  GL32_W1,
  GL32_W2,
  GL32_W3,
  GL32_W4,
  GL32_W5,
  GL32_W6,
  GL32_W7,
  GL32_W8,
  GL32_W9,
  GL32_W10,
  GL32_W11,
  GL32_W12,
  GL32_W13,
  GL32_W14,
  GL32_W15,
  GL32_X0,
  GL32_X1,
  GL32_X2,
  GL32_X3,
  GL32_X4,
  GL32_X5,
  GL32_X6,
  GL32_X7,
  GL32_X8,
  GL32_X9,
  GL32_X10,
  GL32_X11,
  GL32_X12,
  GL32_X13,
  GL32_X14,
  GL32_X15,
} from '../length.ts'
import { dual, Pipeable } from '../utils.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import * as QuadraticPolynomial from '../polynomial/quadratic.ts'
import type { Decreasing, Increasing, Monotonic, Reflected } from '../polynomial/traits.ts'
import * as Solution from '../solution/solution.ts'
import * as Vector2 from '../vector/vector2.ts'
import * as Vector4 from '../vector/vector4.ts'
import type { Curve2dOps } from './curve2d.ts'
import type { CubicCurve2d } from './cubic2d.ts'
import * as LinearCurve2d from './linear2d.ts'
import * as QuadraticCurve2d from './quadratic2d.ts'

export const CubicCurve2dTypeId: unique symbol = Symbol('curvy/curve/cubic2d')
export type CubicCurve2dTypeId = typeof CubicCurve2dTypeId

/** @internal */
export class CubicCurve2dImpl extends Pipeable implements CubicCurve2d<unknown, unknown> {
  readonly [CubicCurve2dTypeId]: CubicCurve2dTypeId = CubicCurve2dTypeId

  readonly x: CubicPolynomial.CubicPolynomial
  readonly y: CubicPolynomial.CubicPolynomial

  constructor(c0: CubicPolynomial.CubicPolynomial, c1: CubicPolynomial.CubicPolynomial) {
    super()
    this.x = c0
    this.y = c1
  }

  get [0]() {
    return this.x
  }

  get [1]() {
    return this.y
  }
}

/** @internal */
export const fromPolynomials: (
  c0: CubicPolynomial.CubicPolynomial,
  c1: CubicPolynomial.CubicPolynomial,
) => CubicCurve2d = (c0, c1) => new CubicCurve2dImpl(c0, c1)

/** @internal */
export const fromCoefficients: (
  c0: Vector2.Vector2,
  c1: Vector2.Vector2,
  c2: Vector2.Vector2,
  c3: Vector2.Vector2,
) => CubicCurve2d = (c0, c1, c2, c3) =>
  new CubicCurve2dImpl(
    CubicPolynomial.make(c0.x, c1.x, c2.x, c3.x),
    CubicPolynomial.make(c0.y, c1.y, c2.y, c3.y),
  )

// Applies the cubic Bézier characteristic matrix to the per-axis control
// vectors, producing monomial polynomials. The matrix encodes the cubic
// Bernstein -> monomial expansion `(c0, c1, c2, c3) = M * (p0, p1, p2, p3)`
// for each axis independently.
/** @internal */
export const fromBezierPoints: (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
) => CubicCurve2d = (p0, p1, p2, p3) =>
  new CubicCurve2dImpl(
    ...Characteristic.apply(
      Characteristic.cubicBezier,
      ...Vector4.transpose([p0, p1, p2, p3], (p) => [p.x, p.y]),
    ),
  )

/** @internal */
export const isCubicCurve2d = (c: unknown): c is CubicCurve2d =>
  typeof c === 'object' && c !== null && CubicCurve2dTypeId in c

/** @internal */
export const solve = dual<
  (t: number) => (c: CubicCurve2d) => Vector2.Vector2,
  (c: CubicCurve2d, t: number) => Vector2.Vector2
>(2, (c: CubicCurve2d, t: number) =>
  Vector2.make(CubicPolynomial.solve(c.x, t), CubicPolynomial.solve(c.y, t)),
)

// solveAtX: invert the x polynomial to find ts within the unit interval, then
// evaluate y at each surviving t. Result order matches solveInverse order
// (t-ascending).
/** @internal */
export const solveAtX = dual(2, (c: CubicCurve2d, x: number) =>
  CubicPolynomial.solveInverse(c.x, x).pipe(
    Solution.clipApprox(Interval.unit),
    Solution.map(CubicPolynomial.toSolver(c.y)),
  ),
)

/** @internal */
export const solveAtY = dual(2, (c: CubicCurve2d, y: number) =>
  CubicPolynomial.solveInverse(c.y, y).pipe(
    Solution.clipApprox(Interval.unit),
    Solution.map(CubicPolynomial.toSolver(c.x)),
  ),
)

/** @internal */
export const derivative = (c: CubicCurve2d) =>
  QuadraticCurve2d.fromPolynomials(CubicPolynomial.derivative(c.x), CubicPolynomial.derivative(c.y))

/** @internal */
export const length = dual(2, (c: CubicCurve2d, i: Interval.Interval) => {
  if (Interval.size(i) === 0) {
    return 0
  }

  if (c.x.c3 === 0 && c.y.c3 === 0) {
    return QuadraticCurve2d.length(
      QuadraticCurve2d.fromPolynomials(
        QuadraticPolynomial.make(c.x.c0, c.x.c1, c.x.c2),
        QuadraticPolynomial.make(c.y.c0, c.y.c1, c.y.c2),
      ),
      i,
    )
  }

  const d = derivative(c)

  const { scale, shift } = Interval.scaleShift(Interval.biunit, i)

  return (
    (GL32_W0 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X0)) +
      GL32_W0 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X0)) +
      GL32_W1 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X1)) +
      GL32_W1 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X1)) +
      GL32_W2 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X2)) +
      GL32_W2 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X2)) +
      GL32_W3 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X3)) +
      GL32_W3 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X3)) +
      GL32_W4 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X4)) +
      GL32_W4 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X4)) +
      GL32_W5 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X5)) +
      GL32_W5 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X5)) +
      GL32_W6 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X6)) +
      GL32_W6 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X6)) +
      GL32_W7 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X7)) +
      GL32_W7 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X7)) +
      GL32_W8 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X8)) +
      GL32_W8 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X8)) +
      GL32_W9 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X9)) +
      GL32_W9 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X9)) +
      GL32_W10 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X10)) +
      GL32_W10 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X10)) +
      GL32_W11 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X11)) +
      GL32_W11 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X11)) +
      GL32_W12 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X12)) +
      GL32_W12 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X12)) +
      GL32_W13 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X13)) +
      GL32_W13 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X13)) +
      GL32_W14 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X14)) +
      GL32_W14 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X14)) +
      GL32_W15 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * -GL32_X15)) +
      GL32_W15 * Vector2.magnitude(QuadraticCurve2d.solve(d, shift + scale * GL32_X15))) *
    scale
  )
})

/** @internal */
export const curvature = dual(2, (c: CubicCurve2d, t: number) => {
  const d = derivative(c)

  const v = QuadraticCurve2d.solve(d, t)
  const a = LinearCurve2d.solve(QuadraticCurve2d.derivative(d), t)

  const vMag = Vector2.magnitude(v)

  if (vMag === 0) {
    return 0
  }

  return Math.abs(Vector2.cross(v, a)) / vMag ** 3
})

/** @internal */
export const boundingBox = (
  c: CubicCurve2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> =>
  Interval2d.make(CubicPolynomial.unitRange(c.x), CubicPolynomial.unitRange(c.y))

/** @internal */
export const startPoint = (c: CubicCurve2d): Vector2.Vector2 => Vector2.make(c.x.c0, c.y.c0)

/** @internal */
export const endPoint = (c: CubicCurve2d): Vector2.Vector2 =>
  Vector2.make(c.x.c0 + c.x.c1 + c.x.c2 + c.x.c3, c.y.c0 + c.y.c1 + c.y.c2 + c.y.c3)

/** @internal */
export const xRange = (c: CubicCurve2d): Interval.Closed => CubicPolynomial.unitRange(c.x)

/** @internal */
export const yRange = (c: CubicCurve2d): Interval.Closed => CubicPolynomial.unitRange(c.y)

// Cubic Bernstein basis: P(t) = (1-t)^3*p0 + 3(1-t)^2t*p1 + 3(1-t)t^2*p2 + t^3*p3
// expanded gives c0 = p0, c1 = -3p0 + 3p1, c2 = 3p0 - 6p1 + 3p2,
// c3 = -p0 + 3p1 - 3p2 + p3, so the inverse is
//   p0 = c0, p1 = c0 + c1/3, p2 = c0 + 2c1/3 + c2/3, p3 = c0 + c1 + c2 + c3.
/** @internal */
export const toPathDataSegment = (c: CubicCurve2d): string => {
  const c0x = c.x.c0
  const c0y = c.y.c0
  const c1x = c.x.c1
  const c1y = c.y.c1
  const c2x = c.x.c2
  const c2y = c.y.c2
  const c3x = c.x.c3
  const c3y = c.y.c3
  const ctrl1X = c0x + c1x / 3
  const ctrl1Y = c0y + c1y / 3
  const ctrl2X = c0x + (2 * c1x) / 3 + c2x / 3
  const ctrl2Y = c0y + (2 * c1y) / 3 + c2y / 3
  const endX = c0x + c1x + c2x + c3x
  const endY = c0y + c1y + c2y + c3y
  return `C ${ctrl1X},${ctrl1Y} ${ctrl2X},${ctrl2Y} ${endX},${endY}`
}

// Per-axis trait refiners delegate to the polynomial-level check on a single
// axis (over the unit interval) and brand only that axis. The combined
// refiners (below) fan out to both axes.
/** @internal */
export const isMonotonicX = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Monotonic, YT> => CubicPolynomial.isMonotonic(c.x, Interval.unit)

/** @internal */
export const isIncreasingX = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Increasing, YT> => CubicPolynomial.isIncreasing(c.x, Interval.unit)

/** @internal */
export const isDecreasingX = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Decreasing, YT> => CubicPolynomial.isDecreasing(c.x, Interval.unit)

/** @internal */
export const isMonotonicY = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT, YT & Monotonic> => CubicPolynomial.isMonotonic(c.y, Interval.unit)

/** @internal */
export const isIncreasingY = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT, YT & Increasing> => CubicPolynomial.isIncreasing(c.y, Interval.unit)

/** @internal */
export const isDecreasingY = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT, YT & Decreasing> => CubicPolynomial.isDecreasing(c.y, Interval.unit)

/** @internal */
export const isMonotonic = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Monotonic, YT & Monotonic> => isMonotonicX(c) && isMonotonicY(c)

/** @internal */
export const isIncreasing = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Increasing, YT & Increasing> => isIncreasingX(c) && isIncreasingY(c)

/** @internal */
export const isDecreasing = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): c is CubicCurve2d<XT & Decreasing, YT & Decreasing> => isDecreasingX(c) && isDecreasingY(c)

const fail = (m: string): never => {
  throw new Error(m)
}

/** @internal */
export const asMonotonic = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): CubicCurve2d<XT & Monotonic, YT & Monotonic> =>
  isMonotonic(c) ? c : fail('cubic curve is not monotonic in both axes')

/** @internal */
export const asIncreasing = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): CubicCurve2d<XT & Increasing, YT & Increasing> =>
  isIncreasing(c) ? c : fail('cubic curve is not increasing in both axes')

/** @internal */
export const asDecreasing = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): CubicCurve2d<XT & Decreasing, YT & Decreasing> =>
  isDecreasing(c) ? c : fail('cubic curve is not decreasing in both axes')

// Affine transform on coefficient form. p(t) = c0 + c1*t + c2*t^2 + c3*t^3, so
// f(p(t)) = (A*c0 + b) + (A*c1)*t + (A*c2)*t^2 + (A*c3)*t^3. Only the constant
// coefficient sees the translation; higher coefficients see only the linear
// part. This is exact in monomial form — no Bernstein round-trip.
/** @internal */
export const transform = dual<
  (a: Affine2d.Affine2d) => (c: CubicCurve2d) => CubicCurve2d,
  (c: CubicCurve2d, a: Affine2d.Affine2d) => CubicCurve2d
>(2, (c: CubicCurve2d, a: Affine2d.Affine2d) => {
  const m = a.matrix
  return new CubicCurve2dImpl(
    CubicPolynomial.make(
      m.m00 * c.x.c0 + m.m01 * c.y.c0 + m.m02,
      m.m00 * c.x.c1 + m.m01 * c.y.c1,
      m.m00 * c.x.c2 + m.m01 * c.y.c2,
      m.m00 * c.x.c3 + m.m01 * c.y.c3,
    ),
    CubicPolynomial.make(
      m.m10 * c.x.c0 + m.m11 * c.y.c0 + m.m12,
      m.m10 * c.x.c1 + m.m11 * c.y.c1,
      m.m10 * c.x.c2 + m.m11 * c.y.c2,
      m.m10 * c.x.c3 + m.m11 * c.y.c3,
    ),
  )
})

// Reverse the parameter direction: reflect each component polynomial about its
// domain midpoint (p(1 - u)). The geometric image is unchanged; start/end swap.
/** @internal */
export const reverse = <XT, YT>(
  c: CubicCurve2d<XT, YT>,
): CubicCurve2d<Reflected<XT>, Reflected<YT>> =>
  new CubicCurve2dImpl(
    CubicPolynomial.reflectDomain(c.x),
    CubicPolynomial.reflectDomain(c.y),
  ) as CubicCurve2d<Reflected<XT>, Reflected<YT>>

/**
 * The `Curve2dOps` bundle consumed by the generic `Path2d` implementation.
 * `solveAtX` / `solveAtY` narrow the curve's potentially-3-element result to
 * `AtMostOne` — path callers guarantee that via the path's
 * `MonotonicX`/`MonotonicY` brand.
 *
 * @internal
 */
export const Ops: Curve2dOps<CubicCurve2d> = {
  solve,
  startPoint,
  endPoint,
  length,
  boundingBox,
  solveAtX: (c, x) => solveAtX(c, x) as Solution.AtMostOne<number>,
  solveAtY: (c, y) => solveAtY(c, y) as Solution.AtMostOne<number>,
  toPathDataSegment,
  isIncreasingX,
  isDecreasingX,
  isIncreasingY,
  isDecreasingY,
  transform,
  reverse,
}
