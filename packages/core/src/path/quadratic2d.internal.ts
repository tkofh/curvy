import * as QuadraticCurve2d from '../curve/quadratic2d'
import * as Interval from '../interval'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { QuadraticPath2d } from './quadratic2d'

export const QuadraticPath2dTypeId: unique symbol = Symbol(
  'curvy/path/quadratic2d',
)
export type QuadraticPath2dTypeId = typeof QuadraticPath2dTypeId

export class QuadraticPath2dImpl extends Pipeable implements QuadraticPath2d {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId =
    QuadraticPath2dTypeId

  readonly curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>

  constructor(curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>) {
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<QuadraticCurve2d.QuadraticCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

export const isQuadraticPath2d = (p: unknown): p is QuadraticPath2d =>
  typeof p === 'object' && p !== null && QuadraticPath2dTypeId in p

export const fromCurves = (
  ...curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

export const fromCurveArray = (
  curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>,
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

export const append = dual<
  (
    c: QuadraticCurve2d.QuadraticCurve2d,
  ) => (p: QuadraticPath2d) => QuadraticPath2d,
  (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) => QuadraticPath2d
>(2, (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) =>
  fromCurveArray([...p, c]),
)

export const length = (p: QuadraticPath2d) => {
  let length = 0
  for (const curve of p) {
    length += QuadraticCurve2d.length(curve, Interval.unit)
  }

  return round(length)
}

export const solve = dual<
  (u: number) => (p: QuadraticPath2d) => Vector2,
  (p: QuadraticPath2d, u: number) => Vector2
>(2, (p: QuadraticPath2d, u: number) => {
  const curves = p instanceof QuadraticPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as QuadraticCurve2d.QuadraticCurve2d
    return QuadraticCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as QuadraticCurve2d.QuadraticCurve2d
  return QuadraticCurve2d.solve(curve, t - i)
})
