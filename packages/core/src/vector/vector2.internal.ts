import { dual, Pipeable } from '../utils.ts'
import { invariant } from '../utils.ts'
import { epsEquals } from '../number.ts'
import type { Vector2, Weighted } from './vector2.ts'

export const Vector2TypeId = Symbol.for('curvy/vector2')
export type Vector2TypeId = typeof Vector2TypeId

export const WeightedVector2TypeId = Symbol.for('curvy/vector2/weighted')
export type WeightedVector2TypeId = typeof WeightedVector2TypeId

class Vector2Impl extends Pipeable implements Vector2 {
  readonly [Vector2TypeId]: Vector2TypeId = Vector2TypeId

  readonly x: number
  readonly y: number

  constructor(v0 = 0, v1 = 0) {
    super()
    this.x = v0
    this.y = v1
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

class WeightedImpl extends Pipeable implements Weighted {
  readonly [WeightedVector2TypeId]: WeightedVector2TypeId = WeightedVector2TypeId

  readonly x: number
  readonly y: number
  readonly weight: number

  constructor(x: number, y: number, weight: number) {
    super()
    this.x = x
    this.y = y
    this.weight = weight
  }

  get [Symbol.toStringTag]() {
    return `Vector2.Weighted(${this.x}, ${this.y}, w=${this.weight})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

/** @internal */
export const isVector2 = (v: unknown): v is Vector2 =>
  typeof v === 'object' && v !== null && Vector2TypeId in v

/** @internal */
export const isWeighted = (v: unknown): v is Weighted =>
  typeof v === 'object' && v !== null && WeightedVector2TypeId in v

/** @internal */
export const equals = dual<
  (b: Vector2) => (a: Vector2) => boolean,
  (a: Vector2, b: Vector2) => boolean
>(2, (a: Vector2, b: Vector2) => epsEquals(a.x, b.x) && epsEquals(a.y, b.y))

/** @internal */
export const make = (v0: number, v1 = v0): Vector2 => new Vector2Impl(v0, v1)

/** @internal */
export const transpose = <T, const Channels extends ReadonlyArray<number>>(
  inputs: readonly [T, T],
  project: (item: T) => Channels,
): { readonly [K in keyof Channels]: Vector2 } => {
  const a = project(inputs[0])
  const b = project(inputs[1])
  const result: Array<Vector2> = []
  for (let i = 0; i < a.length; i++) {
    result.push(make(a[i] as number, b[i] as number))
  }
  return result as never
}

/** @internal */
export const makeWeighted = (x: number, y: number, weight: number): Weighted => {
  invariant(
    Number.isFinite(weight) && weight > 0,
    'Vector2.Weighted weight must be positive and finite',
  )
  return new WeightedImpl(x, y, weight)
}

/** @internal */
export const withWeight = dual<
  (weight: number) => (v: Vector2) => Weighted,
  (v: Vector2, weight: number) => Weighted
>(2, (v: Vector2, weight: number) => makeWeighted(v.x, v.y, weight))

/** @internal */
export const unweighted = (w: Weighted): Vector2 => make(w.x, w.y)

/** @internal */
export const weightedEquals = dual<
  (b: Weighted) => (a: Weighted) => boolean,
  (a: Weighted, b: Weighted) => boolean
>(
  2,
  (a: Weighted, b: Weighted) =>
    epsEquals(a.x, b.x) && epsEquals(a.y, b.y) && epsEquals(a.weight, b.weight),
)

/** @internal */
export const fromPolar = (r: number, theta: number) =>
  make(r * Math.cos(theta), r * Math.sin(theta))

/** @internal */
export const components = (v: Vector2): [number, number] => [v.x, v.y]

/** @internal */
export const magnitude = (vector: Vector2) => Math.hypot(vector.x, vector.y)

/** @internal */
export const normalize = (vector: Vector2) => {
  const m = magnitude(vector)

  return make(vector.x / m, vector.y / m)
}

/** @internal */
export const dot = dual<(b: Vector2) => (a: Vector2) => number, (a: Vector2, b: Vector2) => number>(
  2,
  (a: Vector2, b: Vector2) => a.x * b.x + a.y * b.y,
)

/** @internal */
export const cross = dual<
  (b: Vector2) => (a: Vector2) => number,
  (a: Vector2, b: Vector2) => number
>(2, (a: Vector2, b: Vector2) => a.x * b.y - a.y * b.x)

/** @internal */
export const softmax = (v: Vector2) => {
  const max = Math.max(v.x, v.y)

  const v0 = Math.exp(v.x - max)
  const v1 = Math.exp(v.y - max)

  const sum = v0 + v1

  return make(v0 / sum, v1 / sum)
}

/** @internal */
export const add = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x + b.x, a.y + b.y))

/** @internal */
export const subtract = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x - b.x, a.y - b.y))

/** @internal */
export const hadamard = dual<
  (b: Vector2) => (a: Vector2) => Vector2,
  (a: Vector2, b: Vector2) => Vector2
>(2, (a: Vector2, b: Vector2) => make(a.x * b.x, a.y * b.y))

/** @internal */
export const scale = dual<
  (s: number) => (v: Vector2) => Vector2,
  (v: Vector2, s: number) => Vector2
>(2, (v: Vector2, s: number) => (s === 1 ? v : make(v.x * s, v.y * s)))

/** @internal */
export const getX = (v: Vector2) => v.x
/** @internal */
export const setX = dual<
  (x: number) => (v: Vector2) => Vector2,
  (v: Vector2, x: number) => Vector2
>(2, (v: Vector2, x: number) => make(x, v.y))

/** @internal */
export const getY = (v: Vector2) => v.y
/** @internal */
export const setY = dual<
  (y: number) => (v: Vector2) => Vector2,
  (v: Vector2, y: number) => Vector2
>(2, (v: Vector2, y: number) => make(v.x, y))

/** @internal */
export const setR = dual<
  (r: number) => (v: Vector2) => Vector2,
  (v: Vector2, r: number) => Vector2
>(2, (v: Vector2, r: number) => scale(r / magnitude(v))(v))

/** @internal */
export const getTheta = (v: Vector2) => Math.atan2(v.y, v.x)
/** @internal */
export const setTheta = dual<
  (theta: number) => (v: Vector2) => Vector2,
  (v: Vector2, theta: number) => Vector2
>(2, (v: Vector2, theta: number) => {
  const r = magnitude(v)
  return make(r * Math.cos(theta), r * Math.sin(theta))
})
