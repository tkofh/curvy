import * as CubicCurve2d from '../curve/cubic2d'
import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import * as CubicPolynomial from '../polynomial/cubic'
import { invariant } from '../util'
import * as Vector2 from '../vector/vector2'
import * as Vector4 from '../vector/vector4'
import type { Bezier2d } from './bezier2d'

export const characteristic = Matrix4x4.make(
  1,
  0,
  0,
  0,
  -3,
  3,
  0,
  0,
  3,
  -6,
  3,
  0,
  -1,
  3,
  -3,
  1,
)

export const Bezier2dTypeId = Symbol('curvy/splines/points')
export type Bezier2dTypeId = typeof Bezier2dTypeId

class Bezier2dImpl extends Pipeable implements Bezier2d {
  readonly [Bezier2dTypeId]: Bezier2dTypeId = Bezier2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 4, 'cubic splines requires 4 or more points')
    invariant(
      points.length % 3 === 1,
      'cubic splines requires (n * 3) + 1 points',
    )
    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isCubicBezier2d = (p: unknown): p is Bezier2d =>
  typeof p === 'object' && p !== null && Bezier2dTypeId in p

export const make = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
) => new Bezier2dImpl([p0, p1, p2, p3])

export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) =>
  new Bezier2dImpl(points)

export const append = dual<
  (
    p1: Vector2.Vector2,
    p2: Vector2.Vector2,
    p3: Vector2.Vector2,
  ) => (p: Bezier2d) => Bezier2d,
  (
    p: Bezier2d,
    p1: Vector2.Vector2,
    p2: Vector2.Vector2,
    p3: Vector2.Vector2,
  ) => Bezier2d
>(
  4,
  (
    p: Bezier2d,
    p1: Vector2.Vector2,
    p2: Vector2.Vector2,
    p3: Vector2.Vector2,
  ) =>
    new Bezier2dImpl(
      (p instanceof Bezier2dImpl ? p.points : Array.from(p)).concat(p1, p2, p3),
    ),
)

export const appendAligned = dual<
  (
    ratio: number,
    p5: Vector2.Vector2,
    p6: Vector2.Vector2,
  ) => (p: Bezier2d) => Bezier2d,
  (
    p: Bezier2d,
    ratio: number,
    p5: Vector2.Vector2,
    p6: Vector2.Vector2,
  ) => Bezier2d
>(4, (p: Bezier2d, ratio: number, p5: Vector2.Vector2, p6: Vector2.Vector2) => {
  const points = p instanceof Bezier2dImpl ? p.points : Array.from(p)
  const p2 = points[points.length - 2] as Vector2.Vector2
  const p3 = points[points.length - 1] as Vector2.Vector2
  const p4 = Vector2.make((1 + ratio) * p3.x - p2.x, (1 + ratio) * p3.y - p2.y)

  return append(p, p4, p5, p6)
})

export const appendMirrored = dual<
  (p5: Vector2.Vector2, p6: Vector2.Vector2) => (p: Bezier2d) => Bezier2d,
  (p: Bezier2d, p5: Vector2.Vector2, p6: Vector2.Vector2) => Bezier2d
>(3, (p: Bezier2d, p5: Vector2.Vector2, p6: Vector2.Vector2) =>
  appendAligned(p, 1, p5, p6),
)

function* toCurves(points: Iterable<Vector2.Vector2>) {
  let p0: Vector2.Vector2 | undefined
  let p1: Vector2.Vector2 | undefined
  let p2: Vector2.Vector2 | undefined
  let p3: Vector2.Vector2 | undefined

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
            characteristic,
            Vector4.make(p0.x, p1.x, p2.x, p3.x),
          ),
        ),
        CubicPolynomial.fromVector(
          Matrix4x4.vectorProductLeft(
            characteristic,
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

export const toPath = (p: Bezier2d) => CubicPath2d.fromCurves(...toCurves(p))
