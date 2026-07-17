import * as RationalCubicCurve2d from '../curve/rationalCubic2d.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import { EPSILON, coincident } from '../number.ts'
import * as RationalCubicPath2d from '../path/rationalCubic2d.ts'
import { Pipeable, dual, invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Circular, CircularConfig } from './arc.ts'

export const ArcTypeId: unique symbol = Symbol.for('curvy/arc/arc')
export type ArcTypeId = typeof ArcTypeId

const FULL_TURN = 2 * Math.PI
const HALF_TURN = Math.PI
const QUARTER_TURN = Math.PI / 2

class CircularImpl extends Pipeable implements Circular {
  readonly [ArcTypeId]: ArcTypeId = ArcTypeId

  readonly kind = 'circular' as const

  readonly center: Vector2.Vector2
  readonly radius: number
  readonly startAngle: number
  readonly sweep: number

  constructor(center: Vector2.Vector2, radius: number, startAngle: number, sweep: number) {
    super()

    invariant(
      Number.isFinite(radius) && radius >= 0,
      'Circular arc radius must be finite and non-negative',
    )
    invariant(Number.isFinite(startAngle), 'Circular arc startAngle must be finite')
    invariant(Number.isFinite(sweep), 'Circular arc sweep must be finite')

    this.center = center
    this.radius = radius
    this.startAngle = startAngle
    this.sweep = sweep
  }

