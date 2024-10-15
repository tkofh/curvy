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

  constructor(start = 0, end = 0, precision = PRECISION) {
    super()

    this.start = round(start, precision)
    this.end = round(end, precision)

    this.precision = precision
  }
}

export const isInterval = (v: unknown): v is Interval =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const make = (start = 0, end = 0, precision = PRECISION) =>
  new IntervalImpl(start, end, precision)

export const size = (i: Interval) => i.end - i.start

export const center = (i: Interval) => (i.start + i.end) / 2

export const min = (i: Interval) => Math.min(i.start, i.end)

export const max = (i: Interval) => Math.max(i.start, i.end)

export const unit = make(0, 1)
