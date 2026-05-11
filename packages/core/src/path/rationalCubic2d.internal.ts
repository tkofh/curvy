import * as RationalCubicCurve2d from '../curve/rationalCubic2d'
import { dual, Pipeable } from '../pipe'
import { invariant } from '../utils'
import type * as Vector2 from '../vector/vector2'
import type { RationalCubicPath2d } from './rationalCubic2d'

export const RationalCubicPath2dTypeId: unique symbol = Symbol('curvy/path/rationalCubic2d')
export type RationalCubicPath2dTypeId = typeof RationalCubicPath2dTypeId

export class RationalCubicPath2dImpl extends Pipeable implements RationalCubicPath2d {
  readonly [RationalCubicPath2dTypeId]: RationalCubicPath2dTypeId = RationalCubicPath2dTypeId

  readonly curves: ReadonlyArray<RationalCubicCurve2d.RationalCubicCurve2d>

  constructor(curves: ReadonlyArray<RationalCubicCurve2d.RationalCubicCurve2d>) {
    invariant(curves.length > 0, 'rational cubic path requires at least one curve')
    super()
    this.curves = curves
  }

  [Symbol.iterator](): Iterator<RationalCubicCurve2d.RationalCubicCurve2d> {
    return this.curves[Symbol.iterator]()
  }
}

export const isRationalCubicPath2d = (p: unknown): p is RationalCubicPath2d =>
  typeof p === 'object' && p !== null && RationalCubicPath2dTypeId in p

export const make = (
  ...curves: ReadonlyArray<RationalCubicCurve2d.RationalCubicCurve2d>
): RationalCubicPath2d => new RationalCubicPath2dImpl(curves)

export const fromArray = (
  curves: ReadonlyArray<RationalCubicCurve2d.RationalCubicCurve2d>,
): RationalCubicPath2d => new RationalCubicPath2dImpl(curves)

export const append = dual<
  (c: RationalCubicCurve2d.RationalCubicCurve2d) => (p: RationalCubicPath2d) => RationalCubicPath2d,
  (p: RationalCubicPath2d, c: RationalCubicCurve2d.RationalCubicCurve2d) => RationalCubicPath2d
>(2, (p, c) => fromArray([...p, c]))

export const solve = dual<
  (u: number) => (p: RationalCubicPath2d) => Vector2.Vector2,
  (p: RationalCubicPath2d, u: number) => Vector2.Vector2
>(2, (p: RationalCubicPath2d, u: number) => {
  const curves = p instanceof RationalCubicPath2dImpl ? p.curves : [...p]

  if (u === 1) {
    const last = curves.at(-1) as RationalCubicCurve2d.RationalCubicCurve2d
    return RationalCubicCurve2d.solve(last, 1)
  }

  const t = u * curves.length
  const i = Math.floor(t)
  const curve = curves[i] as RationalCubicCurve2d.RationalCubicCurve2d
  return RationalCubicCurve2d.solve(curve, t - i)
})
