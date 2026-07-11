import * as Interval from '../interval/interval.ts'
import { dual } from '../utils.ts'
import * as Solution from '../solution/solution.ts'
import { invariant } from '../utils.ts'
import { clampToZero, coincident, RELATIVE_TOLERANCE } from '../number.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Vector3 } from '../vector/vector3.ts'
import type { CubicPolynomial } from './cubic.ts'
import { CubicPolynomialImpl } from './cubic.internal.circular.ts'
import * as Linear from './linear.internal.ts'
import * as Monotonicity from '../monotonicity/monotonicity.ts'
import type { QuadraticPolynomial } from './quadratic.ts'
import {
  QuadraticPolynomialImpl,
  QuadraticPolynomialTypeId,
} from './quadratic.internal.circular.ts'
import type { Decreasing, Increasing, Monotonic } from './traits.ts'

/** @internal */
export const fromPoints = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
): QuadraticPolynomial => {
  // Newton's divided differences, then collected to monomial form.
  const f01 = (p1.y - p0.y) / (p1.x - p0.x)
  const f12 = (p2.y - p1.y) / (p2.x - p1.x)
  const f012 = (f12 - f01) / (p2.x - p0.x)

  return new QuadraticPolynomialImpl(
    p0.y - f01 * p0.x + f012 * p0.x * p1.x,
    f01 - f012 * (p0.x + p1.x),
    f012,
  )
}

/** @internal */
export const make = (c0 = 0, c1 = 0, c2 = 0): QuadraticPolynomial =>
  new QuadraticPolynomialImpl(c0, c1, c2)

/** @internal */
export const isQuadraticPolynomial = (v: unknown): v is QuadraticPolynomial =>
  typeof v === 'object' && v !== null && QuadraticPolynomialTypeId in v

/** @internal */
export const equals = dual<
  (b: QuadraticPolynomial) => (a: QuadraticPolynomial) => boolean,
  (a: QuadraticPolynomial, b: QuadraticPolynomial) => boolean
>(
  2,
  (a: QuadraticPolynomial, b: QuadraticPolynomial) =>
    coincident(a.c0, b.c0) && coincident(a.c1, b.c1) && coincident(a.c2, b.c2),
)

/** @internal */
export const fromVector = (v: Vector3) => new QuadraticPolynomialImpl(v.x, v.y, v.z)

/** @internal */
export const solve = dual<
  (x: number) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, x: number) => number
>(2, (p: QuadraticPolynomial, x: number) => p.c0 + x * p.c1 + x ** 2 * p.c2)

/** @internal */
export const toSolver = (p: QuadraticPolynomial) => (x: number) => solve(p, x)

/** @internal */
export const solveInverse: {
  (p: QuadraticPolynomial, y: number): Solution.AtMostTwo<number>
  (y: number): (p: QuadraticPolynomial) => Solution.AtMostTwo<number>
} = dual<
  (y: number) => (p: QuadraticPolynomial) => Solution.AtMostTwo<number>,
  (p: QuadraticPolynomial, y: number) => Solution.AtMostTwo<number>
>(2, (p: QuadraticPolynomial, y: number) => {
  // c2 = 0: the polynomial is actually linear in disguise. Defer rather than
  // dividing by zero in the quadratic formula.
  if (p.c2 === 0) {
    return Linear.solveInverse(Linear.make(p.c0, p.c1), y)
  }

  const c = p.c0 - y

  // The discriminant is a cancellation between two computed terms, so its
  // sign near zero is noise. Clamp within a band relative to the terms'
  // magnitudes: a tangency query that under- or overshoots by an ulp then
  // reports its double root instead of none / two spurious near-twins.
  const b2 = p.c1 ** 2
  const ac4 = 4 * p.c2 * c
  const discriminant = clampToZero(b2 - ac4, RELATIVE_TOLERANCE * Math.max(b2, Math.abs(ac4)))

  if (discriminant < 0) {
    return Solution.none
  }

  if (discriminant === 0) {
    return Solution.one(-p.c1 / (2 * p.c2))
  }

  // Stable form: `-c1` and `+/-sqrt(discriminant)` have opposite signs for one of
  // the two roots, and that subtraction cancels catastrophically when
  // c1^2 >> |c2*c|. Compute the larger-magnitude root with matching signs
  // (no cancellation), then recover the other from the root product
  // a*b = c/c2 (Vieta), which only multiplies and divides.
  const q = -0.5 * (p.c1 + (p.c1 < 0 ? -1 : 1) * Math.sqrt(discriminant))
  const a = q / p.c2
  const b = c / q
  return a < b ? Solution.two(a, b) : Solution.two(b, a)
})

