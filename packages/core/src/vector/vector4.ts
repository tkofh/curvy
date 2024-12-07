import type { FourDimensional } from '../dimensions'
import type { Pipeable } from '../internal/pipeable'
import * as internal from './vector4.internal'
import type { Vector4TypeId } from './vector4.internal'

export interface Vector4 extends Pipeable, FourDimensional<number> {
  readonly [Vector4TypeId]: Vector4TypeId
}

export const isVector4: (v: unknown) => v is Vector4 = internal.isVector4

export const make: {
  (xyzw: number): Vector4
  (x: number, yzw: number): Vector4
  (x: number, y: number, zw: number): Vector4
  (x: number, y: number, z: number, w: number): Vector4
} = internal.make

export const magnitude: (vector: Vector4) => number = internal.magnitude

export const normalize: (vector: Vector4) => Vector4 = internal.normalize

export const dot: {
  (a: Vector4, b: Vector4): number
  (b: Vector4): (a: Vector4) => number
} = internal.dot

export const components: (v: Vector4) => [number, number, number, number] =
  internal.components

export const softmax: (v: Vector4) => Vector4 = internal.softmax

export const zero = make(0)

export const add: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.add

export const subtract: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.subtract

export const hadamard: {
  (a: Vector4, b: Vector4): Vector4
  (b: Vector4): (a: Vector4) => Vector4
} = internal.hadamard

export const scale: {
  (s: number): (v: Vector4) => Vector4
  (v: Vector4, s: number): Vector4
} = internal.scale