  get [Symbol.toStringTag]() {
    return `Arc.Circular(center (${this.center.x}, ${this.center.y}), radius ${this.radius}, start ${this.startAngle}, sweep ${this.sweep})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

/** @internal */
export const isCircular = (v: unknown): v is Circular =>
  typeof v === 'object' && v !== null && ArcTypeId in v && (v as Circular).kind === 'circular'

/** @internal */
export const circular = (config: CircularConfig): Circular =>
  new CircularImpl(
    config.center ?? Vector2.zero,
    config.radius,
    config.startAngle ?? 0,
    config.sweep ?? FULL_TURN,
  )

/** @internal */
export const equals = dual<
  (b: Circular) => (a: Circular) => boolean,
  (a: Circular, b: Circular) => boolean
>(
  2,
  (a: Circular, b: Circular) =>
    Vector2.equals(a.center, b.center) &&
    coincident(a.radius, b.radius) &&
    coincident(a.startAngle, b.startAngle) &&
    coincident(a.sweep, b.sweep),
)

/** @internal */
export const pointAt = (center: Vector2.Vector2, rho: number, angle: number): Vector2.Vector2 =>
  Vector2.make(center.x + rho * Math.cos(angle), center.y + rho * Math.sin(angle))

/** @internal */
export const startPoint = (a: Circular): Vector2.Vector2 =>
  pointAt(a.center, a.radius, a.startAngle)

/** @internal */
export const endPoint = (a: Circular): Vector2.Vector2 =>
  pointAt(a.center, a.radius, a.startAngle + a.sweep)

/** @internal */
export const solve = dual<
  (t: number) => (a: Circular) => Vector2.Vector2,
  (a: Circular, t: number) => Vector2.Vector2
>(2, (a: Circular, t: number) => pointAt(a.center, a.radius, a.startAngle + t * a.sweep))

/** @internal */
export const length = (a: Circular): number => a.radius * Math.abs(a.sweep)

/** @internal */
export const reverse = (a: Circular): Circular =>
  new CircularImpl(a.center, a.radius, a.startAngle + a.sweep, -a.sweep)

// Whether phi + 2*pi*k lies in [aLo, aHi] for some integer k.
/** @internal */
export const containsAngleMultiple = (aLo: number, aHi: number, phi: number): boolean =>
  Math.ceil((aLo - phi) / FULL_TURN) * FULL_TURN + phi <= aHi

/** @internal */
export const boundingBox = (
  a: Circular,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const a1 = a.startAngle + a.sweep
  const aLo = Math.min(a.startAngle, a1)
  const aHi = Math.max(a.startAngle, a1)

  let cosLo: number
  let cosHi: number
  let sinLo: number
  let sinHi: number
  if (aHi - aLo >= FULL_TURN) {
    cosLo = -1
    cosHi = 1
    sinLo = -1
    sinHi = 1
  } else {
    const cosStart = Math.cos(aLo)
    const cosEnd = Math.cos(aHi)
    const sinStart = Math.sin(aLo)
    const sinEnd = Math.sin(aHi)
    cosLo = containsAngleMultiple(aLo, aHi, HALF_TURN) ? -1 : Math.min(cosStart, cosEnd)
    cosHi = containsAngleMultiple(aLo, aHi, 0) ? 1 : Math.max(cosStart, cosEnd)
    sinLo = containsAngleMultiple(aLo, aHi, -QUARTER_TURN) ? -1 : Math.min(sinStart, sinEnd)
    sinHi = containsAngleMultiple(aLo, aHi, QUARTER_TURN) ? 1 : Math.max(sinStart, sinEnd)
  }

  return Interval2d.make(
    Interval.fromMinMax(a.center.x + a.radius * cosLo, a.center.x + a.radius * cosHi),
    Interval.fromMinMax(a.center.y + a.radius * sinLo, a.center.y + a.radius * sinHi),
  )
}

// Exact circular arc segment at radius rho from angle a0 to a1, |a1 - a0| at
// most a quarter turn plus rounding slack: the rational-quadratic circle
// representation (middle weight cos(half-sweep)) degree-elevated to cubic in
// homogeneous space. Interior points use the cancelled form
// C + rho * (u(a) + 2*u(m)) / (1 + 2*cos(half)) -- the rational-quadratic
// middle point's 1/cos(half) never appears, so nothing degenerates toward a
// half-turn segment. Interior weights (1 + 2*cos(half)) / 3 stay well above
// zero within the quarter-turn split.
const arcSegment = (
  center: Vector2.Vector2,
  rho: number,
  a0: number,
  a1: number,
): RationalCubicCurve2d.RationalCubicCurve2d => {
  const half = (a1 - a0) / 2
  const w1 = Math.cos(half)
  const mid = a0 + half
  const denominator = 1 + 2 * w1

  const x0 = Math.cos(a0)
  const y0 = Math.sin(a0)
  const x1 = Math.cos(a1)
  const y1 = Math.sin(a1)
  const xm = Math.cos(mid)
  const ym = Math.sin(mid)

  return RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(center.x + rho * x0, center.y + rho * y0, 1),
    Vector2.makeWeighted(
      center.x + (rho * (x0 + 2 * xm)) / denominator,
      center.y + (rho * (y0 + 2 * ym)) / denominator,
      denominator / 3,
    ),
    Vector2.makeWeighted(
      center.x + (rho * (x1 + 2 * xm)) / denominator,
      center.y + (rho * (y1 + 2 * ym)) / denominator,
      denominator / 3,
    ),
    Vector2.makeWeighted(center.x + rho * x1, center.y + rho * y1, 1),
  )
}

// Split a sweep into uniform segments of at most a quarter turn. The EPSILON
// guard keeps unit conversion from splitting an exact quarter turn in two
// when the sweep lands an ulp past pi/2. Boundary angles come from
// multiplication (never accumulation), and the final boundary is a1 verbatim,
// so adjacent segments share bitwise-identical junction angles.
/** @internal */
export const arcSegments = (
  center: Vector2.Vector2,
  rho: number,
  a0: number,
  a1: number,
): Array<RationalCubicCurve2d.RationalCubicCurve2d> => {
  const sweep = a1 - a0
  const count = Math.max(1, Math.ceil(Math.abs(sweep) / QUARTER_TURN - EPSILON))
  const step = sweep / count

  const curves: Array<RationalCubicCurve2d.RationalCubicCurve2d> = []
  for (let k = 0; k < count; k++) {
    const from = a0 + k * step
    const to = k === count - 1 ? a1 : a0 + (k + 1) * step
    curves.push(arcSegment(center, rho, from, to))
  }
  return curves
}

// Sweep clamped to one full period, preserving sign.
/** @internal */
export const clampSweep = (sweep: number, period: number): number =>
  Math.abs(sweep) > period ? Math.sign(sweep) * period : sweep

/** @internal */
export const isFullTurn = (sweep: number, period: number): boolean =>
  Math.abs(sweep) >= period * (1 - EPSILON)

// SVG A commands (no leading M) sweeping `sweep` radians from angle a0 at
// radius rho. Pieces stay at or under a half turn, so the large-arc flag is
// always 0; the sweep flag is 1 for positive sweep (+x toward +y in user
// space). `finalPoint` overrides the last endpoint so a full circle can
// close on the exact starting coordinates instead of cos/sin re-evaluated a
// full period away.
/** @internal */
export const arcCommands = (
  center: Vector2.Vector2,
  rho: number,
  a0: number,
  sweep: number,
  finalPoint?: Vector2.Vector2,
): string => {
  const count = Math.max(1, Math.ceil(Math.abs(sweep) / HALF_TURN - EPSILON))
  const flag = sweep > 0 ? 1 : 0

  let out = ''
  for (let k = 1; k <= count; k++) {
    const point =
      k === count && finalPoint !== undefined
        ? finalPoint
        : pointAt(center, rho, k === count ? a0 + sweep : a0 + k * (sweep / count))
    out += ` A ${rho} ${rho} 0 0 ${flag} ${point.x},${point.y}`
  }
  return out
}

/** @internal */
export const toPath = (a: Circular): RationalCubicPath2d.RationalCubicPath2d =>
  RationalCubicPath2d.fromArray(
    arcSegments(a.center, a.radius, a.startAngle, a.startAngle + a.sweep),
  )

/** @internal */
export const toPathData = (a: Circular): string => {
  if (a.radius === 0) {
    return `M ${a.center.x},${a.center.y}`
  }

  const start = pointAt(a.center, a.radius, a.startAngle)

  if (a.sweep === 0) {
    return `M ${start.x},${start.y}`
  }

  const sweep = clampSweep(a.sweep, FULL_TURN)
  const closesExactly = isFullTurn(a.sweep, FULL_TURN)
  return `M ${start.x},${start.y}${arcCommands(a.center, a.radius, a.startAngle, sweep, closesExactly ? start : undefined)}`
}
