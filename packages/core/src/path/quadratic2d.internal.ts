import * as QuadraticCurve2d from '../curve/quadratic2d'
import * as Interval from '../interval'
import { dual, Pipeable } from '../pipe'
import { epsEquals } from '../utils'
import type { Vector2 } from '../vector/vector2'
import type { QuadraticPath2d } from './quadratic2d'

export const QuadraticPath2dTypeId: unique symbol = Symbol('curvy/path/quadratic2d')
export type QuadraticPath2dTypeId = typeof QuadraticPath2dTypeId

export class QuadraticPath2dImpl extends Pipeable implements QuadraticPath2d {
  readonly [QuadraticPath2dTypeId]: QuadraticPath2dTypeId = QuadraticPath2dTypeId

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

export const make = (
  ...curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

export const fromArray = (
  curves: ReadonlyArray<QuadraticCurve2d.QuadraticCurve2d>,
): QuadraticPath2d => new QuadraticPath2dImpl(curves)

export const append = dual<
  (c: QuadraticCurve2d.QuadraticCurve2d) => (p: QuadraticPath2d) => QuadraticPath2d,
  (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) => QuadraticPath2d
>(2, (p: QuadraticPath2d, c: QuadraticCurve2d.QuadraticCurve2d) => fromArray([...p, c]))

export const length = (p: QuadraticPath2d) => {
  let total = 0
  for (const curve of p) {
    total += QuadraticCurve2d.length(curve, Interval.unit)
  }

  return total
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

// Quadratic Bernstein basis: P(t) = (1-t)²·p0 + 2(1-t)t·p1 + t²·p2
// expanded gives c0 = p0, c1 = -2p0 + 2p1, c2 = p0 - 2p1 + p2, so:
//   p0 = c0, p1 = c0 + c1/2, p2 = c0 + c1 + c2.
export const toPathData = (p: QuadraticPath2d): string => {
  let result = ''
  let prevEndX = Number.NaN
  let prevEndY = Number.NaN

  for (const curve of p) {
    const c0x = curve.x.c0
    const c0y = curve.y.c0
    const c1x = curve.x.c1
    const c1y = curve.y.c1
    const c2x = curve.x.c2
    const c2y = curve.y.c2

    const startX = c0x
    const startY = c0y
    const ctrlX = c0x + c1x / 2
    const ctrlY = c0y + c1y / 2
    const endX = c0x + c1x + c2x
    const endY = c0y + c1y + c2y

    if (!epsEquals(startX, prevEndX) || !epsEquals(startY, prevEndY)) {
      result += ` M ${startX},${startY}`
    }
    result += ` Q ${ctrlX},${ctrlY} ${endX},${endY}`

    prevEndX = endX
    prevEndY = endY
  }

  return result.slice(1)
}
