import type { Bounds } from '../../interval/interval.ts'
import { EPSILON, coincident, minMax, mod } from '../../number.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import type { Cyclical, Dimension, Linear, Logarithmic, Power } from '../dimension.ts'

const DimensionTypeId = '~curvy/Dimension'

abstract class DimensionImpl extends Value(DimensionTypeId) {
  abstract readonly kind: 'linear' | 'power' | 'logarithmic' | 'cyclical'
}

class LinearImpl extends DimensionImpl implements Linear {
  readonly kind = 'linear' as const

  readonly scale: number
  readonly offset: number

  constructor(scale: number, offset: number) {
    super()

    invariant(Number.isFinite(scale) && scale !== 0, 'Linear scale must be finite and non-zero')
    invariant(Number.isFinite(offset), 'Linear offset must be finite')

    this.scale = scale
    this.offset = offset
  }

  toString() {
    return `Dimension.Linear(scale ${this.scale}, offset ${this.offset})`
  }
}

class PowerImpl extends DimensionImpl implements Power {
  readonly kind = 'power' as const

  readonly exponent: number
  readonly scale: number
  readonly offset: number

  constructor(exponent: number, scale: number, offset: number) {
    super()

    invariant(
      Number.isFinite(exponent) && exponent > 0,
      'Power exponent must be positive and finite',
    )
    invariant(Number.isFinite(scale) && scale !== 0, 'Power scale must be finite and non-zero')
    invariant(Number.isFinite(offset), 'Power offset must be finite')

    this.exponent = exponent
    this.scale = scale
    this.offset = offset
  }

  toString() {
    return `Dimension.Power(exponent ${this.exponent}, scale ${this.scale}, offset ${this.offset})`
  }
}

class LogarithmicImpl extends DimensionImpl implements Logarithmic {
  readonly kind = 'logarithmic' as const

  readonly scale: number
  readonly offset: number
  readonly base: number

  constructor(scale: number, offset: number, base: number) {
    super()

    invariant(
      Number.isFinite(scale) && scale !== 0,
      'Logarithmic scale must be finite and non-zero',
    )
    invariant(Number.isFinite(offset), 'Logarithmic offset must be finite')
    invariant(
      Number.isFinite(base) && base > 0 && base !== 1,
      'Logarithmic base must be positive, finite, and not 1',
    )

    this.scale = scale
    this.offset = offset
    this.base = base
  }

  toString() {
    return `Dimension.Logarithmic(scale ${this.scale}, offset ${this.offset}, base ${this.base})`
  }
}

class CyclicalImpl extends DimensionImpl implements Cyclical {
  readonly kind = 'cyclical' as const

  readonly period: number

  constructor(period: number) {
    super()

    invariant(Number.isFinite(period) && period > 0, 'Cyclical period must be positive and finite')

    this.period = period
  }

  toString() {
    return `Dimension.Cyclical(period ${this.period})`
  }
}

/** @internal */
export const isDimension = (v: unknown): v is Dimension =>
  typeof v === 'object' && v !== null && DimensionTypeId in v

/** @internal */
export const isLinear = (d: Dimension): d is Linear => d.kind === 'linear'

/** @internal */
export const isPower = (d: Dimension): d is Power => d.kind === 'power'

/** @internal */
export const isLogarithmic = (d: Dimension): d is Logarithmic => d.kind === 'logarithmic'

/** @internal */
export const isCyclical = (d: Dimension): d is Cyclical => d.kind === 'cyclical'

/** @internal */
export const linear = (scale = 1, offset = 0): Linear => new LinearImpl(scale, offset)

/** @internal */
export const power = (exponent: number, scale = 1, offset = 0): Power =>
  new PowerImpl(exponent, scale, offset)

/** @internal */
export const sqrt = (scale = 1, offset = 0): Power => new PowerImpl(0.5, scale, offset)

/** @internal */
export const logarithmic = (scale = 1, offset = 0, base = 10): Logarithmic =>
  new LogarithmicImpl(scale, offset, base)

/** @internal */
export const cyclical = (period: number): Cyclical => new CyclicalImpl(period)

/** @internal */
export const identity: Linear = linear(1, 0)

/** @internal */
export const radians: Cyclical = cyclical(2 * Math.PI)

/** @internal */
export const degrees: Cyclical = cyclical(360)

/** @internal */
export const turns: Cyclical = cyclical(1)

/** @internal */
export const equals = dual<
  (b: Dimension) => (a: Dimension) => boolean,
  (a: Dimension, b: Dimension) => boolean
>(2, (a: Dimension, b: Dimension): boolean => {
  switch (a.kind) {
    case 'linear':
      return b.kind === 'linear' && coincident(a.scale, b.scale) && coincident(a.offset, b.offset)
    case 'power':
      return (
        b.kind === 'power' &&
        coincident(a.exponent, b.exponent) &&
        coincident(a.scale, b.scale) &&
        coincident(a.offset, b.offset)
      )
    case 'logarithmic':
      return (
        b.kind === 'logarithmic' &&
        coincident(a.base, b.base) &&
        coincident(a.scale, b.scale) &&
        coincident(a.offset, b.offset)
      )
    case 'cyclical':
      return b.kind === 'cyclical' && coincident(a.period, b.period)
  }
})

/** @internal */
export const wrap = dual<
  (value: number) => (d: Dimension) => number,
  (d: Dimension, value: number) => number
>(2, (d: Dimension, value: number) => (d.kind === 'cyclical' ? mod(value, d.period) : value))

/** @internal */
export const delta = dual<
  (a: number, b: number) => (d: Dimension) => number,
  (d: Dimension, a: number, b: number) => number
