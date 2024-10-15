import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector2.internal'

export type Vector2Component = 0 | 1

export interface Vector2 extends Pipeable {
  readonly v0: number
  readonly v1: number

  readonly precision: number
}

export const isVector2: (v: unknown) => v is Vector2 = internal.isVector2
export const vector2: (v0: number, v1?: number, precision?: number) => Vector2 =
  internal.make
export const magnitude: (vector: Vector2) => number = internal.magnitude
export const dot: {
  (a: Vector2, b: Vector2): number
  (b: Vector2): (a: Vector2) => number
} = internal.dot
export const components: (v: Vector2) => [number, number] = internal.components
export const softmax: (v: Vector2) => Vector2 = internal.softmax
