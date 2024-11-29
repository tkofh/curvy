import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector3.internal'
import type { Vector3TypeId } from './vector3.internal'

export type Vector3Component = 0 | 1 | 2

export interface Vector3 extends Pipeable {
  readonly [Vector3TypeId]: Vector3TypeId
  readonly v0: number
  readonly v1: number
  readonly v2: number
}

export const isVector3: (v: unknown) => v is Vector3 = internal.isVector3

export const make: (v0: number, v1?: number, v2?: number) => Vector3 =
  internal.make

export const magnitude: (vector: Vector3) => number = internal.magnitude

export const dot: {
  (a: Vector3, b: Vector3): number
  (b: Vector3): (a: Vector3) => number
} = internal.dot

export const components: (v: Vector3) => [number, number, number] =
  internal.components

export const softmax: (v: Vector3) => Vector3 = internal.softmax
export const zero = make(0)
