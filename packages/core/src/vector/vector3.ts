import type { ThreeDimensional } from '../dimensions'
import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector3.internal'
import type { Vector3TypeId } from './vector3.internal'

export interface Vector3 extends Pipeable, ThreeDimensional<number> {
  readonly [Vector3TypeId]: Vector3TypeId
}

export const isVector3: (v: unknown) => v is Vector3 = internal.isVector3

export const make: {
  (xyz: number): Vector3
  (x: number, yz: number): Vector3
  (x: number, y: number, z: number): Vector3
} = internal.make

export const magnitude: (vector: Vector3) => number = internal.magnitude

export const normalize: (vector: Vector3) => Vector3 = internal.normalize

export const dot: {
  (a: Vector3, b: Vector3): number
  (b: Vector3): (a: Vector3) => number
} = internal.dot

export const components: (v: Vector3) => [number, number, number] =
  internal.components

export const softmax: (v: Vector3) => Vector3 = internal.softmax

export const zero = make(0)

export const add: {
  (a: Vector3, b: Vector3): Vector3
  (b: Vector3): (a: Vector3) => Vector3
} = internal.add

export const subtract: {
  (a: Vector3, b: Vector3): Vector3
  (b: Vector3): (a: Vector3) => Vector3
} = internal.subtract

export const hadamard: {
  (a: Vector3, b: Vector3): Vector3
  (b: Vector3): (a: Vector3) => Vector3
} = internal.hadamard
