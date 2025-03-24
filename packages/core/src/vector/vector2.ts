import type { TwoDimensional } from '../dimensions'
import type { Pipeable } from '../pipe'
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

export const cross: {
  (a: Vector2, b: Vector2): number
  (b: Vector2): (a: Vector2) => number
} = internal.cross

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

export const scale: {
  (s: number): (v: Vector2) => Vector2
  (v: Vector2, s: number): Vector2
} = internal.scale

export const getX: (v: Vector2) => number = internal.getX
export const setX: {
  (v: Vector2, x: number): Vector2
  (x: number): (v: Vector2) => Vector2
} = internal.setX

export const getY: (v: Vector2) => number = internal.getY
export const setY: {
  (v: Vector2, y: number): Vector2
  (y: number): (v: Vector2) => Vector2
} = internal.setY

export const getR: (v: Vector2) => number = magnitude
export const setR: {
  (v: Vector2, r: number): Vector2
  (r: number): (v: Vector2) => Vector2
} = internal.setR

export const getTheta: (v: Vector2) => number = internal.getTheta
export const setTheta: {
  (v: Vector2, theta: number): Vector2
  (theta: number): (v: Vector2) => Vector2
} = internal.setTheta
