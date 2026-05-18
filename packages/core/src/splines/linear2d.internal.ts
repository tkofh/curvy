import * as LinearCurve2d from '../curve/linear2d.ts'
import * as LinearPath2d from '../path/linear2d.ts'
import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Linear2d } from './linear2d.ts'

export const Linear2dTypeId = Symbol('curvy/splines/linear2d')
export type Linear2dTypeId = typeof Linear2dTypeId

class Linear2dImpl extends Pipeable implements Linear2d {
  readonly [Linear2dTypeId]: Linear2dTypeId = Linear2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>

  constructor(points: ReadonlyArray<Vector2.Vector2>) {
    invariant(points.length >= 2, 'linear spline requires 2 or more points')
    super()
    this.points = points
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

/** @internal */
export const isLinear2d = (p: unknown): p is Linear2d =>
  typeof p === 'object' && p !== null && Linear2dTypeId in p

/** @internal */
export const make = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  ...rest: ReadonlyArray<Vector2.Vector2>
) => new Linear2dImpl([p0, p1, ...rest])

/** @internal */
export const fromArray = (points: ReadonlyArray<Vector2.Vector2>) => new Linear2dImpl(points)

/** @internal */
export const fromTuples = (tuples: ReadonlyArray<readonly [number, number]>) =>
  new Linear2dImpl(tuples.map(([x, y]) => Vector2.make(x, y)))

/** @internal */
export const append = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Linear2d) => Linear2d,
  (p: Linear2d, ...points: ReadonlyArray<Vector2.Vector2>) => Linear2d
>(
  (args) => isLinear2d(args[0]),
  (p: Linear2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Linear2dImpl([...p, ...points]),
)

/** @internal */
export const prepend = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Linear2d) => Linear2d,
  (p: Linear2d, ...points: ReadonlyArray<Vector2.Vector2>) => Linear2d
>(
  (args) => isLinear2d(args[0]),
  (p: Linear2d, ...points: ReadonlyArray<Vector2.Vector2>) => new Linear2dImpl([...points, ...p]),
)

/** @internal */
export const mapPoints = dual<
  (f: (p: Vector2.Vector2) => Vector2.Vector2) => (s: Linear2d) => Linear2d,
  (s: Linear2d, f: (p: Vector2.Vector2) => Vector2.Vector2) => Linear2d
>(2, (s: Linear2d, f: (p: Vector2.Vector2) => Vector2.Vector2) => {
  const points = s instanceof Linear2dImpl ? s.points : [...s]
  return new Linear2dImpl(points.map(f))
})

/** @internal */
export const flatMap = dual<
  (f: (points: ReadonlyArray<Vector2.Vector2>) => Linear2d) => (s: Linear2d) => Linear2d,
  (s: Linear2d, f: (points: ReadonlyArray<Vector2.Vector2>) => Linear2d) => Linear2d
>(2, (s: Linear2d, f: (points: ReadonlyArray<Vector2.Vector2>) => Linear2d) =>
  f(s instanceof Linear2dImpl ? s.points : [...s]),
)

// Build N-1 linear segments from N points by chaining consecutive pairs.
/** @internal */
export const toPath = (p: Linear2d): LinearPath2d.LinearPath2d => {
  const points = p instanceof Linear2dImpl ? p.points : [...p]
  const segments: Array<LinearCurve2d.LinearCurve2d> = []
  for (let i = 1; i < points.length; i++) {
    segments.push(
      LinearCurve2d.fromEndpoints(points[i - 1] as Vector2.Vector2, points[i] as Vector2.Vector2),
    )
  }
  return LinearPath2d.fromArray(segments)
}
