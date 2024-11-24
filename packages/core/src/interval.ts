import type { Pipeable } from './internal/pipeable'
import * as internal from './interval.internal'
export interface Interval extends Pipeable {
  readonly start: number
  readonly end: number
  readonly precision: number
}

export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const make: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.make

export const fromMinMax: (...values: ReadonlyArray<number>) => Interval =
  internal.fromMinMax

export const size: (i: Interval) => number = internal.size

export const min: (i: Interval) => number = internal.min

export const max: (i: Interval) => number = internal.max

export const contains: {
  (
    interval: Interval,
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): boolean
  (
    value: number,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): (interval: Interval) => boolean
} = internal.contains

export const filter: {
  <V extends ReadonlyArray<number>>(
    interval: Interval,
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): V
  <V extends ReadonlyArray<number>>(
    value: V,
    options?: { includeStart?: boolean; includeEnd?: boolean },
  ): (interval: Interval) => V
} = internal.filter

export const clamp: {
  (interval: Interval, value: number): number
  (value: number): (interval: Interval) => number
  (interval: Interval, value: ReadonlyArray<number>): ReadonlyArray<number>
  (value: ReadonlyArray<number>): (interval: Interval) => ReadonlyArray<number>
} = internal.clamp

export const unit: Interval = internal.unit

export const lerp: {
  (interval: Interval): (t: number) => number
  (t: number, interval: Interval): number
} = internal.lerp

export const normalize: {
  (interval: Interval): (x: number) => number
  (x: number, interval: Interval): number
} = internal.normalize

export const remap: {
  (source: Interval, target: Interval): (x: number) => number
  (x: number, source: Interval, target: Interval): number
} = internal.remap
