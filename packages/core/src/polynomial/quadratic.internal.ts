import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import * as interval from '../interval.internal'
import { PRECISION, round } from '../util'
import type { Vector3 } from '../vector/vector3'
import * as linear from './linear.internal'
import type { QuadraticPolynomial } from './quadratic'

const TypeBrand: unique symbol = Symbol.for('curvy/quadratic')
type TypeBrand = typeof TypeBrand

class QuadraticPolynomialImpl extends Pipeable implements QuadraticPolynomial {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly c0: number
  readonly c1: number
  readonly c2: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, c2 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)
    this.c2 = round(c2, precision)

    this.precision = precision
  }
}

export const isQuadraticPolynomial = (v: unknown): v is QuadraticPolynomial =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (
  c0 = 0,
  c1 = 0,
  c2 = 0,
  precision = PRECISION,
): QuadraticPolynomial => new QuadraticPolynomialImpl(c0, c1, c2, precision)

export const fromVector = (v: Vector3, precision = PRECISION) =>
  new QuadraticPolynomialImpl(v.v0, v.v1, v.v2, precision)

export const solve = dual(2, (p: QuadraticPolynomial, x: number) =>
  round(p.c0 + x * p.c1 + x ** 2 * p.c2, Math.min(p.precision, x)),
)

export const toSolver = (p: QuadraticPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual(
  2 as never,
  (p: QuadraticPolynomial, y: number) => {
    const discriminant = p.c1 ** 2 - 4 * p.c2 * (p.c0 - y)

    if (discriminant < 0) {
      return [] as readonly [] | readonly [number] | readonly [number, number]
    }

    if (discriminant === 0) {
      return [round(-p.c1 / (2 * p.c2), p.precision)] as
        | readonly []
        | readonly [number]
        | readonly [number, number]
    }

    const sqrtDiscriminant = Math.sqrt(discriminant)

    return [
      round((-p.c1 + sqrtDiscriminant) / (2 * p.c2), p.precision),
      round((-p.c1 - sqrtDiscriminant) / (2 * p.c2), p.precision),
    ].toSorted((a, b) => a - b) as unknown as
      | readonly []
      | readonly [number]
      | readonly [number, number]
  },
)

export const toInverseSolver =
  (p: QuadraticPolynomial) =>
  (y: number): readonly [] | readonly [number] | readonly [number, number] =>
    solveInverse(p, y)

export const derivative = (p: QuadraticPolynomial) =>
  linear.make(3 * p.c2, 2 * p.c1, p.precision)

export const roots = (p: QuadraticPolynomial) => solveInverse(p, 0)

export const extreme = (p: QuadraticPolynomial) =>
  derivative(p).pipe(linear.root) ?? (p.c2 === 0 ? null : 0)

export const monotonicity = dual(
  (args) => isQuadraticPolynomial(args[0]),
  (p: QuadraticPolynomial, i: Interval = interval.unit) => {
    if (p.c1 === 0 && p.c2 === 0) {
      return 'constant'
    }

    const min = interval.min(i)
    const max = interval.max(i)

    const d = derivative(p)

    const root = d.pipe(linear.root)

    if (root === null || root === min || root === max) {
      const sign =
        root === min
          ? Math.sign(linear.solve(d, max))
          : Math.sign(linear.solve(d, min))

      if (sign === 0) {
        return 'constant'
      }
      return sign > 0 ? 'increasing' : 'decreasing'
    }

    return 'none'
  },
)

export const antiderivative = dual(
  2,
  (p: QuadraticPolynomial, integrationConstant: number) => [
    integrationConstant,
    p.c0,
    p.c1 / 2,
    p.c2 / 3,
  ],
)
