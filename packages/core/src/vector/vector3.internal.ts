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

export const make = (v0: number, v1 = v0, v2 = v1): Vector3 => new Vector3Impl(v0, v1, v2)

export const fromSpherical = (r: number, theta: number, phi: number) =>
  new Vector3Impl(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta),
  )

export const magnitude = (vector: Vector3) => round(Math.hypot(vector.x, vector.y, vector.z))

export const normalize = (vector: Vector3) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m, vector.z / m)
}

export const dot = dual<(b: Vector3) => (a: Vector3) => number, (a: Vector3, b: Vector3) => number>(
  2,
  (a: Vector3, b: Vector3) => round(a.x * b.x + a.y * b.y + a.z * b.z),
)

export const cross = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => {
  const x = a.y * b.z - a.z * b.y
  const y = a.z * b.x - a.x * b.z
  const z = a.x * b.y - a.y * b.x

  return make(x, y, z)
})

export const components: (v: Vector3) => [number, number, number] = (v: Vector3) => [v.x, v.y, v.z]

export const softmax = (v: Vector3) => {
  const max = Math.max(v.x, v.y, v.z)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)
  const v2 = Math.exp(v.z - max)

  const sum = v0 + v1 + v2

  return make(v0 / sum, v1 / sum, v2 / sum)
}

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

export const getX: (v: Vector3) => number = (v: Vector3) => v.x
export const setX = dual<
  (x: number) => (v: Vector3) => Vector3,
  (v: Vector3, x: number) => Vector3
>(2, (v: Vector3, x: number) => make(x, v.y, v.z))

export const getY: (v: Vector3) => number = (v: Vector3) => v.y
export const setY = dual<
  (y: number) => (v: Vector3) => Vector3,
  (v: Vector3, y: number) => Vector3
>(2, (v: Vector3, y: number) => make(v.x, y, v.z))

export const getZ: (v: Vector3) => number = (v: Vector3) => v.z
export const setZ = dual<
  (z: number) => (v: Vector3) => Vector3,
  (v: Vector3, z: number) => Vector3
>(2, (v: Vector3, z: number) => make(v.x, v.y, z))

export const setR = dual<
  (r: number) => (v: Vector3) => Vector3,
  (v: Vector3, r: number) => Vector3
>(2, (v: Vector3, r: number) => scale(r / magnitude(v))(v))

export const getTheta = (v: Vector3) => Math.acos(v.z / magnitude(v))
export const setTheta = dual<
  (phi: number) => (v: Vector3) => Vector3,
  (v: Vector3, phi: number) => Vector3
>(2, (v: Vector3, phi: number) => {
  const m = magnitude(v)
  const sinTheta = Math.sin(phi)
  return make(m * sinTheta * Math.cos(v.y), m * sinTheta * Math.sin(v.y), m * Math.cos(phi))
})

export const getPhi = (v: Vector3) => round(Math.atan2(v.y, v.x))
export const setPhi = dual<
  (theta: number) => (v: Vector3) => Vector3,
  (v: Vector3, theta: number) => Vector3
>(2, (v: Vector3, theta: number) => {
  const m = magnitude(v)
  return make(m * Math.cos(theta), m * Math.sin(theta), v.z)
})
