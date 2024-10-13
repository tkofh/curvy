import { PRECISION, round } from '../util'

const TypeBrand = Symbol.for('curvy/vector3')

class Vector3 {
  readonly [TypeBrand] = TypeBrand

  readonly v0: number
  readonly v1: number
  readonly v2: number

  readonly precision: number

  constructor(v0 = 0, v1 = 0, v2 = 0, precision = PRECISION) {
    this.v0 = round(v0, precision)
    this.v1 = round(v1, precision)
    this.v2 = round(v2, precision)

    this.precision = precision
  }
}

export type { Vector3 }

export function isVector3(v: unknown): v is Vector3 {
  return typeof v === 'object' && v !== null && TypeBrand in v
}

export function magnitude(vector: Vector3): number {
  return round(Math.hypot(vector.v0, vector.v1, vector.v2), vector.precision)
}

export function dot(a: Vector3, b: Vector3): number {
  return round(
    a.v0 * b.v0 + a.v1 * b.v1 + a.v2 * b.v2,
    Math.min(a.precision, b.precision),
  )
}

export function components(v: Vector3): [number, number, number] {
  return [v.v0, v.v1, v.v2]
}

export function softmax(v: Vector3): Vector3 {
  const c = 1 / Math.exp(v.v0 + v.v1 + v.v2)

  return vector3(c * Math.exp(v.v0), c * Math.exp(v.v1), c * Math.exp(v.v2))
}

export function vector3(
  v0: number,
  v1 = v0,
  v2 = v1,
  precision = PRECISION,
): Vector3 {
  return new Vector3(v0, v1, v2, precision)
}
