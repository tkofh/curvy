import { dual, Pipeable } from '../utils.ts'
import { epsEquals } from '../number.ts'
import type { Vector4 } from './vector4.ts'

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

    this.x = v0
    this.y = v1
    this.z = v2
    this.w = v3
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

/** @internal */
export const isVector4 = (v: unknown): v is Vector4 =>
  typeof v === 'object' && v !== null && Vector4TypeId in v

/** @internal */
export const equals = dual<
  (b: Vector4) => (a: Vector4) => boolean,
  (a: Vector4, b: Vector4) => boolean
>(
  2,
  (a: Vector4, b: Vector4) =>
    epsEquals(a.x, b.x) && epsEquals(a.y, b.y) && epsEquals(a.z, b.z) && epsEquals(a.w, b.w),
)

/** @internal */
export const make = (v0: number, v1 = v0, v2 = v1, v3 = v2): Vector4 =>
  new Vector4Impl(v0, v1, v2, v3)

/** @internal */
export const fromTuple = (t: readonly [number, number, number, number]): Vector4 =>
  new Vector4Impl(t[0], t[1], t[2], t[3])

/** @internal */
export const transpose = <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T, T, T],
  project: (item: T) => Channels,
): { readonly [K in keyof Channels]: Vector4 } => {
  const a = project(inputs[0])
  const b = project(inputs[1])
  const c = project(inputs[2])
  const d = project(inputs[3])
  const result: Array<Vector4> = []
  for (let i = 0; i < a.length; i++) {
    result.push(make(a[i] as number, b[i] as number, c[i] as number, d[i] as number))
  }
  return result as never
}

/** @internal */
export const magnitude: (vector: Vector4) => number = (vector: Vector4) =>
  Math.hypot(vector.x, vector.y, vector.z, vector.w)

/** @internal */
export const normalize: (vector: Vector4) => Vector4 = (vector: Vector4) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m, vector.z / m, vector.w / m)
}

/** @internal */
export const dot = dual<(b: Vector4) => (a: Vector4) => number, (a: Vector4, b: Vector4) => number>(
  2,
  (a: Vector4, b: Vector4) => a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w,
)

/** @internal */
export const components: (v: Vector4) => [number, number, number, number] = (v: Vector4) => [
  v.x,
  v.y,
  v.z,
  v.w,
]

/** @internal */
export const softmax: (v: Vector4) => Vector4 = (v: Vector4) => {
  const max = Math.max(v.x, v.y, v.z, v.w)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)
  const v2 = Math.exp(v.z - max)
  const v3 = Math.exp(v.w - max)

  const sum = v0 + v1 + v2 + v3

  return make(v0 / sum, v1 / sum, v2 / sum, v3 / sum)
}

/** @internal */
export const add = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) => make(a.x + b.x, a.y + b.y, a.z + b.z, a.w + b.w))

/** @internal */
export const subtract = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) => make(a.x - b.x, a.y - b.y, a.z - b.z, a.w - b.w))

/** @internal */
export const hadamard = dual<
  (b: Vector4) => (a: Vector4) => Vector4,
  (a: Vector4, b: Vector4) => Vector4
>(2, (a: Vector4, b: Vector4) => make(a.x * b.x, a.y * b.y, a.z * b.z, a.w * b.w))
/** @internal */
export const scale = dual<
  (s: number) => (v: Vector4) => Vector4,
  (v: Vector4, s: number) => Vector4
>(2, (v: Vector4, s: number) => (s === 1 ? v : make(v.x * s, v.y * s, v.z * s, v.w * s)))

/** @internal */
export const getX = (v: Vector4) => v.x
/** @internal */
export const setX = dual<
  (x: number) => (v: Vector4) => Vector4,
  (v: Vector4, x: number) => Vector4
>(2, (v: Vector4, x: number) => make(x, v.y, v.z, v.w))
/** @internal */
export const mapX = dual<
  (f: (x: number) => number) => (v: Vector4) => Vector4,
  (v: Vector4, f: (x: number) => number) => Vector4
>(2, (v: Vector4, f: (x: number) => number) => make(f(v.x), v.y, v.z, v.w))

/** @internal */
export const getY = (v: Vector4) => v.y
/** @internal */
export const setY = dual<
  (y: number) => (v: Vector4) => Vector4,
  (v: Vector4, y: number) => Vector4
>(2, (v: Vector4, y: number) => make(v.x, y, v.z, v.w))
/** @internal */
export const mapY = dual<
  (f: (y: number) => number) => (v: Vector4) => Vector4,
  (v: Vector4, f: (y: number) => number) => Vector4
>(2, (v: Vector4, f: (y: number) => number) => make(v.x, f(v.y), v.z, v.w))

/** @internal */
export const getZ = (v: Vector4) => v.z
/** @internal */
export const setZ = dual<
  (z: number) => (v: Vector4) => Vector4,
  (v: Vector4, z: number) => Vector4
>(2, (v: Vector4, z: number) => make(v.x, v.y, z, v.w))
/** @internal */
export const mapZ = dual<
  (f: (z: number) => number) => (v: Vector4) => Vector4,
  (v: Vector4, f: (z: number) => number) => Vector4
>(2, (v: Vector4, f: (z: number) => number) => make(v.x, v.y, f(v.z), v.w))

/** @internal */
export const getW = (v: Vector4) => v.w
/** @internal */
export const setW = dual<
  (w: number) => (v: Vector4) => Vector4,
  (v: Vector4, w: number) => Vector4
>(2, (v: Vector4, w: number) => make(v.x, v.y, v.z, w))
/** @internal */
export const mapW = dual<
  (f: (w: number) => number) => (v: Vector4) => Vector4,
  (v: Vector4, f: (w: number) => number) => Vector4
>(2, (v: Vector4, f: (w: number) => number) => make(v.x, v.y, v.z, f(v.w)))
