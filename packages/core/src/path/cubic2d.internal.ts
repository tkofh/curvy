import * as CubicCurve2d from '../curve/cubic2d'
import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Interval from '../interval'
import { invariant, round } from '../util'
import type { Vector2 } from '../vector/vector2'
import type { CubicPath2d } from './cubic2d'

export const CubicPath2dTypeId: unique symbol = Symbol('curvy/path/cubic2d')
export type CubicPath2dTypeId = typeof CubicPath2dTypeId

export class CubicPath2dImpl extends Pipeable implements CubicPath2d {
  readonly [CubicPath2dTypeId]: CubicPath2dTypeId = CubicPath2dTypeId

  readonly curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>

  constructor(curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>) {
    invariant(curves.length > 0, 'cubic path requires at least one curve')
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<CubicCurve2d.CubicCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

export const isCubicPath2d = (p: unknown): p is CubicPath2d =>
  typeof p === 'object' && p !== null && CubicPath2dTypeId in p

export const fromCurves = (
  ...curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>
): CubicPath2d => new CubicPath2dImpl(curves)

export const fromCurveArray = (
  curves: ReadonlyArray<CubicCurve2d.CubicCurve2d>,
): CubicPath2d => new CubicPath2dImpl(curves)

export const append = dual<
  (c: CubicCurve2d.CubicCurve2d) => (p: CubicPath2d) => CubicPath2d,
  (p: CubicPath2d, c: CubicCurve2d.CubicCurve2d) => CubicPath2d
>(2, (p: CubicPath2d, c: CubicCurve2d.CubicCurve2d) =>
  fromCurveArray([...p, c]),
)

export const length = (p: CubicPath2d) => {
  let length = 0
  for (const curve of p) {
    length += CubicCurve2d.length(curve, Interval.unit)
  }

  return round(length)
}

export const solve = dual<
  (u: number) => (p: CubicPath2d) => Vector2,
  (p: CubicPath2d, u: number) => Vector2
>(2, (p: CubicPath2d, u: number) => {
  const curves = p instanceof CubicPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as CubicCurve2d.CubicCurve2d
    return CubicCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as CubicCurve2d.CubicCurve2d
  return CubicCurve2d.solve(curve, t - i)
})
