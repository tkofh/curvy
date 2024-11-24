import { dual } from './internal/function'
import { Pipeable } from './internal/pipeable'
import type { Interval } from './interval'
import { PRECISION, round } from './util'

const TypeBrand: unique symbol = Symbol.for('curvy/interval')
type TypeBrand = typeof TypeBrand

class IntervalImpl extends Pipeable implements Interval {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly start: number
  readonly end: number

  readonly precision: number

  constructor(start = 0, end = start, precision = PRECISION) {
    super()

    if (end < start) {
      throw new Error('Interval end must be greater than or equal to start')
    }

    this.start = round(start, precision)
    this.end = round(end, precision)

    this.precision = precision
  }

  get [Symbol.toStringTag]() {
    return `Interval [${this.start}, ${this.end}]`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isInterval = (v: unknown): v is Interval =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (start: number, end?: number, precision?: number) =>
  new IntervalImpl(start, end ?? start, precision)

export const fromMinMax = (...values: ReadonlyArray<number>) =>
  new IntervalImpl(Math.min(...values), Math.max(...values))

export const size = (i: Interval) => Math.abs(i.end - i.start)

export const contains = dual<
  (
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ) => (interval: Interval) => boolean,
  (
    interval: Interval,
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ) => boolean
>(
  (args) => isInterval(args[0]),
  (interval: Interval, value: number, { includeStart, includeEnd } = {}) =>
    (value > interval.start && value < interval.end) ||
    ((includeStart ?? true) && value === interval.start) ||
    ((includeEnd ?? true) && value === interval.end),
)

export const filter = dual<
  <V extends ReadonlyArray<number>>(
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ) => (interval: Interval) => V,
  <V extends ReadonlyArray<number>>(
    interval: Interval,
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ) => V
>(
  (args) => isInterval(args[0]),
  <V extends ReadonlyArray<number>>(
    interval: Interval,
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): V => {
    return value.filter((v) => contains(interval, v, options)) as unknown as V
  },
)

export const clamp = dual(2, (interval: Interval, value: number) =>
  contains(interval, value)
    ? value
    : value < interval.start
      ? interval.start
      : interval.end,
)

export const unit = make(0, 1)

export const lerp = dual(
  2,
  (t: number, interval: Interval) =>
    (1 - t) * interval.start + t * interval.end,
)

export const normalize = dual(
  2,
  (x: number, interval: Interval) => (x - interval.start) / size(interval),
)

export const remap = dual(
  3,
  (x: number, source: Interval, destination: Interval) =>
    lerp(normalize(x, source), destination),
)
