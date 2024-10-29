import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector4.internal'

export type Vector4Component = 0 | 1 | 2 | 3

export interface Vector4 extends Pipeable {
  readonly v0: number
  readonly v1: number
  readonly v2: number
  readonly v3: number

  readonly precision: number
}

export const isVector4: (v: unknown) => v is Vector4 = internal.isVector4

export const make: (
  v0: number,
  v1?: number,
  v2?: number,
  v3?: number,
  precision?: number,
) => Vector4 = internal.make

export const magnitude: (vector: Vector4) => number = internal.magnitude

export const dot: {
  (a: Vector4, b: Vector4): number
  (b: Vector4): (a: Vector4) => number
} = internal.dot

export const components: (v: Vector4) => [number, number, number, number] =
  internal.components

export const softmax: (v: Vector4) => Vector4 = internal.softmax
export const zero = make(0)
