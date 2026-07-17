import * as RationalCubicCurve2d from '../curve/rationalCubic2d.ts'
import type { Bounds } from '../interval/interval.ts'
import { EPSILON, minMax } from '../number.ts'
import * as RationalCubicPath2d from '../path/rationalCubic2d.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import { Pipeable, dual, invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type {
  Cartesian,
  CoordinateSystem,
  Polar,
  PolarConfig,
  Winding,
} from './coordinateSystem.ts'
import * as dimension from './dimension.internal.ts'
import type { Cyclical, Linear } from './dimension.ts'

const TypeId: unique symbol = Symbol.for('curvy/coordinates/coordinateSystem')
type TypeId = typeof TypeId

abstract class CoordinateSystemImpl extends Pipeable {
  readonly [TypeId]: TypeId = TypeId

  abstract readonly kind: 'cartesian' | 'polar'

  abstract get [Symbol.toStringTag](): string

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

class CartesianImpl extends CoordinateSystemImpl implements Cartesian {
  readonly kind = 'cartesian' as const

  get [Symbol.toStringTag]() {
    return 'CoordinateSystem.Cartesian'
  }
}

class PolarImpl extends CoordinateSystemImpl implements Polar {
  readonly kind = 'polar' as const

  readonly center: Vector2.Vector2
  readonly theta: Cyclical
  readonly winding: Winding
  readonly radius: Linear

  constructor(center: Vector2.Vector2, theta: Cyclical, winding: Winding, radius: Linear) {
    super()

    this.center = center
    this.theta = theta
    this.winding = winding
    this.radius = radius
  }

