import { dual } from '../internal/function'
import { Pipeable } from '../internal/pipeable'
import { PRECISION, round } from '../util'
import type { Vector4 } from './vector4'
const TypeBrand: unique symbol = Symbol.for('curvy/vector4')
type TypeBrand = typeof TypeBrand

class Vector4Impl extends Pipeable implements Vector4 {
  readonly [TypeBrand]: TypeBrand = TypeBrand

  readonly v0: number
  readonly v1: number
  readonly v2: number
  readonly v3: number

  readonly precision: number

  constructor(v0 = 0, v1 = 0, v2 = 0, v3 = 0, precision = PRECISION) {
    super()

    this.v0 = round(v0, precision)
    this.v1 = round(v1, precision)
    this.v2 = round(v2, precision)
    this.v3 = round(v3, precision)

    this.precision = precision
  }
}

export const isVector4 = (v: unknown): v is Vector4 =>
  typeof v === 'object' && v !== null && TypeBrand in v

export const magnitude: (vector: Vector4) => number = (vector: Vector4) =>
  round(
    Math.hypot(vector.v0, vector.v1, vector.v2, vector.v3),
    vector.precision,
  )

export const dot = dual(2, (a: Vector4, b: Vector4) =>
  round(
    a.v0 * b.v0 + a.v1 * b.v1 + a.v2 * b.v2 + a.v3 * b.v3,
    Math.min(a.precision, b.precision),
  ),
)

export const components: (v: Vector4) => [number, number, number, number] = (
  v: Vector4,
) => [v.v0, v.v1, v.v2, v.v3]

export const softmax: (v: Vector4) => Vector4 = (v: Vector4) => {
  const c = 1 / Math.exp(v.v0 + v.v1 + v.v2 + v.v3)

  return make(
    c * Math.exp(v.v0),
    c * Math.exp(v.v1),
    c * Math.exp(v.v2),
    c * Math.exp(v.v3),
  )
}

export const make = (
  v0: number,
  v1 = v0,
  v2 = v1,
  v3 = v2,
  precision = PRECISION,
): Vector4 => new Vector4Impl(v0, v1, v2, v3, precision)
