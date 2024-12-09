import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import { invariant } from '../util'
import type * as Vector2 from '../vector/vector2'
import * as Bezier2d from './bezier2d'
import type { Hermite2d } from './hermite2d'
import { toCurves } from './util'

export const characteristic = Matrix4x4.make(
  1,
  0,
  0,
  0,
  0,
  1,
  0,
  0,
  -3,
  -2,
  3,
  -1,
  2,
  1,
  -2,
  1,
)

export const Hermite2dTypeId = Symbol('curvy/splines/hermite2d')
export type Hermite2dTypeId = typeof Hermite2dTypeId

class Hermite2dImpl extends Pipeable implements Hermite2d {
  readonly [Hermite2dTypeId]: Hermite2dTypeId = Hermite2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 4, 'hermite splines requires 4 or more points')
    invariant(
      points.length % 2 === 0,
      'hermite splines requires (n * 2) points',
    )

    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isHermite2d = (p: unknown): p is Hermite2d =>
  typeof p === 'object' && p !== null && Hermite2dTypeId in p

export const make = (
  p0: Vector2.Vector2,
  v0: Vector2.Vector2,
  p1: Vector2.Vector2,
  v1: Vector2.Vector2,
) => new Hermite2dImpl([p0, v0, p1, v1])

export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) =>
  new Hermite2dImpl(points)

export const append = dual<
  (p1: Vector2.Vector2, v1: Vector2.Vector2) => (p: Hermite2d) => Hermite2d,
  (p: Hermite2d, p1: Vector2.Vector2, v1: Vector2.Vector2) => Hermite2d
>(3, (p: Hermite2d, p1: Vector2.Vector2, v1: Vector2.Vector2) => {
  const points = p instanceof Hermite2dImpl ? p.points : Array.from(p)
  return new Hermite2dImpl(points.concat(p1, v1))
})

export const toPath = (p: Hermite2d) =>
  CubicPath2d.fromCurves(...toCurves(p, characteristic, 2))

export const toBezier = (p: Hermite2d) =>
  Bezier2d.fromSpline(p, characteristic, 2)
