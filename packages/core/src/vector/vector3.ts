import type { ThreeDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
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

export const fromSpherical: (r: number, theta: number, phi: number) => Vector3 =
  internal.fromSpherical

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

export const scale: {
  (s: number): (v: Vector3) => Vector3
  (v: Vector3, s: number): Vector3
} = internal.scale

export const getX: (v: Vector3) => number = internal.getX
export const setX: {
  (v: Vector3, x: number): Vector3
  (x: number): (v: Vector3) => Vector3
} = internal.setX

export const getY: (v: Vector3) => number = internal.getY
export const setY: {
  (v: Vector3, y: number): Vector3
  (y: number): (v: Vector3) => Vector3
} = internal.setY

export const getZ: (v: Vector3) => number = internal.getZ
export const setZ: {
  (v: Vector3, z: number): Vector3
  (z: number): (v: Vector3) => Vector3
} = internal.setZ

export const getR: (v: Vector3) => number = magnitude
export const setR: {
  (v: Vector3, r: number): Vector3
  (r: number): (v: Vector3) => Vector3
} = internal.setR

export const getTheta: (v: Vector3) => number = internal.getTheta
export const setTheta: {
  (v: Vector3, theta: number): Vector3
  (theta: number): (v: Vector3) => Vector3
} = internal.setTheta

export const getPhi: (v: Vector3) => number = internal.getPhi
export const setPhi: {
  (v: Vector3, phi: number): Vector3
  (phi: number): (v: Vector3) => Vector3
} = internal.setPhi
