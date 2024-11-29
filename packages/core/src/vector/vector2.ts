import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector2.internal'
import type { Vector2TypeId } from './vector2.internal'

export type Vector2Component = 0 | 1

export interface Vector2 extends Pipeable {
  readonly [Vector2TypeId]: Vector2TypeId

  readonly v0: number
  readonly v1: number
}

export const isVector2: (v: unknown) => v is Vector2 = internal.isVector2
export const make: (v0: number, v1?: number) => Vector2 = internal.make
export const magnitude: (vector: Vector2) => number = internal.magnitude
export const dot: {
  (a: Vector2, b: Vector2): number
  (b: Vector2): (a: Vector2) => number
} = internal.dot
export const components: (v: Vector2) => [number, number] = internal.components
export const softmax: (v: Vector2) => Vector2 = internal.softmax
export const zero = make(0)
