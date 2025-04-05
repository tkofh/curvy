import * as Matrix4x4 from '../matrix/matrix4x4'
import * as CubicPath2d from '../path/cubic2d'
import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { invariant } from '../utils'
import * as Vector2 from '../vector/vector2'
import * as Bezier2d from './bezier2d'
import type { Cardinal2d } from './cardinal2d'
import { toCurves } from './util'

export const characteristic = (scale: number) =>
  Matrix4x4.make(
    0,
    1,
    0,
    0,
    -scale,
    0,
    scale,
    0,
    2 * scale,
    scale - 3,
    3 - 2 * scale,
    -scale,
    -scale,
    2 - scale,
    scale - 2,
    scale,
  )

export const catRomCharacteristic = characteristic(0.5)

export const Cardinal2dTypeId: unique symbol = Symbol.for('curvy/splines/cardinal2d')
export type Cardinal2dTypeId = typeof Cardinal2dTypeId

export class Cardinal2dImpl extends Pipeable {
  readonly [Cardinal2dTypeId]: Cardinal2dTypeId = Cardinal2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 2, 'cardinal splines requires 2 or more points')
    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isCardinal2d = (p: unknown): p is Cardinal2d =>
  typeof p === 'object' && p !== null && Cardinal2dTypeId in p

export const make = (...points: ReadonlyArray<Vector2.Vector2>) => new Cardinal2dImpl(points)

export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Cardinal2dImpl(points)

export const append = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) => Cardinal2d
>(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) =>
    new Cardinal2dImpl([...p, ...points]),
)

export const prepend = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) => Cardinal2d
>(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) =>
    new Cardinal2dImpl([...points, ...p]),
)

export const withDuplicatedEndpoints = (p: Cardinal2d) => {
  const points = p instanceof Cardinal2dImpl ? p.points : [...p]
  return new Cardinal2dImpl([
    points[0] as Vector2.Vector2,
    ...points,
    points[points.length - 1] as Vector2.Vector2,
  ])
}

export const withReflectedEndpoints = dual(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, scale = 1) => {
    if (scale === 0) {
      return withDuplicatedEndpoints(p)
    }

    const points = p instanceof Cardinal2dImpl ? p.points : [...p]
    const p0 = points[0] as Vector2.Vector2
    const p1 = points[1] as Vector2.Vector2

    const p2 = points[points.length - 2] as Vector2.Vector2
    const p3 = points[points.length - 1] as Vector2.Vector2

    return new Cardinal2dImpl([
      Vector2.subtract(p1, p0).pipe(Vector2.scale(scale), Vector2.add(p0)),
      ...points,
      Vector2.subtract(p2, p3).pipe(Vector2.scale(scale), Vector2.add(p3)),
    ])
  },
)

export const toPath = dual(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, scale = 0.5) =>
    CubicPath2d.fromCurves(
      ...toCurves(p, scale === 0.5 ? catRomCharacteristic : characteristic(scale), 1),
    ),
)

export const toBezier = (p: Cardinal2d, scale = 0.5) =>
  Bezier2d.fromSpline(p, scale === 0.5 ? catRomCharacteristic : characteristic(scale), 1)
