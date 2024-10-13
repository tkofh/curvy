import { PRECISION, round } from '../util'

const TypeBrand = Symbol.for('curvy/vector2')

class Vector2 {
  readonly [TypeBrand] = TypeBrand

  readonly v0: number
  readonly v1: number

  readonly precision: number

  constructor(v0 = 0, v1 = 0, precision = PRECISION) {
    this.v0 = round(v0, precision)
    this.v1 = round(v1, precision)

    this.precision = precision
  }
}

export type { Vector2 }

export function isVector2(v: unknown): v is Vector2 {
  return typeof v === 'object' && v !== null && TypeBrand in v
}

export function magnitude(vector: Vector2): number {
  return round(Math.hypot(vector.v0, vector.v1), vector.precision)
}

export function dot(a: Vector2, b: Vector2): number {
  return round(a.v0 * b.v0 + a.v1 * b.v1, Math.min(a.precision, b.precision))
}

export function components(v: Vector2): [number, number] {
  return [v.v0, v.v1]
}

export function softmax(v: Vector2): Vector2 {
  const c = 1 / Math.exp(v.v0 + v.v1)

  return vector2(c * Math.exp(v.v0), c * Math.exp(v.v1))
}

export function vector2(v0: number, v1 = v0, precision = PRECISION): Vector2 {
  return new Vector2(v0, v1, precision)
}
