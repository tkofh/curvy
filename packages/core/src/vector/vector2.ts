import type { TwoDimensional } from '../dimensions'
import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector2.internal'
import type { Vector2TypeId } from './vector2.internal'

export interface Vector2 extends Pipeable, TwoDimensional<number> {
  readonly [Vector2TypeId]: Vector2TypeId
}

export const isVector2: (v: unknown) => v is Vector2 = internal.isVector2

export const make: {
  (xy: number): Vector2
  (x: number, y: number): Vector2
} = internal.make

export const magnitude: (vector: Vector2) => number = internal.magnitude

export const normalize: (vector: Vector2) => Vector2 = internal.normalize

export const dot: {
  (a: Vector2, b: Vector2): number
  (b: Vector2): (a: Vector2) => number
} = internal.dot

export const components: (v: Vector2) => [number, number] = internal.components

export const softmax: (v: Vector2) => Vector2 = internal.softmax

export const zero = make(0)

export const add: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.add

export const subtract: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.subtract

export const hadamard: {
  (a: Vector2, b: Vector2): Vector2
  (b: Vector2): (a: Vector2) => Vector2
} = internal.hadamard
