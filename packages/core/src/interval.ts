import * as internal from './interval.internal'
import type { Pipeable } from './pipe'
export interface Interval extends Pipeable {
  readonly start: number
  readonly end: number
}

export const isInterval: (v: unknown) => v is Interval = internal.isInterval

export const make: {
  (point: number): Interval
  (start: number, end: number): Interval
} = internal.make

export const fromSize: {
  (size: number): Interval
  (start: number, size: number): Interval
} = internal.fromSize

export const fromMinMax: (...values: ReadonlyArray<number>) => Interval =
  internal.fromMinMax

export const size: (i: Interval) => number = internal.size

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

export const biunit: Interval = internal.biunit

export const lerp: (interval: Interval, t: number) => number = internal.lerp

export const toLerpFn: (interval: Interval) => (t: number) => number =
  internal.toLerpFn

export const normalize: (interval: Interval, x: number) => number =
  internal.normalize

export const toNormalizeFn: (interval: Interval) => (x: number) => number =
  internal.toNormalizeFn

export const remap: (source: Interval, target: Interval, x: number) => number =
  internal.remap

export const toRemapFn: (
  source: Interval,
  target: Interval,
) => (x: number) => number = internal.toRemapFn

export interface ScaleShift {
  readonly scale: number
  readonly shift: number
}

export const scaleShift: (source: Interval, target: Interval) => ScaleShift =
  internal.scaleShift
