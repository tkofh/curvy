import * as Characteristic from '../characteristic/characteristic'
import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import { dual, Pipeable } from '../utils'
import * as Solution from '../solution/solution'
import { invariant } from '../utils'
import * as Vector2 from '../vector/vector2'
import * as Vector4 from '../vector/vector4'
import type { Bezier2d } from './bezier2d'
import type { RationalBezier2d } from './rationalBezier2d'
import * as RationalBezier2dInternal from './rationalBezier2d.internal'
import { toCurves, toPointQuads } from './util'

const characteristicInverse = Matrix4x4.inverse(Characteristic.cubicBezier)

// Maps a source spline's characteristic matrix to its precomputed conversion
// matrix `M_bezier_inverse · M_source`, so each `fromBasis` call is one
// matrix-vector product per axis instead of running Cramer's rule per quad.
const conversionCache = new WeakMap<Matrix4x4.Matrix4x4, Matrix4x4.Matrix4x4>()

const getConversionMatrix = (source: Matrix4x4.Matrix4x4): Matrix4x4.Matrix4x4 => {
  let combined = conversionCache.get(source)
  if (combined === undefined) {
    combined = Matrix4x4.multiply(characteristicInverse, source)
    conversionCache.set(source, combined)
  }
  return combined
}

export const Bezier2dTypeId = Symbol('curvy/splines/bezier2d')
export type Bezier2dTypeId = typeof Bezier2dTypeId

class Bezier2dImpl extends Pipeable implements Bezier2d {
  readonly [Bezier2dTypeId]: Bezier2dTypeId = Bezier2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 4, 'cubic splines requires 4 or more points')
    invariant(points.length % 3 === 1, 'cubic splines requires (n * 3) + 1 points')
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

export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Bezier2dImpl(points)

export const append = dual<
  (p1: Vector2.Vector2, p2: Vector2.Vector2, p3: Vector2.Vector2) => (p: Bezier2d) => Bezier2d,
  (p: Bezier2d, p1: Vector2.Vector2, p2: Vector2.Vector2, p3: Vector2.Vector2) => Bezier2d
>(
  4,
  (p: Bezier2d, p1: Vector2.Vector2, p2: Vector2.Vector2, p3: Vector2.Vector2) =>
    new Bezier2dImpl((p instanceof Bezier2dImpl ? p.points : Array.from(p)).concat(p1, p2, p3)),
)

export const fromBasis = (
  p: Iterable<Vector2.Vector2>,
  matrix: Matrix4x4.Matrix4x4,
  stride: 1 | 2 | 3,
) => {
  const conversion = getConversionMatrix(matrix)

  const points: Array<Vector2.Vector2> = []

  let x: Vector4.Vector4 | undefined
  let y: Vector4.Vector4 | undefined

  for (const [p0, p1, p2, p3] of toPointQuads(p, stride)) {
    x = Matrix4x4.vectorProductLeft(conversion, Vector4.make(p0.x, p1.x, p2.x, p3.x))
    y = Matrix4x4.vectorProductLeft(conversion, Vector4.make(p0.y, p1.y, p2.y, p3.y))

    points.push(Vector2.make(x.x, y.x), Vector2.make(x.y, y.y), Vector2.make(x.z, y.z))
  }

  if (x && y) {
    points.push(Vector2.make(x.w, y.w))
  }

  return fromArray(points)
}

export const appendTangentAligned = dual<
  (a: number, p5: Vector2.Vector2, p6: Vector2.Vector2) => (p: Bezier2d) => Bezier2d,
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
>(3, (p: Bezier2d, p5: Vector2.Vector2, p6: Vector2.Vector2) => appendTangentAligned(p, 1, p5, p6))

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
  CubicPath2d.make(...toCurves(p, Characteristic.cubicBezier, 3))

export const fromRational = (r: RationalBezier2d): Solution.AtMostOne<Bezier2d> => {
  const points = RationalBezier2dInternal.toBezierPoints(r)
  if (points._tag === 'none') {
    return points
  }
  return Solution.one(new Bezier2dImpl(points.value))
}

export const subdivide = dual<
  (u: number) => (b: Bezier2d) => [Bezier2d, Bezier2d],
  (b: Bezier2d, u: number) => [Bezier2d, Bezier2d]
>(2, (b: Bezier2d, u: number): [Bezier2d, Bezier2d] => {
  invariant(u > 0 && u < 1, 'subdivide parameter u must be in the open interval (0, 1)')

  const points = b instanceof Bezier2dImpl ? b.points : Array.from(b)
  const segmentCount = (points.length - 1) / 3
  const t = u * segmentCount
  const i = Math.floor(t)
  const localT = t - i

  // exact segment boundary: no de Casteljau needed, just slice
  if (localT === 0) {
    return [new Bezier2dImpl(points.slice(0, i * 3 + 1)), new Bezier2dImpl(points.slice(i * 3))]
  }

  const p0 = points[i * 3] as Vector2.Vector2
  const p1 = points[i * 3 + 1] as Vector2.Vector2
  const p2 = points[i * 3 + 2] as Vector2.Vector2
  const p3 = points[i * 3 + 3] as Vector2.Vector2

  // de Casteljau split — produces five new points between p0 and p3:
  //   left half: [p0, q0, r0, s], right half: [s, r1, q2, p3]
  const q0x = p0.x + (p1.x - p0.x) * localT
  const q0y = p0.y + (p1.y - p0.y) * localT
  const q1x = p1.x + (p2.x - p1.x) * localT
  const q1y = p1.y + (p2.y - p1.y) * localT
  const q2x = p2.x + (p3.x - p2.x) * localT
  const q2y = p2.y + (p3.y - p2.y) * localT

  const r0x = q0x + (q1x - q0x) * localT
  const r0y = q0y + (q1y - q0y) * localT
  const r1x = q1x + (q2x - q1x) * localT
  const r1y = q1y + (q2y - q1y) * localT

  const sx = r0x + (r1x - r0x) * localT
  const sy = r0y + (r1y - r0y) * localT

  const q0 = Vector2.make(q0x, q0y)
  const r0 = Vector2.make(r0x, r0y)
  const sLeft = Vector2.make(sx, sy)
  const sRight = Vector2.make(sx, sy)
  const r1 = Vector2.make(r1x, r1y)
  const q2 = Vector2.make(q2x, q2y)

  const leftPoints: Array<Vector2.Vector2> = [...points.slice(0, i * 3 + 1), q0, r0, sLeft]
  const rightPoints: Array<Vector2.Vector2> = [sRight, r1, q2, ...points.slice(i * 3 + 3)]

  return [new Bezier2dImpl(leftPoints), new Bezier2dImpl(rightPoints)]
})