/** @internal */
export const toInverseSolver =
  (p: QuadraticPolynomial) =>
  (y: number): Solution.AtMostTwo<number> =>
    solveInverse(p, y)

/** @internal */
export const coefficients = (p: QuadraticPolynomial): readonly [number, number, number] => [
  p.c0,
  p.c1,
  p.c2,
]

/** @internal */
export const derivative = (p: QuadraticPolynomial) => Linear.make(p.c1, p.c2 * 2)

/** @internal */
export const roots = (p: QuadraticPolynomial) => solveInverse(p, 0)

/** @internal */
export const extreme = (p: QuadraticPolynomial) =>
  derivative(p).pipe(
    Linear.solveInverse(0),
    Solution.match({
      onNone: () => null,
      onSome: ({ value: t }) => Vector2.make(t, solve(p, t)),
    }),
  )

/** @internal */
export const monotonicity = dual<
  (i: Interval.Interval) => (p: QuadraticPolynomial) => Monotonicity.Monotonicity,
  (p: QuadraticPolynomial, i?: Interval.Interval) => Monotonicity.Monotonicity
>(
  (args) => isQuadraticPolynomial(args[0]),
  (p: QuadraticPolynomial, i?: Interval.Interval) => {
    invariant(
      i === undefined || Interval.size(i) > 0,
      'monotonicity is undefined over a zero-width interval',
    )

    if (p.c2 === 0 && p.c1 === 0) {
      return Monotonicity.Constant
    }

    if (p.c2 === 0) {
      return Linear.monotonicity(Linear.make(p.c0, p.c1))
    }

    // c2 is non-zero, so over the whole real line the parabola always turns
    if (i === undefined) {
      return Monotonicity.None
    }

    // The derivative of a quadratic is linear, so its exact range over the
    // interval is its two endpoint values. Judge sign coverage by value
    // rather than by the location of the derivative's root — see the cubic
    // classifier for the rationale.
    const d = derivative(p)
    const dStart = Linear.solve(d, i.start)
    const dEnd = Linear.solve(d, i.end)

    return Monotonicity.fromDerivativeRange(Math.min(dStart, dEnd), Math.max(dStart, dEnd))
  },
)

/** @internal */
export const isMonotonic = dual<
  (
    i: Interval.Interval,
  ) => <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Monotonic>,
  <T>(p: QuadraticPolynomial<T>, i?: Interval.Interval) => p is QuadraticPolynomial<T & Monotonic>
>((args) => isQuadraticPolynomial(args[0]), ((p: QuadraticPolynomial, i?: Interval.Interval) =>
  Monotonicity.isStrict(monotonicity(p, i as Interval.Interval))) as never)

/** @internal */
export const isIncreasing = dual<
  (
    i: Interval.Interval,
  ) => <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Increasing>,
  <T>(p: QuadraticPolynomial<T>, i?: Interval.Interval) => p is QuadraticPolynomial<T & Increasing>
>(
  (args) => isQuadraticPolynomial(args[0]),
  ((p: QuadraticPolynomial, i?: Interval.Interval) =>
    monotonicity(p, i as Interval.Interval) === Monotonicity.Increasing) as never,
)

/** @internal */
export const isDecreasing = dual<
  (
    i: Interval.Interval,
  ) => <T>(p: QuadraticPolynomial<T>) => p is QuadraticPolynomial<T & Decreasing>,
  <T>(p: QuadraticPolynomial<T>, i?: Interval.Interval) => p is QuadraticPolynomial<T & Decreasing>
>(
  (args) => isQuadraticPolynomial(args[0]),
  ((p: QuadraticPolynomial, i?: Interval.Interval) =>
    monotonicity(p, i as Interval.Interval) === Monotonicity.Decreasing) as never,
)

