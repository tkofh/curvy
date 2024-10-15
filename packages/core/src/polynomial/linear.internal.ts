import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, minMax, round } from '../util'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomial } from './linear'
import * as quadratic from './quadratic.internal'

const TypeBrand: unique symbol = Symbol.for('curvy/linear')
type TypeBrand = typeof TypeBrand

class LinearPolynomialImpl extends Pipeable implements LinearPolynomial {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly c0: number
  readonly c1: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)

    this.precision = precision
  }
}

export const isLinearPolynomial = (v: unknown): v is LinearPolynomial =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (c0 = 0, c1 = 0, precision = PRECISION): LinearPolynomial =>
  new LinearPolynomialImpl(c0, c1, precision)

export const fromVector = (v: Vector2, precision = PRECISION) =>
  new LinearPolynomialImpl(v.v0, v.v1, precision)

export const solve = dual<
  (x: number) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, x: number) => number
>(2, (p: LinearPolynomial, x: number) =>
  round(p.c0 + x * p.c1, Math.min(p.precision, x)),
)

export const toSolver = (p: LinearPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual(2, (p: LinearPolynomial, y: number) =>
  round(p.c1 === 0 ? 0 : (y - p.c0) / p.c1, Math.min(p.precision, y)),
)

export const toInverseSolver = (p: LinearPolynomial) => (y: number) =>
  solveInverse(p, y)

export const monotonicity = (p: LinearPolynomial) =>
  p.c1 === 0 ? 'constant' : p.c1 > 0 ? 'increasing' : 'decreasing'

export const root = dual(
  3,
  (
    p: LinearPolynomial,
    start = Number.NEGATIVE_INFINITY,
    end = Number.POSITIVE_INFINITY,
  ) => {
    const root = p.c1 === 0 ? null : round(-p.c0 / p.c1, p.precision)

    if (root === null || root < start || root > end) {
      return null
    }

    const [min, max] = minMax(start, end)

    return root >= min && root <= max ? root : null
  },
)

export const antiderivative = dual(
  2,
  (p: LinearPolynomial, integrationConstant: number) =>
    quadratic.make(integrationConstant, p.c0, p.c1 / 2),
)
