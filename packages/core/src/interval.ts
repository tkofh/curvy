import type { Pipeable } from './internal/pipeable'
import * as internal from './interval.internal'
export interface Interval extends Pipeable {
  readonly start: number
  readonly startInclusive: boolean
  readonly end: number
  readonly endInclusive: boolean
  readonly precision: number
}

export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const make: {
  (point: number): Interval
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.make

export const makeExclusive: {
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeExclusive

export const makeStartExclusive: {
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeStartExclusive

export const makeEndExclusive: {
  (start: number, end: number): Interval
  (start: number, end: number, precision: number): Interval
} = internal.makeEndExclusive

export const size: (i: Interval) => number = internal.size

export const min: (i: Interval) => number = internal.min

export const max: (i: Interval) => number = internal.max

export const filter: {
  <V extends ReadonlyArray<number>>(interval: Interval, value: V): V
  <V extends ReadonlyArray<number>>(value: V): (interval: Interval) => V
} = internal.filter

export const clamp: {
  (interval: Interval, value: number): number
  (value: number): (interval: Interval) => number
  (interval: Interval, value: ReadonlyArray<number>): ReadonlyArray<number>
  (value: ReadonlyArray<number>): (interval: Interval) => ReadonlyArray<number>
} = internal.clamp

export const contains: {
  (interval: Interval, value: number): boolean
  (value: number): (interval: Interval) => boolean
} = internal.contains

export const unit: Interval = internal.unit

export const startInclusive: (interval: Interval) => Interval =
  internal.startInclusive

export const endInclusive: (interval: Interval) => Interval =
  internal.endInclusive

export const startExclusive: (interval: Interval) => Interval =
  internal.startExclusive

export const endExclusive: (interval: Interval) => Interval =
  internal.endExclusive

export const withExclusivityOf: {
  (other: Interval): (interval: Interval) => Interval
  (interval: Interval, other: Interval): Interval
} = internal.withExclusivityOf

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