/** @internal */
export const asMonotonic = <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval.Interval,
): QuadraticPolynomial<T & Monotonic> => {
  invariant(isMonotonic(p, i as Interval.Interval), 'quadratic polynomial is not monotonic')
  return p
}

/** @internal */
export const asIncreasing = <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval.Interval,
): QuadraticPolynomial<T & Increasing> => {
  invariant(isIncreasing(p, i as Interval.Interval), 'quadratic polynomial is not increasing')
  return p
}

/** @internal */
export const asDecreasing = <T>(
  p: QuadraticPolynomial<T>,
  i?: Interval.Interval,
): QuadraticPolynomial<T & Decreasing> => {
  invariant(isDecreasing(p, i as Interval.Interval), 'quadratic polynomial is not decreasing')
  return p
}

/** @internal */
export const antiderivative = dual<
  (integrationConstant: number) => (p: QuadraticPolynomial) => CubicPolynomial,
  (p: QuadraticPolynomial, integrationConstant?: number) => CubicPolynomial
>(
  2,
  (p: QuadraticPolynomial, integrationConstant = 0) =>
    new CubicPolynomialImpl(integrationConstant, p.c0, p.c1 / 2, p.c2 / 3),
)

/** @internal */
export const domain = dual<
  (range: Interval.Interval) => (p: QuadraticPolynomial) => Solution.AtMostOne<Interval.Interval>,
  (p: QuadraticPolynomial, range: Interval.Interval) => Solution.AtMostOne<Interval.Interval>
>(2, (p: QuadraticPolynomial, r: Interval.Interval) => {
  const start = solveInverse(p, r.start)
  const end = solveInverse(p, r.end)

  if (start.length === 0 && end.length === 0) {
    return Solution.none
  }

  return Solution.one(Interval.fromMinMax(...start, ...end))
})

/** @internal */
export const range = dual<
  (domain: Interval.Interval) => (p: QuadraticPolynomial) => Interval.Closed,
  (p: QuadraticPolynomial, domain: Interval.Interval) => Interval.Closed
>(2, (p: QuadraticPolynomial, d: Interval.Interval) => {
  if (p.c2 === 0) {
    return Linear.range(Linear.make(p.c0, p.c1), d)
  }

  const e = extreme(p)

  return e !== null && Interval.contains(d, e.x)
    ? Interval.fromMinMax(solve(p, d.start), solve(p, d.end), e.y)
    : Interval.fromMinMax(solve(p, d.start), solve(p, d.end))
})

/** @internal */
export const unitRange = (p: QuadraticPolynomial): Interval.Closed => range(p, Interval.unit)

/** @internal */
export const length = dual<
  (domain: Interval.Interval) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, domain: Interval.Interval) => number
>(2, (p: QuadraticPolynomial, dom: Interval.Interval) => {
  if (Interval.size(dom) === 0) {
    return 0
  }

  if (p.c2 === 0) {
    return Linear.length(Linear.make(p.c0, p.c1), dom)
  }

  const dp = derivative(p)

  const derivativeStart = Linear.solve(dp, dom.start)
  const sqrtStart = Math.sqrt(1 + derivativeStart ** 2)
  const evalStart =
    (derivativeStart * sqrtStart + Math.log(Math.abs(derivativeStart + sqrtStart))) / (4 * p.c2)

  const derivativeEnd = Linear.solve(dp, dom.end)
  const sqrtEnd = Math.sqrt(1 + derivativeEnd ** 2)
  const evalEnd =
    (derivativeEnd * sqrtEnd + Math.log(Math.abs(derivativeEnd + sqrtEnd))) / (4 * p.c2)

  return evalEnd - evalStart
})

/** @internal */
export const curvature = dual<
  (x: number) => (p: QuadraticPolynomial) => number,
  (p: QuadraticPolynomial, x: number) => number
>(
  2,
  (p: QuadraticPolynomial, x: number) =>
    Math.abs(2 * p.c2) / (1 + (Linear.solve(derivative(p), x) ** 2) ** 1.5),
)
