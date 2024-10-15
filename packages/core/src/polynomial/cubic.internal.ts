import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import type { Interval } from '../interval'
import * as interval from '../interval.internal'
import { PRECISION, round } from '../util'
import type { Vector4 } from '../vector/vector4'
import type { CubicPolynomial } from './cubic'
import * as quadratic from './quadratic.internal'

const TypeBrand: unique symbol = Symbol.for('curvy/cubic')
type TypeBrand = typeof TypeBrand

class CubicPolynomialImpl extends Pipeable implements CubicPolynomial {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly c0: number
  readonly c1: number
  readonly c2: number
  readonly c3: number

  readonly precision: number

  constructor(c0 = 0, c1 = 0, c2 = 0, c3 = 0, precision = PRECISION) {
    super()

    this.c0 = round(c0, precision)
    this.c1 = round(c1, precision)
    this.c2 = round(c2, precision)
    this.c3 = round(c3, precision)

    this.precision = precision
  }
}

export const isCubicPolynomial = (v: unknown): v is CubicPolynomial =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (
  c0 = 0,
  c1 = 0,
  c2 = 0,
  c3 = 0,
  precision = PRECISION,
): CubicPolynomial => new CubicPolynomialImpl(c0, c1, c2, c3, precision)

export const fromVector = (v: Vector4, precision = PRECISION) =>
  new CubicPolynomialImpl(v.v0, v.v1, v.v2, v.v3, precision)

export const solve = dual(2, (p: CubicPolynomial, x: number) =>
  round(p.c0 + x * p.c1 + x ** 2 * p.c2 + x ** 3 * p.c3, p.precision),
)

export const toSolver = (p: CubicPolynomial) => (x: number) => solve(p, x)

export const solveInverse = dual(2, (p: CubicPolynomial, y: number) => {
  const a2 = p.c2 / p.c3
  const a2OverThree = a2 / 3

  const q = p.c1 / p.c3 / 3 - a2 ** 2 / 9
  const r0 = ((p.c1 / p.c3) * a2) / 6 - a2 ** 3 / 27

  const r = r0 - ((p.c0 - y) / p.c3) * 0.5

  const discriminant = q ** 3 + r ** 2

  if (discriminant > 0) {
    const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))

    return [
      round((r < 0 ? q / a - a : a - q / a) - a2OverThree, p.precision),
    ] as
      | readonly []
      | readonly [number]
      | readonly [number, number]
      | readonly [number, number, number]
  }

  const theta = Math.acos(r / Math.sqrt((-q) ** 3)) / 3
  const twoRootQ = 2 * Math.sqrt(-q)

  const root1 = round(
    twoRootQ * Math.cos(theta - Math.PI / 3) - a2OverThree,
    p.precision,
  )
  const root2 = round(twoRootQ * Math.cos(theta) - a2OverThree, p.precision)
  const root3 = round(
    twoRootQ * Math.cos(theta + Math.PI / 3) - a2OverThree,
    p.precision,
  )

  const roots = [root1]

  if (root2 !== root1) {
    roots.push(root2)
  }

  if (root3 !== root2 && root3 !== root1) {
    roots.push(root3)
  }

  return roots.toSorted((a, b) => a - b) as unknown as
    | readonly []
    | readonly [number]
    | readonly [number, number]
    | readonly [number, number, number]
})

export const toInverseSolver = (p: CubicPolynomial) => (y: number) =>
  solveInverse(p, y)

export const derivative = (p: CubicPolynomial) =>
  quadratic.make(3 * p.c3, 2 * p.c2, p.c1, p.precision)

export const roots = (
  p: CubicPolynomial,
):
  | readonly []
  | readonly [number]
  | readonly [number, number]
  | readonly [number, number, number] => solveInverse(p, 0)

export const extrema = (
  p: CubicPolynomial,
): readonly [] | readonly [number] | readonly [number, number] =>
  quadratic.roots(derivative(p))

export const monotonicity = dual(
  (args) => isCubicPolynomial(args[0]),
  (p: CubicPolynomial, i: Interval = interval.unit) => {
    if (p.c1 === 0 && p.c2 === 0 && p.c3 === 0) {
      return 'constant'
    }

    const min = interval.min(i)
    const max = interval.max(i)

    const d = derivative(p)

    const root = quadratic.roots(d)

    if (root === null || root === min || root === max) {
      const sign =
        root === min
          ? Math.sign(quadratic.solve(d, max))
          : Math.sign(quadratic.solve(d, min))

      if (sign === 0) {
        return 'constant'
      }
      return sign > 0 ? 'increasing' : 'decreasing'
    }

    return 'none'
  },
)
