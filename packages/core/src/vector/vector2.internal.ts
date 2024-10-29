import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { Vector2 } from './vector2'

const TypeBrand = Symbol.for('curvy/vector2')

class Vector2Impl extends Pipeable implements Vector2 {
  readonly [TypeBrand] = TypeBrand

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
  typeof v === 'object' && v !== null && TypeBrand in v

export const magnitude = (vector: Vector2) =>
  round(Math.hypot(vector.v0, vector.v1), vector.precision)

export const dot = dual(2, (a: Vector2, b: Vector2) =>
  round(a.v0 * b.v0 + a.v1 * b.v1, Math.min(a.precision, b.precision)),
)

export const components = (v: Vector2): [number, number] => [v.v0, v.v1]

export const softmax = (v: Vector2) => {
  const max = Math.max(v.v0, v.v1)

  const v0 = Math.exp(v.v0 - max)
  const v1 = Math.exp(v.v1 - max)

  const sum = v0 + v1

  return make(v0 / sum, v1 / sum, v.precision)
}

export const make = (v0: number, v1 = v0, precision = PRECISION): Vector2 =>
  new Vector2Impl(v0, v1, precision)