  get [Symbol.toStringTag]() {
    return `CoordinateSystem.Polar(center (${this.center.x}, ${this.center.y}), period ${this.theta.period}, ${this.winding})`
  }
}

/** @internal */
export const isCoordinateSystem = (v: unknown): v is CoordinateSystem =>
  typeof v === 'object' && v !== null && TypeId in v

/** @internal */
export const isCartesian = (s: CoordinateSystem): s is Cartesian => s.kind === 'cartesian'

/** @internal */
export const isPolar = (s: CoordinateSystem): s is Polar => s.kind === 'polar'

/** @internal */
export const cartesian: Cartesian = new CartesianImpl()

/** @internal */
export const polar = (config?: PolarConfig): Polar =>
  new PolarImpl(
    config?.center ?? Vector2.zero,
    config?.theta ?? dimension.radians,
    config?.winding ?? 'clockwise',
    config?.radius ?? dimension.identity,
  )

/** @internal */
export const equals = dual<
  (b: CoordinateSystem) => (a: CoordinateSystem) => boolean,
  (a: CoordinateSystem, b: CoordinateSystem) => boolean
>(2, (a: CoordinateSystem, b: CoordinateSystem) =>
  a.kind === 'cartesian'
    ? b.kind === 'cartesian'
    : b.kind === 'polar' &&
      a.winding === b.winding &&
      Vector2.equals(a.center, b.center) &&
      dimension.equals(a.theta, b.theta) &&
      dimension.equals(a.radius, b.radius),
)

const windingSign = (w: Winding): 1 | -1 => (w === 'clockwise' ? 1 : -1)

// Chart angle -> mapped angle in radians, positive rotating +x toward +y.
const mapTheta = (s: Polar, theta: number): number =>
  windingSign(s.winding) * theta * ((2 * Math.PI) / s.theta.period)

const mapRadius = (s: Polar, r: number): number => s.radius.scale * r + s.radius.offset

/** @internal */
export const toCartesian = dual<
  (point: Vector2.Vector2) => (s: CoordinateSystem) => Vector2.Vector2,
  (s: CoordinateSystem, point: Vector2.Vector2) => Vector2.Vector2
>(2, (s: CoordinateSystem, point: Vector2.Vector2): Vector2.Vector2 => {
  if (s.kind === 'cartesian') {
    return point
  }
  const angle = mapTheta(s, point.x)
  const rho = mapRadius(s, point.y)
  return Vector2.make(s.center.x + rho * Math.cos(angle), s.center.y + rho * Math.sin(angle))
})

/** @internal */
export const fromCartesian = dual<
  (point: Vector2.Vector2) => (s: CoordinateSystem) => Vector2.Vector2,
  (s: CoordinateSystem, point: Vector2.Vector2) => Vector2.Vector2
>(2, (s: CoordinateSystem, point: Vector2.Vector2): Vector2.Vector2 => {
  if (s.kind === 'cartesian') {
    return point
  }
  const dx = point.x - s.center.x
  const dy = point.y - s.center.y
  const theta = dimension.wrap(
    s.theta,
    windingSign(s.winding) * Math.atan2(dy, dx) * (s.theta.period / (2 * Math.PI)),
  )
  const r = (Math.hypot(dx, dy) - s.radius.offset) / s.radius.scale
  return Vector2.make(theta, r)
})

// Exact circular arc segment at mapped radius rho from mapped angle a0 to a1,
// |a1 - a0| at most a quarter turn plus rounding slack: the rational-quadratic
// circle representation (middle weight cos(half-sweep)) degree-elevated to
// cubic in homogeneous space. Interior points use the cancelled form
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

const QUARTER_TURN = Math.PI / 2

// Split a mapped sweep into uniform segments of at most a quarter turn. The
// EPSILON guard keeps unit conversion from splitting an exact quarter turn in
// two when the mapped sweep lands an ulp past pi/2. Boundary angles come from
// multiplication (never accumulation), and the final boundary is a1 verbatim,
// so adjacent segments share bitwise-identical junction angles.
const arcSegments = (
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

// Straight segment as a rational cubic with degree-1 numerators and constant
// denominator: c2 = c3 = 0 exactly and w identically 1, so the segment is
// linear in t with no characteristic-matrix cancellation residue.
const lineSegment = (
  p: Vector2.Vector2,
  q: Vector2.Vector2,
): RationalCubicCurve2d.RationalCubicCurve2d =>
  RationalCubicCurve2d.fromPolynomials(
    CubicPolynomial.make(p.x, q.x - p.x, 0, 0),
    CubicPolynomial.make(p.y, q.y - p.y, 0, 0),
    CubicPolynomial.make(1, 0, 0, 0),
  )

const pointAt = (center: Vector2.Vector2, rho: number, angle: number): Vector2.Vector2 =>
  Vector2.make(center.x + rho * Math.cos(angle), center.y + rho * Math.sin(angle))

const assertFinite = (label: string, ...values: ReadonlyArray<number>): void => {
  for (const value of values) {
    invariant(Number.isFinite(value), `${label} requires finite inputs`)
  }
}

// Sweep clamped to one full chart turn, preserving sign.
const clampSweep = (sweep: number, period: number): number =>
  Math.abs(sweep) > period ? Math.sign(sweep) * period : sweep

const isFullTurn = (sweep: number, period: number): boolean =>
  Math.abs(sweep) >= period * (1 - EPSILON)

/** @internal */
export const arc = dual<
  (theta: Bounds, r: number) => (s: CoordinateSystem) => RationalCubicPath2d.RationalCubicPath2d,
  (s: CoordinateSystem, theta: Bounds, r: number) => RationalCubicPath2d.RationalCubicPath2d
>(3, (s: CoordinateSystem, theta: Bounds, r: number): RationalCubicPath2d.RationalCubicPath2d => {
  assertFinite('arc', theta.start, theta.end, r)

  if (s.kind === 'cartesian') {
    return RationalCubicPath2d.make(
      lineSegment(Vector2.make(theta.start, r), Vector2.make(theta.end, r)),
    )
  }

  const rho = mapRadius(s, r)
  invariant(rho >= 0, 'arc requires a non-negative mapped radius')

  return RationalCubicPath2d.fromArray(
    arcSegments(s.center, rho, mapTheta(s, theta.start), mapTheta(s, theta.end)),
  )
})

/** @internal */
export const sector = dual<
  (theta: Bounds, r: Bounds) => (s: CoordinateSystem) => RationalCubicPath2d.RationalCubicPath2d,
  (s: CoordinateSystem, theta: Bounds, r: Bounds) => RationalCubicPath2d.RationalCubicPath2d
>(3, (s: CoordinateSystem, theta: Bounds, r: Bounds): RationalCubicPath2d.RationalCubicPath2d => {
  assertFinite('sector', theta.start, theta.end, r.start, r.end)

  if (s.kind === 'cartesian') {
    const [y0, y1] = minMax(r.start, r.end)
    const corner0 = Vector2.make(theta.start, y0)
    const corner1 = Vector2.make(theta.end, y0)
    const corner2 = Vector2.make(theta.end, y1)
    const corner3 = Vector2.make(theta.start, y1)
    return RationalCubicPath2d.make(
      lineSegment(corner0, corner1),
      lineSegment(corner1, corner2),
      lineSegment(corner2, corner3),
      lineSegment(corner3, corner0),
    )
  }

  const [rhoInner, rhoOuter] = minMax(mapRadius(s, r.start), mapRadius(s, r.end))
  invariant(rhoInner >= 0, 'sector requires non-negative mapped radii')

  const sweep = clampSweep(theta.end - theta.start, s.theta.period)
  const a0 = mapTheta(s, theta.start)
  const a1 = mapTheta(s, theta.start + sweep)

  const outer = arcSegments(s.center, rhoOuter, a0, a1)
  const outerEnd = pointAt(s.center, rhoOuter, a1)
  const outerStart = pointAt(s.center, rhoOuter, a0)

  if (rhoInner === 0) {
    return RationalCubicPath2d.fromArray([
      ...outer,
      lineSegment(outerEnd, s.center),
      lineSegment(s.center, outerStart),
    ])
  }

  return RationalCubicPath2d.fromArray([
    ...outer,
    lineSegment(outerEnd, pointAt(s.center, rhoInner, a1)),
    ...arcSegments(s.center, rhoInner, a1, a0),
    lineSegment(pointAt(s.center, rhoInner, a0), outerStart),
  ])
})

const HALF_TURN = Math.PI

// SVG A commands (no leading M) sweeping mappedSweep from mapped angle a0 at
// mapped radius rho. Pieces stay at or under a half turn, so the large-arc
// flag is always 0; the sweep flag is 1 for positive mapped sweep (+x toward
// +y in user space). `finalPoint` overrides the last endpoint so a full
// circle can close on the exact starting coordinates instead of cos/sin
// re-evaluated a full period away.
const arcCommands = (
  center: Vector2.Vector2,
  rho: number,
  a0: number,
  mappedSweep: number,
  finalPoint?: Vector2.Vector2,
): string => {
  const count = Math.max(1, Math.ceil(Math.abs(mappedSweep) / HALF_TURN - EPSILON))
  const flag = mappedSweep > 0 ? 1 : 0

  let out = ''
  for (let k = 1; k <= count; k++) {
    const point =
      k === count && finalPoint !== undefined
        ? finalPoint
        : pointAt(center, rho, k === count ? a0 + mappedSweep : a0 + k * (mappedSweep / count))
    out += ` A ${rho} ${rho} 0 0 ${flag} ${point.x},${point.y}`
  }
  return out
}

/** @internal */
export const arcPathData = dual<
  (theta: Bounds, r: number) => (s: CoordinateSystem) => string,
  (s: CoordinateSystem, theta: Bounds, r: number) => string
>(3, (s: CoordinateSystem, theta: Bounds, r: number): string => {
  assertFinite('arcPathData', theta.start, theta.end, r)

  if (s.kind === 'cartesian') {
    return theta.start === theta.end
      ? `M ${theta.start},${r}`
      : `M ${theta.start},${r} L ${theta.end},${r}`
  }

  const rho = mapRadius(s, r)
  invariant(rho >= 0, 'arcPathData requires a non-negative mapped radius')

  if (rho === 0) {
    return `M ${s.center.x},${s.center.y}`
  }

  const sweep = clampSweep(theta.end - theta.start, s.theta.period)
  const a0 = mapTheta(s, theta.start)
  const start = pointAt(s.center, rho, a0)

  if (sweep === 0) {
    return `M ${start.x},${start.y}`
  }

  const mappedSweep = mapTheta(s, sweep)
  const closesExactly = isFullTurn(sweep, s.theta.period)
  return `M ${start.x},${start.y}${arcCommands(s.center, rho, a0, mappedSweep, closesExactly ? start : undefined)}`
})

/** @internal */
export const sectorPathData = dual<
  (theta: Bounds, r: Bounds) => (s: CoordinateSystem) => string,
  (s: CoordinateSystem, theta: Bounds, r: Bounds) => string
>(3, (s: CoordinateSystem, theta: Bounds, r: Bounds): string => {
  assertFinite('sectorPathData', theta.start, theta.end, r.start, r.end)

  if (s.kind === 'cartesian') {
    const [y0, y1] = minMax(r.start, r.end)
    return `M ${theta.start},${y0} L ${theta.end},${y0} L ${theta.end},${y1} L ${theta.start},${y1} Z`
  }

  const [rhoInner, rhoOuter] = minMax(mapRadius(s, r.start), mapRadius(s, r.end))
  invariant(rhoInner >= 0, 'sectorPathData requires non-negative mapped radii')

  const sweep = clampSweep(theta.end - theta.start, s.theta.period)
  const a0 = mapTheta(s, theta.start)
  const a1 = mapTheta(s, theta.start + sweep)
  const mappedSweep = mapTheta(s, sweep)

  const outerStart = pointAt(s.center, rhoOuter, a0)

  if (rhoOuter === 0) {
    return `M ${s.center.x},${s.center.y}`
  }

  if (sweep === 0) {
    const innerStart = pointAt(s.center, rhoInner, a0)
    return `M ${outerStart.x},${outerStart.y} L ${innerStart.x},${innerStart.y} Z`
  }

  if (rhoInner === rhoOuter) {
    return `M ${outerStart.x},${outerStart.y}${arcCommands(s.center, rhoOuter, a0, mappedSweep, isFullTurn(sweep, s.theta.period) ? outerStart : undefined)} Z`
  }

  if (isFullTurn(sweep, s.theta.period)) {
    const outerLoop = `M ${outerStart.x},${outerStart.y}${arcCommands(s.center, rhoOuter, a0, mappedSweep, outerStart)} Z`
    if (rhoInner === 0) {
      return outerLoop
    }
    const innerStart = pointAt(s.center, rhoInner, a0)
    return `${outerLoop} M ${innerStart.x},${innerStart.y}${arcCommands(s.center, rhoInner, a0, -mappedSweep, innerStart)} Z`
  }

  const outerCommands = arcCommands(s.center, rhoOuter, a0, mappedSweep)

  if (rhoInner === 0) {
    return `M ${outerStart.x},${outerStart.y}${outerCommands} L ${s.center.x},${s.center.y} Z`
  }

  const innerEnd = pointAt(s.center, rhoInner, a1)
  return `M ${outerStart.x},${outerStart.y}${outerCommands} L ${innerEnd.x},${innerEnd.y}${arcCommands(s.center, rhoInner, a1, -mappedSweep)} Z`
})
