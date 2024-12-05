import * as CubicCurve2d from '../../../curve/cubic2d'
import { dual } from '../../../internal/function'
import { Pipeable } from '../../../internal/pipeable'
import * as Matrix4x4 from '../../../matrix/matrix4x4'
import * as CubicPath2d from '../../../path/cubic2d'
import * as CubicPolynomial from '../../../polynomial/cubic'
import { invariant } from '../../../util'
import type { Vector2 } from '../../../vector/vector2'
import * as Vector4 from '../../../vector/vector4'
import { bezier } from '../spline'
import type { CubicBezierPoints2d } from './cubic2d'

export const CubicBezierPoints2dTypeId = Symbol('curvy/splines/bezier/points')
export type CubicBezierPoints2dTypeId = typeof CubicBezierPoints2dTypeId

class CubicBezierPoints2dImpl extends Pipeable implements CubicBezierPoints2d {
  readonly [CubicBezierPoints2dTypeId]: CubicBezierPoints2dTypeId =
    CubicBezierPoints2dTypeId

  readonly points: ReadonlyArray<Vector2>

  constructor(points: ReadonlyArray<Vector2>) {
    invariant(points.length >= 4, 'cubic bezier requires 4 or more points')
    invariant(
      points.length % 3 === 1,
      'cubic bezier requires (n * 3) + 1 points',
    )
    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isCubicBezierPoints2d = (p: unknown): p is CubicBezierPoints2d =>
  typeof p === 'object' && p !== null && CubicBezierPoints2dTypeId in p

export const make = (p0: Vector2, p1: Vector2, p2: Vector2, p3: Vector2) =>
  new CubicBezierPoints2dImpl([p0, p1, p2, p3])

export const fromArray = (points: ReadonlyArray<Vector2>) =>
  new CubicBezierPoints2dImpl(points)

export const append = dual<
  (
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
  ) => (p: CubicBezierPoints2d) => CubicBezierPoints2d,
  (
    p: CubicBezierPoints2d,
    p1: Vector2,
    p2: Vector2,
    p3: Vector2,
  ) => CubicBezierPoints2d
>(
  4,
  (p: CubicBezierPoints2d, p1: Vector2, p2: Vector2, p3: Vector2) =>
    new CubicBezierPoints2dImpl(
      (p instanceof CubicBezierPoints2dImpl ? p.points : Array.from(p)).concat(
        p1,
        p2,
        p3,
      ),
    ),
)

function* toCurves(points: Iterable<Vector2>) {
  let p0: Vector2 | undefined
  let p1: Vector2 | undefined
  let p2: Vector2 | undefined
  let p3: Vector2 | undefined

  for (const point of points) {
    if (p0 === undefined) {
      p0 = point
    } else if (p1 === undefined) {
      p1 = point
    } else if (p2 === undefined) {
      p2 = point
    } else if (p3 === undefined) {
      p3 = point

      yield CubicCurve2d.fromPolynomials(
        CubicPolynomial.fromVector(
          Matrix4x4.vectorProductLeft(
            bezier,
            Vector4.make(p0.x, p1.x, p2.x, p3.x),
          ),
        ),
        CubicPolynomial.fromVector(
          Matrix4x4.vectorProductLeft(
            bezier,
            Vector4.make(p0.y, p1.y, p2.y, p3.y),
          ),
        ),
      )

      p0 = p3
      p1 = undefined
      p2 = undefined
      p3 = undefined
    }
  }
}

export const toPath = (p: CubicBezierPoints2d) =>
  CubicPath2d.fromCurves(...toCurves(p))
