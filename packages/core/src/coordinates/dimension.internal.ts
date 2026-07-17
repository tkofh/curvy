import type { Bounds } from '../interval/interval.ts'
import { EPSILON, coincident, minMax, mod } from '../number.ts'
import { Pipeable, dual, invariant } from '../utils.ts'
import type { Cyclical, Dimension, Linear } from './dimension.ts'

const TypeId: unique symbol = Symbol.for('curvy/coordinates/dimension')
type TypeId = typeof TypeId

abstract class DimensionImpl extends Pipeable {
  readonly [TypeId]: TypeId = TypeId

  abstract readonly kind: 'linear' | 'cyclical'

  abstract get [Symbol.toStringTag](): string

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

class LinearImpl extends DimensionImpl implements Linear {
  readonly kind = 'linear' as const

  readonly scale: number
  readonly offset: number

  constructor(scale: number, offset: number) {
    super()

    invariant(Number.isFinite(scale) && scale !== 0, 'Linear scale must be finite and non-zero')
    invariant(Number.isFinite(offset), 'Linear offset must be finite')

    this.scale = scale
    this.offset = offset
  }

  get [Symbol.toStringTag]() {
    return `Dimension.Linear(scale ${this.scale}, offset ${this.offset})`
  }
}

class CyclicalImpl extends DimensionImpl implements Cyclical {
  readonly kind = 'cyclical' as const

  readonly period: number

  constructor(period: number) {
    super()

    invariant(Number.isFinite(period) && period > 0, 'Cyclical period must be positive and finite')

    this.period = period
  }

  get [Symbol.toStringTag]() {
    return `Dimension.Cyclical(period ${this.period})`
  }
}

/** @internal */
export const isDimension = (v: unknown): v is Dimension =>
  typeof v === 'object' && v !== null && TypeId in v

/** @internal */
export const isLinear = (d: Dimension): d is Linear => d.kind === 'linear'

/** @internal */
export const isCyclical = (d: Dimension): d is Cyclical => d.kind === 'cyclical'

/** @internal */
export const linear = (scale = 1, offset = 0): Linear => new LinearImpl(scale, offset)

/** @internal */
export const cyclical = (period: number): Cyclical => new CyclicalImpl(period)

/** @internal */
export const identity: Linear = linear(1, 0)

/** @internal */
export const radians: Cyclical = cyclical(2 * Math.PI)

/** @internal */
export const degrees: Cyclical = cyclical(360)

/** @internal */
export const turns: Cyclical = cyclical(1)

/** @internal */
export const equals = dual<
  (b: Dimension) => (a: Dimension) => boolean,
  (a: Dimension, b: Dimension) => boolean
>(2, (a: Dimension, b: Dimension) =>
  a.kind === 'linear'
    ? b.kind === 'linear' && coincident(a.scale, b.scale) && coincident(a.offset, b.offset)
    : b.kind === 'cyclical' && coincident(a.period, b.period),
)

/** @internal */
export const wrap = dual<
  (value: number) => (d: Dimension) => number,
  (d: Dimension, value: number) => number
>(2, (d: Dimension, value: number) => (d.kind === 'cyclical' ? mod(value, d.period) : value))

/** @internal */
export const delta = dual<
  (a: number, b: number) => (d: Dimension) => number,
  (d: Dimension, a: number, b: number) => number
>(3, (d: Dimension, a: number, b: number) =>
  d.kind === 'cyclical' ? d.period / 2 - mod(a - b + d.period / 2, d.period) : b - a,
)

/** @internal */
export const congruent = dual<
  (a: number, b: number) => (d: Dimension) => boolean,
  (d: Dimension, a: number, b: number) => boolean
>(3, (d: Dimension, a: number, b: number) =>
  d.kind === 'cyclical' ? Math.abs(delta(d, a, b)) <= EPSILON * d.period : coincident(a, b),
)

// Shared containment kernel. On a cyclical axis the bounds are a directed
// sweep (the sign of end - start picks the direction, mirroring arc/sector),
// a sweep of a whole period covers the axis, and both edges widen by eps.
// The offset from the sweep's low endpoint is folded into [0, period), so
// the seam-adjacent sliver (offset just under the period) is the eps
// neighborhood behind the sweep's start.
const containsWithin = (d: Dimension, bounds: Bounds, value: number, eps: number): boolean => {
  if (d.kind === 'linear') {
    const [min, max] = minMax(bounds.start, bounds.end)
    return value >= min - eps && value <= max + eps
  }

  const sweep = bounds.end - bounds.start
  if (Math.abs(sweep) >= d.period) {
    return true
  }
  const offset =
    sweep >= 0 ? mod(value - bounds.start, d.period) : mod(value - bounds.end, d.period)
  return offset <= Math.abs(sweep) + eps || offset >= d.period - eps
}

/** @internal */
export const contains = dual<
  (bounds: Bounds, value: number) => (d: Dimension) => boolean,
  (d: Dimension, bounds: Bounds, value: number) => boolean
>(3, (d: Dimension, bounds: Bounds, value: number) => containsWithin(d, bounds, value, 0))

/** @internal */
export const containsApprox = (
  d: Dimension,
  bounds: Bounds,
  value: number,
  eps?: number,
): boolean =>
  containsWithin(d, bounds, value, eps ?? (d.kind === 'cyclical' ? EPSILON * d.period : EPSILON))

/** @internal */
export const unwrap = dual<
  (values: ReadonlyArray<number>) => (d: Dimension) => ReadonlyArray<number>,
  (d: Dimension, values: ReadonlyArray<number>) => ReadonlyArray<number>
>(2, (d: Dimension, values: ReadonlyArray<number>): ReadonlyArray<number> => {
  if (d.kind !== 'cyclical' || values.length < 2) {
    return values
  }

  const out: Array<number> = []
  let previous = 0
  let lifted = 0
  for (const [i, value] of values.entries()) {
    lifted = i === 0 ? value : lifted + delta(d, previous, value)
    out.push(lifted)
    previous = value
  }
  return out
})

/** @internal */
export const lerp = dual<
  (a: number, b: number, t: number) => (d: Dimension) => number,
  (d: Dimension, a: number, b: number, t: number) => number
>(4, (d: Dimension, a: number, b: number, t: number) =>
  d.kind === 'cyclical' ? mod(a + delta(d, a, b) * t, d.period) : (1 - t) * a + t * b,
)
