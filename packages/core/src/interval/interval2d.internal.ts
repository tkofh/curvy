import { dual, invariant, Pipeable } from '../utils'
import * as Vector2 from '../vector/vector2'
import * as Interval from './interval'
import type { Bounds2d, Interval2d } from './interval2d'

export const Interval2dTypeId: unique symbol = Symbol('curvy/interval/interval2d')
export type Interval2dTypeId = typeof Interval2dTypeId

class Interval2dImpl<X extends Interval.Interval, Y extends Interval.Interval>
  extends Pipeable
  implements Interval2d<X, Y>
{
  readonly [Interval2dTypeId]: Interval2dTypeId = Interval2dTypeId

  readonly x: X
  readonly y: Y

  constructor(x: X, y: Y) {
    super()
    this.x = x
    this.y = y
  }

  get [Symbol.toStringTag]() {
    return `Interval2d(${String(this.x)} × ${String(this.y)})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isInterval2d = (v: unknown): v is Interval2d =>
  typeof v === 'object' && v !== null && Interval2dTypeId in v

export const make = <X extends Interval.Interval, Y extends Interval.Interval>(
  x: X,
  y: Y,
): Interval2d<X, Y> => new Interval2dImpl(x, y)

export const fromCorners = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
): Interval2d<Interval.Closed, Interval.Closed> =>
  new Interval2dImpl(Interval.fromMinMax(p0.x, p1.x), Interval.fromMinMax(p0.y, p1.y))

export const fromVectors = (
  ...points: ReadonlyArray<Vector2.Vector2>
): Interval2d<Interval.Closed, Interval.Closed> => {
  invariant(points.length > 0, 'fromVectors requires at least one point')
  const xs: Array<number> = []
  const ys: Array<number> = []
  for (const p of points) {
    xs.push(p.x)
    ys.push(p.y)
  }
  return new Interval2dImpl(Interval.fromMinMax(...xs), Interval.fromMinMax(...ys))
}

export const containsVector = dual<
  (v: Vector2.Vector2) => (box: Interval2d) => boolean,
  (box: Interval2d, v: Vector2.Vector2) => boolean
>(
  2,
  (box: Interval2d, v: Vector2.Vector2): boolean =>
    Interval.contains(box.x, v.x) && Interval.contains(box.y, v.y),
)

export const containsInterval2d = dual<
  (inner: Interval2d) => (outer: Interval2d) => boolean,
  (outer: Interval2d, inner: Interval2d) => boolean
>(
  2,
  (outer: Interval2d, inner: Interval2d): boolean =>
    Interval.containsInterval(outer.x, inner.x) && Interval.containsInterval(outer.y, inner.y),
)

// Accepts the structural minimum because size doesn't read kind.
export const size = (box: Bounds2d): Vector2.Vector2 =>
  Vector2.make(Math.abs(box.x.end - box.x.start), Math.abs(box.y.end - box.y.start))

// Per-axis union — the runtime delegates to `Interval.union`, which is
// kind-correct (the resulting endpoint openness reflects which input
// contributed each side). The conditional return type collapses to the
// shared kind when both inputs match on an axis and falls back to `Interval`
// when they differ — at runtime the result genuinely could be any of the four
// kinds depending on which endpoint wins.
export const union: {
  <
    AX extends Interval.Interval,
    AY extends Interval.Interval,
    BX extends Interval.Interval,
    BY extends Interval.Interval,
  >(
    a: Interval2d<AX, AY>,
    b: Interval2d<BX, BY>,
  ): Interval2d<
    AX extends BX ? (BX extends AX ? AX : Interval.Interval) : Interval.Interval,
    AY extends BY ? (BY extends AY ? AY : Interval.Interval) : Interval.Interval
  >
  <BX extends Interval.Interval, BY extends Interval.Interval>(
    b: Interval2d<BX, BY>,
  ): <AX extends Interval.Interval, AY extends Interval.Interval>(
    a: Interval2d<AX, AY>,
  ) => Interval2d<
    AX extends BX ? (BX extends AX ? AX : Interval.Interval) : Interval.Interval,
    AY extends BY ? (BY extends AY ? AY : Interval.Interval) : Interval.Interval
  >
} = dual(
  2,
  (a: Interval2d, b: Interval2d) =>
    new Interval2dImpl(Interval.union(a.x, b.x), Interval.union(a.y, b.y)),
) as never

export const equals = dual<
  (b: Interval2d) => (a: Interval2d) => boolean,
  (a: Interval2d, b: Interval2d) => boolean
>(
  2,
  (a: Interval2d, b: Interval2d): boolean => Interval.equals(a.x, b.x) && Interval.equals(a.y, b.y),
)
