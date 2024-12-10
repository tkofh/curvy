import * as LinearCurve2d from '../curve/linear2d'
import * as Interval from '../interval'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { LinearPath2d } from './linear2d'

export const LinearPath2dTypeId: unique symbol = Symbol('curvy/path/linear2d')
export type LinearPath2dTypeId = typeof LinearPath2dTypeId

export class LinearPath2dImpl extends Pipeable implements LinearPath2d {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId = LinearPath2dTypeId

  readonly curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>

  constructor(curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>) {
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<LinearCurve2d.LinearCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

export const isLinearPath2d = (p: unknown): p is LinearPath2d =>
  typeof p === 'object' && p !== null && LinearPath2dTypeId in p

export const fromCurves = (
  ...curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>
): LinearPath2d => new LinearPath2dImpl(curves)

export const fromCurveArray = (
  curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>,
) => new LinearPath2dImpl(curves)

export const append = dual<
  (c: LinearCurve2d.LinearCurve2d) => (p: LinearPath2d) => LinearPath2d,
  (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) => LinearPath2d
>(2, (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) =>
  fromCurveArray([...p, c]),
)

export const length = (p: LinearPath2d) => {
  let length = 0
  for (const curve of p) {
    length += LinearCurve2d.length(curve, Interval.unit)
  }

  return round(length)
}

export const solve = dual<
  (u: number) => (p: LinearPath2d) => Vector2,
  (p: LinearPath2d, u: number) => Vector2
>(2, (p: LinearPath2d, u: number) => {
  const curves = p instanceof LinearPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as LinearCurve2d.LinearCurve2d
    return LinearCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as LinearCurve2d.LinearCurve2d
  return LinearCurve2d.solve(curve, t - i)
})
