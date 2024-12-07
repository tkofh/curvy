import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { round } from '../util'
import type { Vector4 } from './vector4'

export const Vector4TypeId: unique symbol = Symbol.for('curvy/vector4')
export type Vector4TypeId = typeof Vector4TypeId

class Vector4Impl extends Pipeable implements Vector4 {
  readonly [Vector4TypeId]: Vector4TypeId = Vector4TypeId

  readonly x: number
  readonly y: number
  readonly z: number
  readonly w: number

  constructor(v0 = 0, v1 = 0, v2 = 0, v3 = 0) {
    super()

    this.x = round(v0)
    this.y = round(v1)
    this.z = round(v2)
    this.w = round(v3)
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

  get [3]() {
    return this.w
  }

  get [Symbol.toStringTag]() {
    return `Vector4(${this.x}, ${this.y}, ${this.z}, ${this.w})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isVector4 = (v: unknown): v is Vector4 =>
  typeof v === 'object' && v !== null && Vector4TypeId in v

export const make = (v0: number, v1 = v0, v2 = v1, v3 = v2): Vector4 =>
  new Vector4Impl(v0, v1, v2, v3)

export const magnitude: (vector: Vector4) => number = (vector: Vector4) =>
  round(Math.hypot(vector.x, vector.y, vector.z, vector.w))

export const normalize: (vector: Vector4) => Vector4 = (vector: Vector4) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m, vector.z / m, vector.w / m)
}

export const dot = dual<
  (b: Vector4) => (a: Vector4) => number,
  (a: Vector4, b: Vector4) => number
>(2, (a: Vector4, b: Vector4) =>
  round(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w),
)

export const components: (v: Vector4) => [number, number, number, number] = (
  v: Vector4,
) => [v.x, v.y, v.z, v.w]

export const softmax: (v: Vector4) => Vector4 = (v: Vector4) => {
  const max = Math.max(v.x, v.y, v.z, v.w)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)
  const v2 = Math.exp(v.z - max)
  const v3 = Math.exp(v.w - max)

  const sum = v0 + v1 + v2 + v3

  return make(v0 / sum, v1 / sum, v2 / sum, v3 / sum)
}

export const add = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) =>
  make(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w),
)

export const subtract = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) =>
  make(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w),
)

export const hadamard = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) =>
  make(a.x * b.x, a.y * b.y, a.z * b.z, a.w * b.w),
)
export const scale = dual<
  (s: number) => (v: Vector4) => Vector4,
  (v: Vector4, s: number) => Vector4
>(2, (v: Vector4, s: number) =>
  s === 1 ? v : make(v.x * s, v.y * s, v.z * s, v.w * s),
)
