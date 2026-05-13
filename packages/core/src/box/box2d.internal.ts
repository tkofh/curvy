import * as Interval from '../interval/interval'
import { dual, invariant, Pipeable } from '../utils'
import * as Vector2 from '../vector/vector2'
import type { Box2d } from './box2d'

export const Box2dTypeId: unique symbol = Symbol('curvy/box/box2d')
export type Box2dTypeId = typeof Box2dTypeId

class Box2dImpl<X extends Interval.Interval, Y extends Interval.Interval>
  extends Pipeable
  implements Box2d<X, Y>
{
  readonly [Box2dTypeId]: Box2dTypeId = Box2dTypeId

  readonly x: X
  readonly y: Y

  constructor(x: X, y: Y) {
    super()
    this.x = x
    this.y = y
  }

  get [Symbol.toStringTag]() {
    return `Box2d(${String(this.x)} × ${String(this.y)})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isBox2d = (v: unknown): v is Box2d =>
  typeof v === 'object' && v !== null && Box2dTypeId in v

export const make = <X extends Interval.Interval, Y extends Interval.Interval>(
  x: X,
  y: Y,
): Box2d<X, Y> => new Box2dImpl(x, y)

export const fromCorners = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
): Box2d<Interval.Closed, Interval.Closed> =>
  new Box2dImpl(Interval.fromMinMax(p0.x, p1.x), Interval.fromMinMax(p0.y, p1.y))

export const fromVectors = (
  ...points: ReadonlyArray<Vector2.Vector2>
): Box2d<Interval.Closed, Interval.Closed> => {
  invariant(points.length > 0, 'fromVectors requires at least one point')
  const xs: Array<number> = []
  const ys: Array<number> = []
  for (const p of points) {
    xs.push(p.x)
    ys.push(p.y)
  }
  return new Box2dImpl(Interval.fromMinMax(...xs), Interval.fromMinMax(...ys))
}

export const containsVector = dual<
  (v: Vector2.Vector2) => (box: Box2d) => boolean,
  (box: Box2d, v: Vector2.Vector2) => boolean
>(
  2,
  (box: Box2d, v: Vector2.Vector2): boolean =>
    Interval.contains(box.x, v.x) && Interval.contains(box.y, v.y),
)

export const containsBox = dual<
  (inner: Box2d) => (outer: Box2d) => boolean,
  (outer: Box2d, inner: Box2d) => boolean
>(
  2,
  (outer: Box2d, inner: Box2d): boolean =>
    Interval.containsInterval(outer.x, inner.x) && Interval.containsInterval(outer.y, inner.y),
)

export const size = (box: Box2d): Vector2.Vector2 =>
  Vector2.make(Interval.size(box.x), Interval.size(box.y))

// Smallest closed box enclosing both inputs. Endpoint inclusivity is collapsed
// to closed because openness on a union endpoint isn't meaningful (the union
// of `[0, 1]` and `(1, 2)` is `[0, 2)`, but choosing between open and closed
// at the seam requires knowing both inputs' shapes — easier to give up the
// brand and return Closed).
export const union = dual<
  (b: Box2d) => (a: Box2d) => Box2d<Interval.Closed, Interval.Closed>,
  (a: Box2d, b: Box2d) => Box2d<Interval.Closed, Interval.Closed>
>(
  2,
  (a: Box2d, b: Box2d): Box2d<Interval.Closed, Interval.Closed> =>
    new Box2dImpl(
      Interval.make(Math.min(a.x.start, b.x.start), Math.max(a.x.end, b.x.end)),
      Interval.make(Math.min(a.y.start, b.y.start), Math.max(a.y.end, b.y.end)),
    ),
)

export const equals = dual<
  (b: Box2d) => (a: Box2d) => boolean,
  (a: Box2d, b: Box2d) => boolean
>(2, (a: Box2d, b: Box2d): boolean => Interval.equals(a.x, b.x) && Interval.equals(a.y, b.y))