>(3, (d: Dimension, a: number, b: number) =>
  d.kind === 'cyclical' ? d.period / 2 - mod(a - b + d.period / 2, d.period) : b - a,
)

/** @internal */
export const congruent = dual<
  (a: number, b: number) => (d: Dimension) => boolean,
  (d: Dimension, a: number, b: number) => boolean
>(3, (d: Dimension, a: number, b: number) =>
  d.kind === 'cyclical' ? Math.abs(delta(d, a, b)) <= EPSILON * d.period : coincident(a, b),
)

// Shared containment kernel. On a cyclical axis the bounds are a directed
// sweep (the sign of end - start picks the direction, mirroring arc/sector),
// a sweep of a whole period covers the axis, and both edges widen by eps.
// The offset from the sweep's low endpoint is folded into [0, period), so
// the seam-adjacent sliver (offset just under the period) is the eps
// neighborhood behind the sweep's start.
const containsWithin = (d: Dimension, bounds: Bounds, value: number, eps: number): boolean => {
  if (d.kind !== 'cyclical') {
    const [min, max] = minMax(bounds.start, bounds.end)
    return value >= min - eps && value <= max + eps
  }

  const sweep = bounds.end - bounds.start
  if (Math.abs(sweep) >= d.period) {
    return true
  }
  const offset =
    sweep >= 0 ? mod(value - bounds.start, d.period) : mod(value - bounds.end, d.period)
  return offset <= Math.abs(sweep) + eps || offset >= d.period - eps
}

/** @internal */
export const contains = dual<
  (bounds: Bounds, value: number) => (d: Dimension) => boolean,
  (d: Dimension, bounds: Bounds, value: number) => boolean
>(3, (d: Dimension, bounds: Bounds, value: number) => containsWithin(d, bounds, value, 0))

/** @internal */
export const containsApprox = (
  d: Dimension,
  bounds: Bounds,
  value: number,
  eps?: number,
): boolean =>
  containsWithin(d, bounds, value, eps ?? (d.kind === 'cyclical' ? EPSILON * d.period : EPSILON))

/** @internal */
export const unwrap = dual<
  (values: ReadonlyArray<number>) => (d: Dimension) => ReadonlyArray<number>,
  (d: Dimension, values: ReadonlyArray<number>) => ReadonlyArray<number>
>(2, (d: Dimension, values: ReadonlyArray<number>): ReadonlyArray<number> => {
  if (d.kind !== 'cyclical' || values.length < 2) {
    return values
  }

  const out: Array<number> = []
  let previous = 0
  let lifted = 0
  for (const [i, value] of values.entries()) {
    lifted = i === 0 ? value : lifted + delta(d, previous, value)
    out.push(lifted)
    previous = value
  }
  return out
})

/** @internal */
export const lerp = dual<
  (a: number, b: number, t: number) => (d: Dimension) => number,
  (d: Dimension, a: number, b: number, t: number) => number
>(4, (d: Dimension, a: number, b: number, t: number) =>
  d.kind === 'cyclical' ? mod(a + delta(d, a, b) * t, d.period) : (1 - t) * a + t * b,
)

// --- Axis maps: the value-to-output functions of the non-wrapping kinds ---

/** @internal */
export type Mapped = Linear | Power | Logarithmic

/** @internal */
export const isMapped = (d: Dimension): d is Mapped => d.kind !== 'cyclical'

// Signed power, so the map is total, odd, and strictly increasing for any
// positive exponent. Math.sqrt is correctly rounded where Math.pow is not,
// so the sqrt exponent takes it.
const signedPower = (x: number, exponent: number): number => {
  if (exponent === 1) {
    return x
  }
  const magnitude = exponent === 0.5 ? Math.sqrt(Math.abs(x)) : Math.abs(x) ** exponent
  return x < 0 ? -magnitude : magnitude
}

// Dedicated log10/log2 keep exact powers of the base exact: Math.log(1000) /
// Math.LN10 is 2.9999999999999996, Math.log10(1000) is 3.
const logBase = (x: number, base: number): number => {
  if (base === 10) {
    return Math.log10(x)
  }
  if (base === 2) {
    return Math.log2(x)
  }
  if (base === Math.E) {
    return Math.log(x)
  }
  return Math.log(x) / Math.log(base)
}

/** @internal */
export const inDomain = (d: Mapped, x: number): boolean => d.kind !== 'logarithmic' || x > 0

/** @internal */
export const applyMap = (d: Mapped, x: number): number => {
  switch (d.kind) {
    case 'linear':
      return d.scale * x + d.offset
    case 'power':
      return d.scale * signedPower(x, d.exponent) + d.offset
    case 'logarithmic':
      invariant(x > 0, 'A logarithmic dimension maps only positive values')
      return d.scale * logBase(x, d.base) + d.offset
  }
}

// Derivative of applyMap with respect to x. Infinite at x = 0 for a power
// map with exponent below 1; callers that build tangents from it guard that.
/** @internal */
export const mapDerivative = (d: Mapped, x: number): number => {
  switch (d.kind) {
    case 'linear':
      return d.scale
    case 'power':
      return d.exponent === 1 ? d.scale : d.scale * d.exponent * Math.abs(x) ** (d.exponent - 1)
    case 'logarithmic':
      return d.scale / (x * Math.log(d.base))
  }
}

/** @internal */
export const invertMap = (d: Mapped, y: number): number => {
  const u = (y - d.offset) / d.scale
  switch (d.kind) {
    case 'linear':
      return u
    case 'power':
      return d.exponent === 0.5 ? u * Math.abs(u) : signedPower(u, 1 / d.exponent)
    case 'logarithmic':
      return d.base === Math.E ? Math.exp(u) : d.base ** u
  }
}
