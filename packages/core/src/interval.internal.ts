import { dual } from './internal/function'
import { Pipeable } from './internal/pipeable'
import type { Interval } from './interval'
import { PRECISION, round } from './util'

const TypeBrand: unique symbol = Symbol.for('curvy/interval')
type TypeBrand = typeof TypeBrand

class IntervalImpl extends Pipeable implements Interval {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly start: number
  readonly startInclusive: boolean
  readonly end: number
  readonly endInclusive: boolean

  readonly precision: number

  constructor(
    start = 0,
    end = 0,
    startInclusive = true,
    endInclusive = true,
    precision = PRECISION,
  ) {
    super()

    if (start === end && !(startInclusive && endInclusive)) {
      throw new Error('Invalid interval')
    }

    this.start = round(start, precision)
    this.startInclusive = startInclusive
    this.end = round(end, precision)
    this.endInclusive = endInclusive

    this.precision = precision
  }

  get [Symbol.toStringTag]() {
    return `Interval ${this.startInclusive ? '[' : '('}${this.start}, ${this.end}${this.endInclusive ? ']' : ')'}`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isInterval = (v: unknown): v is Interval =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (start: number, end?: number, precision?: number) =>
  new IntervalImpl(start, end ?? start, true, true, precision)

export const makeExclusive = (start: number, end: number, precision?: number) =>
  new IntervalImpl(start, end, false, false, precision)

export const makeStartExclusive = (
  start: number,
  end: number,
  precision?: number,
) => new IntervalImpl(start, end, false, true, precision)

export const makeEndExclusive = (
  start: number,
  end: number,
  precision?: number,
) => new IntervalImpl(start, end, true, false, precision)

export const size = (i: Interval) => Math.abs(i.end - i.start)

export const min = (i: Interval) => Math.min(i.start, i.end)

export const max = (i: Interval) => Math.max(i.start, i.end)

export const contains = dual<
  (value: number) => (interval: Interval) => boolean,
  (interval: Interval, value: number) => boolean
>(
  2,
  (interval: Interval, value: number) =>
    (value > min(interval) && value < max(interval)) ||
    (interval.startInclusive && value === interval.start) ||
    (interval.endInclusive && value === interval.end),
)

export const filter = dual<
  <V extends ReadonlyArray<number>>(value: V) => (interval: Interval) => V,
  <V extends ReadonlyArray<number>>(interval: Interval, value: V) => V
>(2, <V extends ReadonlyArray<number>>(interval: Interval, value: V): V => {
  return value.filter((v) => contains(interval, v)) as unknown as V
})

export const clamp = dual(2, (interval: Interval, value: number) =>
  contains(interval.pipe(startInclusive, endInclusive), value)
    ? value
    : value < min(interval)
      ? min(interval)
      : max(interval),
)

export const unit = make(0, 1)

export const startInclusive = (interval: Interval) =>
  interval.startInclusive
    ? interval
    : new IntervalImpl(
        interval.start,
        interval.end,
        true,
        interval.endInclusive,
        interval.precision,
      )

export const endInclusive = (interval: Interval) =>
  interval.endInclusive
    ? interval
    : new IntervalImpl(
        interval.start,
        interval.end,
        interval.startInclusive,
        true,
        interval.precision,
      )

export const startExclusive = (interval: Interval) =>
  interval.startInclusive
    ? new IntervalImpl(
        interval.start,
        interval.end,
        false,
        interval.endInclusive,
        interval.precision,
      )
    : interval

export const endExclusive = (interval: Interval) =>
  interval.endInclusive
    ? new IntervalImpl(
        interval.start,
        interval.end,
        interval.startInclusive,
        false,
        interval.precision,
      )
    : interval

export const withExclusivityOf = dual(
  2,
  (interval: Interval, other: Interval) =>
    interval.startInclusive === other.startInclusive &&
    interval.endInclusive === other.endInclusive
      ? interval
      : new IntervalImpl(
          interval.start,
          interval.end,
          other.startInclusive,
          other.endInclusive,
          interval.precision,
        ),
)

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
