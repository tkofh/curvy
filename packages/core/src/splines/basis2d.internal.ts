import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { invariant, roundDown } from '../utils'
import type * as Vector2 from '../vector/vector2'
import type { Basis2d } from './basis2d'
import * as Bezier2d from './bezier2d'
import { toCurves } from './util'

export const characteristic = Matrix4x4.make(
  1 / 6,
  4 / 6,
  roundDown(1 / 6),
  0,
  -0.5,
  0,
  0.5,
  0,
  0.5,
  -1,
  0.5,
  0,
  -1 / 6,
  0.5,
  -0.5,
  1 / 6,
)

export const Basis2dTypeId = Symbol('curvy/splines/basis2d')
export type Basis2dTypeId = typeof Basis2dTypeId

class Basis2dImpl extends Pipeable implements Basis2d {
  readonly [Basis2dTypeId]: Basis2dTypeId = Basis2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 4, 'basis splines requires 4 or more points')
    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isBasis2d = (p: unknown): p is Basis2d =>
  typeof p === 'object' && p !== null && Basis2dTypeId in p

export const make = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
) => new Basis2dImpl([p0, p1, p2, p3])

export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl(points)

export const append = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Basis2d) => Basis2d,
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => Basis2d
>(
  (args) => isBasis2d(args[0]),
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl([...p, ...points]),
)

export const prepend = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Basis2d) => Basis2d,
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => Basis2d
>(
  (args) => isBasis2d(args[0]),
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl([...points, ...p]),
)

export const withTriplicatedEndpoints = (p: Basis2d) => {
  const points = p instanceof Basis2dImpl ? p.points : [...p]
  return new Basis2dImpl([
    points[0] as Vector2.Vector2,
    points[0] as Vector2.Vector2,
    ...points,
    points[points.length - 1] as Vector2.Vector2,
    points[points.length - 1] as Vector2.Vector2,
  ])
}

export const toPath = (p: Basis2d) => CubicPath2d.fromCurves(...toCurves(p, characteristic, 1))

export const toBezier = (p: Basis2d) => Bezier2d.fromSpline(p, characteristic, 1)
