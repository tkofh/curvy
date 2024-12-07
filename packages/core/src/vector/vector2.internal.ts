import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { Vector2 } from './vector2'

export const Vector2TypeId = Symbol.for('curvy/vector2')
export type Vector2TypeId = typeof Vector2TypeId

class Vector2Impl extends Pipeable implements Vector2 {
  readonly [Vector2TypeId]: Vector2TypeId = Vector2TypeId

  readonly x: number
  readonly y: number

  readonly precision: number

  constructor(v0 = 0, v1 = 0, precision = PRECISION) {
    super()
    this.x = round(v0, precision)
    this.y = round(v1, precision)

    this.precision = precision
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

export const make = (v0: number, v1 = v0, precision = PRECISION): Vector2 =>
  new Vector2Impl(v0, v1, precision)

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
