import { Pipeable } from '../pipe'
import { dual } from '../pipe'
import { round } from '../utils'
import type { Vector2 } from './vector2'

export const Vector2TypeId = Symbol.for('curvy/vector2')
export type Vector2TypeId = typeof Vector2TypeId

class Vector2Impl extends Pipeable implements Vector2 {
  readonly [Vector2TypeId]: Vector2TypeId = Vector2TypeId

  readonly x: number
  readonly y: number

  constructor(v0 = 0, v1 = 0) {
    super()
    this.x = round(v0)
    this.y = round(v1)
  }

  get [0]() {
    return this.x
  }

  get [1]() {
    return this.y
  }

  get [Symbol.toStringTag]() {
    return `Vector2(${this.x}, ${this.y})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

export const isVector2 = (v: unknown): v is Vector2 =>
  typeof v === 'object' && v !== null && Vector2TypeId in v

export const make = (v0: number, v1 = v0): Vector2 => new Vector2Impl(v0, v1)

export const fromPolar = (r: number, theta: number) =>
  make(r * Math.cos(theta), r * Math.sin(theta))

export const components = (v: Vector2): [number, number] => [v.x, v.y]

export const magnitude = (vector: Vector2) =>
  round(Math.hypot(vector.x, vector.y))

export const normalize = (vector: Vector2) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m)
}

export const dot = dual<
  (b: Vector2) => (a: Vector2) => number,
  (a: Vector2, b: Vector2) => number
>(2, (a: Vector2, b: Vector2) => round(a.x * b.x + a.y * b.y))

export const cross = dual<
  (b: Vector2) => (a: Vector2) => number,
  (a: Vector2, b: Vector2) => number
>(2, (a: Vector2, b: Vector2) => round(a.x * b.y - a.y * b.x))

export const softmax = (v: Vector2) => {
  const max = Math.max(v.x, v.y)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)

  const sum = v0 + v1

  return make(v0 / sum, v1 / sum)
}

export const add = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x + b.x, a.y + b.y))

export const subtract = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x - b.x, a.y - b.y))

export const hadamard = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x * b.x, a.y * b.y))

export const scale = dual<
  (s: number) => (v: Vector2) => Vector2,
  (v: Vector2, s: number) => Vector2
>(2, (v: Vector2, s: number) => (s === 1 ? v : make(v.x * s, v.y * s)))

export const getX = (v: Vector2) => v.x
export const setX = dual<
  (x: number) => (v: Vector2) => Vector2,
  (v: Vector2, x: number) => Vector2
>(2, (v: Vector2, x: number) => make(x, v.y))

export const getY = (v: Vector2) => v.y
export const setY = dual<
  (y: number) => (v: Vector2) => Vector2,
  (v: Vector2, y: number) => Vector2
>(2, (v: Vector2, y: number) => make(v.x, y))

export const setR = dual<
  (r: number) => (v: Vector2) => Vector2,
  (v: Vector2, r: number) => Vector2
>(2, (v: Vector2, r: number) => scale(r / magnitude(v))(v))

export const getTheta = (v: Vector2) => round(Math.atan2(v.y, v.x))
export const setTheta = dual<
  (theta: number) => (v: Vector2) => Vector2,
  (v: Vector2, theta: number) => Vector2
>(2, (v: Vector2, theta: number) => {
  const r = magnitude(v)
  return make(r * Math.cos(theta), r * Math.sin(theta))
})
