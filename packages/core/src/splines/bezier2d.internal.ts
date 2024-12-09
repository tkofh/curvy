import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import { invariant } from '../util'
import * as Vector2 from '../vector/vector2'
import * as Vector4 from '../vector/vector4'
import type { Bezier2d } from './bezier2d'
import { toCurves, toPointQuads } from './util'

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

export const Bezier2dTypeId = Symbol('curvy/splines/bezier2d')
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

export const fromSpline = (
  p: Iterable<Vector2.Vector2>,
  matrix: Matrix4x4.Matrix4x4,
  stride: 1 | 2 | 3,
) => {
  const points: Array<Vector2.Vector2> = []

  let x: Vector4.Vector4 | undefined
  let y: Vector4.Vector4 | undefined

  for (const [p0, p1, p2, p3] of toPointQuads(p, stride)) {
    x = Matrix4x4.solveSystem(
      characteristic,
      Matrix4x4.vectorProductLeft(matrix, Vector4.make(p0.x, p1.x, p2.x, p3.x)),
    )

    y = Matrix4x4.solveSystem(
      characteristic,
      Matrix4x4.vectorProductLeft(matrix, Vector4.make(p0.y, p1.y, p2.y, p3.y)),
    )

    points.push(
      Vector2.make(x.x, y.x),
      Vector2.make(x.y, y.y),
      Vector2.make(x.z, y.z),
    )
  }

  if (x && y) {
    points.push(Vector2.make(x.w, y.w))
  }

  return fromArray(points)
}

export const appendTangentAligned = dual<
  (
    a: number,
    p5: Vector2.Vector2,
    p6: Vector2.Vector2,
  ) => (p: Bezier2d) => Bezier2d,
  (p: Bezier2d, a: number, p5: Vector2.Vector2, p6: Vector2.Vector2) => Bezier2d
>(4, (p: Bezier2d, a: number, p5: Vector2.Vector2, p6: Vector2.Vector2) => {
  const points = p instanceof Bezier2dImpl ? p.points : Array.from(p)
  const p2 = points[points.length - 2] as Vector2.Vector2
  const p3 = points[points.length - 1] as Vector2.Vector2
  const p4 = Vector2.make(p3.x + (p3.x - p2.x) * a, p3.y + (p3.y - p2.y) * a)

  return append(p, p4, p5, p6)
})

export const appendCurvatureAligned = dual(
  4,
  (p: Bezier2d, a: number, b: number, p6: Vector2.Vector2) => {
    const points = p instanceof Bezier2dImpl ? p.points : Array.from(p)
    const p1 = points[points.length - 3] as Vector2.Vector2
    const p2 = points[points.length - 2] as Vector2.Vector2
    const p3 = points[points.length - 1] as Vector2.Vector2

    const p4 = Vector2.make(p3.x + (p3.x - p2.x) * a, p3.y + (p3.y - p2.y) * a)
    const p5 = Vector2.make(
      p3.x + (p3.x - p2.x) * (2 * a + a ** 2 + b / 2) + (p1.x - p2.x) * a ** 2,
      p3.y + (p3.y - p2.y) * (2 * a + a ** 2 + b / 2) + (p1.y - p2.y) * a ** 2,
    )

    return append(p, p4, p5, p6)
  },
)

export const appendVelocityAligned = dual<
  (p5: Vector2.Vector2, p6: Vector2.Vector2) => (p: Bezier2d) => Bezier2d,
  (p: Bezier2d, p5: Vector2.Vector2, p6: Vector2.Vector2) => Bezier2d
>(3, (p: Bezier2d, p5: Vector2.Vector2, p6: Vector2.Vector2) =>
  appendTangentAligned(p, 1, p5, p6),
)

export const appendAccelerationAligned = dual<
  (p6: Vector2.Vector2) => (p: Bezier2d) => Bezier2d,
  (p: Bezier2d, p6: Vector2.Vector2) => Bezier2d
>(2, (p: Bezier2d, p6: Vector2.Vector2) => {
  const points = p instanceof Bezier2dImpl ? p.points : Array.from(p)
  const p1 = points[points.length - 3] as Vector2.Vector2
  const p2 = points[points.length - 2] as Vector2.Vector2
  const p3 = points[points.length - 1] as Vector2.Vector2

  const p4 = Vector2.make(2 * p3.x - p2.x, 2 * p3.y - p2.y)
  const p5 = Vector2.make(p1.x + 4 * (p3.x - p2.x), p1.y + 4 * (p3.y - p2.y))

  return append(p, p4, p5, p6)
})

export const toPath = (p: Bezier2d) =>
  CubicPath2d.fromCurves(...toCurves(p, characteristic, 3))
