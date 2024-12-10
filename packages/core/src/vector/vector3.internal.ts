import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector3 } from './vector3'

export const Vector3TypeId: unique symbol = Symbol.for('curvy/vector3')
export type Vector3TypeId = typeof Vector3TypeId

class Vector3Impl extends Pipeable implements Vector3 {
  readonly [Vector3TypeId]: Vector3TypeId = Vector3TypeId

  readonly x: number
  readonly y: number
  readonly z: number

  constructor(v0 = 0, v1 = 0, v2 = 0) {
    super()
    this.x = round(v0)
    this.y = round(v1)
    this.z = round(v2)
  }

  get [0]() {
    return this.x
  }

  get [1]() {
    return this.y
  }

  get [2]() {
    return this.z
  }

  get [Symbol.toStringTag]() {
    return `Vector3(${this.x}, ${this.y}, ${this.z})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isVector3 = (v: unknown): v is Vector3 =>
  typeof v === 'object' && v !== null && Vector3TypeId in v

export const magnitude = (vector: Vector3) =>
  round(Math.hypot(vector.x, vector.y, vector.z))

export const normalize = (vector: Vector3) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m, vector.z / m)
}

export const dot = dual<
  (b: Vector3) => (a: Vector3) => number,
  (a: Vector3, b: Vector3) => number
>(2, (a: Vector3, b: Vector3) => round(a.x * b.x + a.y * b.y + a.z * b.z))

export const components: (v: Vector3) => [number, number, number] = (
  v: Vector3,
) => [v.x, v.y, v.z]

export const softmax = (v: Vector3) => {
  const max = Math.max(v.x, v.y, v.z)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)
  const v2 = Math.exp(v.z - max)

  const sum = v0 + v1 + v2

  return make(v0 / sum, v1 / sum, v2 / sum)
}

export const make = (v0: number, v1 = v0, v2 = v1): Vector3 =>
  new Vector3Impl(v0, v1, v2)

export const add = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x + b.x, a.y + b.y, a.z + b.z))

export const subtract = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x - b.x, a.y - b.y, a.z - b.z))

export const hadamard = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x * b.x, a.y * b.y, a.z * b.z))

export const scale = dual<
  (s: number) => (v: Vector3) => Vector3,
  (v: Vector3, s: number) => Vector3
>(2, (v: Vector3, s: number) => (s === 1 ? v : make(v.x * s, v.y * s, v.z * s)))
