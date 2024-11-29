import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { Vector2 } from './vector2'

export const Vector2TypeId = Symbol.for('curvy/vector2')
export type Vector2TypeId = typeof Vector2TypeId

class Vector2Impl extends Pipeable implements Vector2 {
  readonly [Vector2TypeId]: Vector2TypeId = Vector2TypeId

  readonly v0: number
  readonly v1: number

  readonly precision: number

  constructor(v0 = 0, v1 = 0, precision = PRECISION) {
    super()
    this.v0 = round(v0, precision)
    this.v1 = round(v1, precision)

    this.precision = precision
  }

  get [Symbol.toStringTag]() {
    return `Vector2(${this.v0}, ${this.v1})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return `Vector2(${this.v0}, ${this.v1})`
  }

  [Symbol.hasInstance](v: unknown): v is Vector2 {
    return isVector2(v)
  }
}

export const isVector2 = (v: unknown): v is Vector2 =>
  typeof v === 'object' && v !== null && Vector2TypeId in v

export const magnitude = (vector: Vector2) =>
  round(Math.hypot(vector.v0, vector.v1))

export const dot = dual<
  (b: Vector2) => (a: Vector2) => number,
  (a: Vector2, b: Vector2) => number
>(2, (a: Vector2, b: Vector2) => round(a.v0 * b.v0 + a.v1 * b.v1))

export const components = (v: Vector2): [number, number] => [v.v0, v.v1]

export const softmax = (v: Vector2) => {
  const max = Math.max(v.v0, v.v1)

  const v0 = Math.exp(v.v0 - max)
  const v1 = Math.exp(v.v1 - max)

  const sum = v0 + v1

  return make(v0 / sum, v1 / sum)
}

export const make = (v0: number, v1 = v0, precision = PRECISION): Vector2 =>
  new Vector2Impl(v0, v1, precision)
