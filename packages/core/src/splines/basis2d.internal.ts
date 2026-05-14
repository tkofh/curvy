import * as Characteristic from '../characteristic/characteristic.ts'
import * as CubicPath2d from '../path/cubic2d.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Basis2d } from './basis2d.ts'
import type { Bezier2d } from './bezier2d.ts'
import * as bezierInternal from './bezier2d.internal.ts'
import { toCurves } from './util.ts'

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

/** @internal */
export const isBasis2d = (p: unknown): p is Basis2d =>
  typeof p === 'object' && p !== null && Basis2dTypeId in p

/** @internal */
export const make = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
) => new Basis2dImpl([p0, p1, p2, p3])

/** @internal */
export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl(points)

/** @internal */
export const fromTuples = (tuples: ReadonlyArray<readonly [number, number]>) =>
  new Basis2dImpl(tuples.map(([x, y]) => Vector2.make(x, y)))

/** @internal */
export const append = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Basis2d) => Basis2d,
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => Basis2d
>(
  (args) => isBasis2d(args[0]),
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl([...p, ...points]),
)

/** @internal */
export const prepend = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Basis2d) => Basis2d,
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => Basis2d
>(
  (args) => isBasis2d(args[0]),
  (p: Basis2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Basis2dImpl([...points, ...p]),
)

/** @internal */
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

/** @internal */
export const toPath = (p: Basis2d) =>
  CubicPath2d.make(...toCurves(p, Characteristic.cubicBasisSpline, 1))

/** @internal */
export const toBezier = (p: Basis2d): Bezier2d =>
  bezierInternal.fromBasis(p, Characteristic.cubicBasisSpline, 1)
