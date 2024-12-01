import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { round } from '../util'
import type { Vector3 } from './vector3'

export const Vector3TypeId: unique symbol = Symbol.for('curvy/vector3')
export type Vector3TypeId = typeof Vector3TypeId

class Vector3Impl extends Pipeable implements Vector3 {
  readonly [Vector3TypeId]: Vector3TypeId = Vector3TypeId

  readonly v0: number
  readonly v1: number
  readonly v2: number

  constructor(v0 = 0, v1 = 0, v2 = 0) {
    super()
    this.v0 = round(v0)
    this.v1 = round(v1)
    this.v2 = round(v2)
  }

  get [Symbol.toStringTag]() {
    return `Vector3(${this.v0}, ${this.v1}, ${this.v2})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return `Vector3(${this.v0}, ${this.v1}, ${this.v2})`
  }

  [Symbol.hasInstance](v: unknown): v is Vector3 {
    return isVector3(v)
  }
}

export const isVector3 = (v: unknown): v is Vector3 =>
  typeof v === 'object' && v !== null && Vector3TypeId in v

export const magnitude = (vector: Vector3) =>
  round(Math.hypot(vector.v0, vector.v1, vector.v2))

export const normalize = (vector: Vector3) => {
  const m = magnitude(vector)

  return make(vector.v0 / m, vector.v1 / m, vector.v2 / m)
}

export const dot = dual<
  (b: Vector3) => (a: Vector3) => number,
  (a: Vector3, b: Vector3) => number
>(2, (a: Vector3, b: Vector3) => round(a.v0 * b.v0 + a.v1 * b.v1 + a.v2 * b.v2))

export const components: (v: Vector3) => [number, number, number] = (
  v: Vector3,
) => [v.v0, v.v1, v.v2]

export const softmax = (v: Vector3) => {
  const max = Math.max(v.v0, v.v1, v.v2)

  const v0 = Math.exp(v.v0 - max)
  const v1 = Math.exp(v.v1 - max)
  const v2 = Math.exp(v.v2 - max)

  const sum = v0 + v1 + v2

  return make(v0 / sum, v1 / sum, v2 / sum)
}

export const make = (v0: number, v1 = v0, v2 = v1): Vector3 =>
  new Vector3Impl(v0, v1, v2)

export const add = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.v0 + b.v0, a.v1 + b.v1, a.v2 + b.v2))

export const subtract = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.v0 - b.v0, a.v1 - b.v1, a.v2 - b.v2))

export const hadamard = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.v0 * b.v0, a.v1 * b.v1, a.v2 * b.v2))
