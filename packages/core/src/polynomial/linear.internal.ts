import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { Vector2 } from '../vector/vector2'
import type { LinearPolynomial } from './linear'
import { QuadraticPolynomialImpl } from './quadratic.internal.circular'
import type { ZeroOrOneSolution } from './types'

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

export const fromVector = (v: Vector2, precision?: number) =>
  new LinearPolynomialImpl(v.v0, v.v1, precision ?? v.precision)

export const solve = dual<
  (x: number) => (p: LinearPolynomial) => number,
  (p: LinearPolynomial, x: number) => number
>(2, (p: LinearPolynomial, x: number) =>
  round(p.c0 + x * p.c1, Math.min(p.precision, x)),
)

export const toSolver = (p: LinearPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual<
  (y: number) => (p: LinearPolynomial) => ZeroOrOneSolution,
  (p: LinearPolynomial, y: number) => ZeroOrOneSolution
>(2, (p: LinearPolynomial, y: number) => {
  if (p.c1 === 0) {
    return null
  }
  return round((y - p.c0) / p.c1, p.precision)
})

export const toInverseSolver = (p: LinearPolynomial) => (y: number) =>
  solveInverse(p, y)

export const monotonicity = (p: LinearPolynomial) =>
  p.c1 === 0 ? 'constant' : p.c1 > 0 ? 'increasing' : 'decreasing'

export const antiderivative = dual(
  (args) => isLinearPolynomial(args[0]),
  (p: LinearPolynomial, integrationConstant = 0) =>
    new QuadraticPolynomialImpl(
      integrationConstant,
      p.c0,
      p.c1 / 2,
      p.precision,
    ),
)
