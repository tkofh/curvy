import * as LinearCurve2d from '../curve/linear2d'
import * as Interval from '../interval/interval'
import { dual, Pipeable } from '../utils'
import { invariant } from '../utils'
import { epsEquals } from '../number'
import type { Vector2 } from '../vector/vector2'
import type { LinearPath2d } from './linear2d'
import { PathTraits, type Continuous } from './traits'

export const LinearPath2dTypeId: unique symbol = Symbol('curvy/path/linear2d')
export type LinearPath2dTypeId = typeof LinearPath2dTypeId

export class LinearPath2dImpl extends Pipeable implements LinearPath2d<unknown> {
  readonly [LinearPath2dTypeId]: LinearPath2dTypeId = LinearPath2dTypeId
  declare readonly [PathTraits]: unknown

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

export const make = (...curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>): LinearPath2d =>
  new LinearPath2dImpl(curves)

export const fromArray = (curves: ReadonlyArray<LinearCurve2d.LinearCurve2d>) =>
  new LinearPath2dImpl(curves)

export const append = dual<
  (c: LinearCurve2d.LinearCurve2d) => (p: LinearPath2d) => LinearPath2d,
  (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) => LinearPath2d
>(2, (p: LinearPath2d, c: LinearCurve2d.LinearCurve2d) => fromArray([...p, c]))

export const length = (p: LinearPath2d) => {
  let total = 0
  for (const curve of p) {
    total += LinearCurve2d.length(curve, Interval.unit)
  }

  return total
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

export const toPathData = (p: LinearPath2d): string => {
  let result = ''
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    const endX = curve.x.c0 + curve.x.c1
    const endY = curve.y.c0 + curve.y.c1

    if (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY)) {
      result += ` M ${startX},${startY}`
    }
    result += ` L ${endX},${endY}`

    prevEndX = endX
    prevEndY = endY
  }

  return result.slice(1)
}

export const isContinuous = <T>(p: LinearPath2d<T>): p is LinearPath2d<T & Continuous> => {
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN
  let first = true

  for (const curve of p) {
    const startX = curve.x.c0
    const startY = curve.y.c0
    if (!first && (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY))) {
      return false
    }
    prevEndX = curve.x.c0 + curve.x.c1
    prevEndY = curve.y.c0 + curve.y.c1
    first = false
  }
  return true
}

export const asContinuous = <T>(p: LinearPath2d<T>): LinearPath2d<T & Continuous> => {
  invariant(isContinuous(p), 'linear path is not continuous')
  return p
}
