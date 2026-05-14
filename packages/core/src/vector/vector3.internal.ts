import { dual, Pipeable } from '../utils.ts'
import { epsEquals } from '../number.ts'
import type { Vector3 } from './vector3.ts'

export const Vector3TypeId: unique symbol = Symbol.for('curvy/vector3')
export type Vector3TypeId = typeof Vector3TypeId

class Vector3Impl extends Pipeable implements Vector3 {
  readonly [Vector3TypeId]: Vector3TypeId = Vector3TypeId

  readonly x: number
  readonly y: number
  readonly z: number

  constructor(v0 = 0, v1 = 0, v2 = 0) {
    super()
    this.x = v0
    this.y = v1
    this.z = v2
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

/** @internal */
export const isVector3 = (v: unknown): v is Vector3 =>
  typeof v === 'object' && v !== null && Vector3TypeId in v

/** @internal */
export const equals = dual<
  (b: Vector3) => (a: Vector3) => boolean,
  (a: Vector3, b: Vector3) => boolean
>(2, (a: Vector3, b: Vector3) => epsEquals(a.x, b.x) && epsEquals(a.y, b.y) && epsEquals(a.z, b.z))

/** @internal */
export const make = (v0: number, v1 = v0, v2 = v1): Vector3 => new Vector3Impl(v0, v1, v2)

/** @internal */
export const fromTuple = (t: readonly [number, number, number]): Vector3 =>
  new Vector3Impl(t[0], t[1], t[2])

/** @internal */
export const transpose = <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T, T],
  project: (item: T) => Channels,
): { readonly [K in keyof Channels]: Vector3 } => {
  const a = project(inputs[0])
  const b = project(inputs[1])
  const c = project(inputs[2])
  const result: Array<Vector3> = []
  for (let i = 0; i < a.length; i++) {
    result.push(make(a[i] as number, b[i] as number, c[i] as number))
  }
  return result as never
}

/** @internal */
export const fromSpherical = (r: number, theta: number, phi: number) =>
  new Vector3Impl(
    r * Math.sin(theta) * Math.cos(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(theta),
  )

/** @internal */
export const magnitude = (vector: Vector3) => Math.hypot(vector.x, vector.y, vector.z)

/** @internal */
export const normalize = (vector: Vector3) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m, vector.z / m)
}

/** @internal */
export const dot = dual<(b: Vector3) => (a: Vector3) => number, (a: Vector3, b: Vector3) => number>(
  2,
  (a: Vector3, b: Vector3) => a.x * b.x + a.y * b.y + a.z * b.z,
)

/** @internal */
export const cross = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => {
  const x = a.y * b.z - a.z * b.y
  const y = a.z * b.x - a.x * b.z
  const z = a.x * b.y - a.y * b.x

  return make(x, y, z)
})

/** @internal */
export const components: (v: Vector3) => [number, number, number] = (v: Vector3) => [v.x, v.y, v.z]

/** @internal */
export const softmax = (v: Vector3) => {
  const max = Math.max(v.x, v.y, v.z)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)
  const v2 = Math.exp(v.z - max)

  const sum = v0 + v1 + v2

  return make(v0 / sum, v1 / sum, v2 / sum)
}

/** @internal */
export const add = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x + b.x, a.y + b.y, a.z + b.z))

/** @internal */
export const subtract = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x - b.x, a.y - b.y, a.z - b.z))

/** @internal */
export const hadamard = dual<
  (b: Vector3) => (a: Vector3) => Vector3,
  (a: Vector3, b: Vector3) => Vector3
>(2, (a: Vector3, b: Vector3) => make(a.x * b.x, a.y * b.y, a.z * b.z))

/** @internal */
export const scale = dual<
  (s: number) => (v: Vector3) => Vector3,
  (v: Vector3, s: number) => Vector3
>(2, (v: Vector3, s: number) => (s === 1 ? v : make(v.x * s, v.y * s, v.z * s)))

/** @internal */
export const getX: (v: Vector3) => number = (v: Vector3) => v.x
/** @internal */
export const setX = dual<
  (x: number) => (v: Vector3) => Vector3,
  (v: Vector3, x: number) => Vector3
>(2, (v: Vector3, x: number) => make(x, v.y, v.z))

/** @internal */
export const mapX = dual<
  (f: (x: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (x: number) => number) => Vector3
>(2, (v: Vector3, f: (x: number) => number) => make(f(v.x), v.y, v.z))

/** @internal */
export const getY: (v: Vector3) => number = (v: Vector3) => v.y
/** @internal */
export const setY = dual<
  (y: number) => (v: Vector3) => Vector3,
  (v: Vector3, y: number) => Vector3
>(2, (v: Vector3, y: number) => make(v.x, y, v.z))

/** @internal */
export const mapY = dual<
  (f: (y: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (y: number) => number) => Vector3
>(2, (v: Vector3, f: (y: number) => number) => make(v.x, f(v.y), v.z))

/** @internal */
export const getZ: (v: Vector3) => number = (v: Vector3) => v.z
/** @internal */
export const setZ = dual<
  (z: number) => (v: Vector3) => Vector3,
  (v: Vector3, z: number) => Vector3
>(2, (v: Vector3, z: number) => make(v.x, v.y, z))

/** @internal */
export const mapZ = dual<
  (f: (z: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (z: number) => number) => Vector3
>(2, (v: Vector3, f: (z: number) => number) => make(v.x, v.y, f(v.z)))

/** @internal */
export const setR = dual<
  (r: number) => (v: Vector3) => Vector3,
  (v: Vector3, r: number) => Vector3
>(2, (v: Vector3, r: number) => scale(r / magnitude(v))(v))

/** @internal */
export const mapR = dual<
  (f: (r: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (r: number) => number) => Vector3
>(2, (v: Vector3, f: (r: number) => number) => {
  const r = magnitude(v)
  return scale(f(r) / r)(v)
})

/** @internal */
export const getTheta = (v: Vector3) => Math.acos(v.z / magnitude(v))
/** @internal */
export const setTheta = dual<
  (theta: number) => (v: Vector3) => Vector3,
  (v: Vector3, theta: number) => Vector3
>(2, (v: Vector3, theta: number) => {
  const r = magnitude(v)
  const phi = Math.atan2(v.y, v.x)
  const sinTheta = Math.sin(theta)
  return make(r * sinTheta * Math.cos(phi), r * sinTheta * Math.sin(phi), r * Math.cos(theta))
})

/** @internal */
export const mapTheta = dual<
  (f: (theta: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (theta: number) => number) => Vector3
>(2, (v: Vector3, f: (theta: number) => number) => setTheta(v, f(getTheta(v))))

/** @internal */
export const getPhi = (v: Vector3) => Math.atan2(v.y, v.x)
// setPhi rotates only in the xy plane: preserve z and the xy-projection
// length ρ = r·sin(θ) = hypot(v.x, v.y). That keeps both r and θ invariant.
/** @internal */
export const setPhi = dual<
  (phi: number) => (v: Vector3) => Vector3,
  (v: Vector3, phi: number) => Vector3
>(2, (v: Vector3, phi: number) => {
  const rho = Math.hypot(v.x, v.y)
  return make(rho * Math.cos(phi), rho * Math.sin(phi), v.z)
})

/** @internal */
export const mapPhi = dual<
  (f: (phi: number) => number) => (v: Vector3) => Vector3,
  (v: Vector3, f: (phi: number) => number) => Vector3
>(2, (v: Vector3, f: (phi: number) => number) => setPhi(v, f(getPhi(v))))
