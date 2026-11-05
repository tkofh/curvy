import * as RationalCubicCurve2d from '../curve/rationalCubic2d.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import { EPSILON, coincident } from '../number.ts'
import * as RationalCubicPath2d from '../path/rationalCubic2d.ts'
import { Pipeable, dual, invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import type { Arc, Circular, CircularConfig, Elliptical, EllipticalConfig } from './arc.ts'

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

class EllipticalImpl extends Pipeable implements Elliptical {
  readonly [ArcTypeId]: ArcTypeId = ArcTypeId

  readonly kind = 'elliptical' as const

  readonly center: Vector2.Vector2
  readonly radiusX: number
  readonly radiusY: number
  readonly rotation: number
  readonly startAngle: number
  readonly sweep: number

  constructor(
    center: Vector2.Vector2,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    sweep: number,
  ) {
    super()

    invariant(
      Number.isFinite(radiusX) && radiusX >= 0,
      'Elliptical arc radiusX must be finite and non-negative',
    )
    invariant(
      Number.isFinite(radiusY) && radiusY >= 0,
      'Elliptical arc radiusY must be finite and non-negative',
    )
    invariant(Number.isFinite(rotation), 'Elliptical arc rotation must be finite')
    invariant(Number.isFinite(startAngle), 'Elliptical arc startAngle must be finite')
    invariant(Number.isFinite(sweep), 'Elliptical arc sweep must be finite')

    this.center = center
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.rotation = rotation
    this.startAngle = startAngle
    this.sweep = sweep
  }

  get [Symbol.toStringTag]() {
    return `Arc.Elliptical(center (${this.center.x}, ${this.center.y}), radii (${this.radiusX}, ${this.radiusY}), rotation ${this.rotation}, start ${this.startAngle}, sweep ${this.sweep})`
  }

  get [Symbol.for('nodejs.util.inspect.custom')]() {
    return this[Symbol.toStringTag]
  }
}

/** @internal */
export const isArc = (v: unknown): v is Arc => typeof v === 'object' && v !== null && ArcTypeId in v

/** @internal */
export const isCircular = (v: unknown): v is Circular => isArc(v) && v.kind === 'circular'

/** @internal */
export const isElliptical = (v: unknown): v is Elliptical => isArc(v) && v.kind === 'elliptical'

/** @internal */
export const circular = (config: CircularConfig): Circular =>
  new CircularImpl(
    config.center ?? Vector2.zero,
    config.radius,
    config.startAngle ?? 0,
    config.sweep ?? FULL_TURN,
  )

/** @internal */
export const elliptical = (config: EllipticalConfig): Elliptical =>
  new EllipticalImpl(
    config.center ?? Vector2.zero,
    config.radiusX,
    config.radiusY,
    config.rotation ?? 0,
    config.startAngle ?? 0,
    config.sweep ?? FULL_TURN,
  )

/** @internal */
export const equals = dual<(b: Arc) => (a: Arc) => boolean, (a: Arc, b: Arc) => boolean>(
  2,
  (a: Arc, b: Arc): boolean => {
    if (
      a.kind !== b.kind ||
      !Vector2.equals(a.center, b.center) ||
      !coincident(a.startAngle, b.startAngle) ||
      !coincident(a.sweep, b.sweep)
    ) {
      return false
    }
    if (a.kind === 'circular') {
      return coincident(a.radius, (b as Circular).radius)
    }
    const e = b as Elliptical
    return (
      coincident(a.radiusX, e.radiusX) &&
      coincident(a.radiusY, e.radiusY) &&
      coincident(a.rotation, e.rotation)
    )
  },
)

/** @internal */
export const pointAt = (center: Vector2.Vector2, rho: number, angle: number): Vector2.Vector2 =>
  Vector2.make(center.x + rho * Math.cos(angle), center.y + rho * Math.sin(angle))

// The ellipse's affine frame: a unit-circle point (u, v) lands at
// center + radiusX * u * (cos r, sin r) + radiusY * v * (-sin r, cos r).
// Rotation 0 gives cos 1 and sin 0 exactly, so axis-aligned ellipses carry
// no rotation residue.
interface Frame {
  readonly cx: number
  readonly cy: number
  readonly ax: number
  readonly ay: number
  readonly bx: number
  readonly by: number
}

const frameOf = (e: Elliptical): Frame => {
  const cos = Math.cos(e.rotation)
  const sin = Math.sin(e.rotation)
  return {
    cx: e.center.x,
    cy: e.center.y,
    ax: e.radiusX * cos,
    ay: e.radiusX * sin,
    bx: -e.radiusY * sin,
    by: e.radiusY * cos,
  }
}

const framePoint = (f: Frame, u: number, v: number): Vector2.Vector2 =>
  Vector2.make(f.cx + f.ax * u + f.bx * v, f.cy + f.ay * u + f.by * v)

const ellipsePointAt = (f: Frame, angle: number): Vector2.Vector2 =>
  framePoint(f, Math.cos(angle), Math.sin(angle))

const angleAt = (a: Arc, angle: number): Vector2.Vector2 =>
  a.kind === 'circular' ? pointAt(a.center, a.radius, angle) : ellipsePointAt(frameOf(a), angle)

/** @internal */
export const startPoint = (a: Arc): Vector2.Vector2 => angleAt(a, a.startAngle)

/** @internal */
export const endPoint = (a: Arc): Vector2.Vector2 => angleAt(a, a.startAngle + a.sweep)

/** @internal */
export const solve = dual<
  (t: number) => (a: Arc) => Vector2.Vector2,
  (a: Arc, t: number) => Vector2.Vector2
>(2, (a: Arc, t: number) => angleAt(a, a.startAngle + t * a.sweep))

// --- Elliptic arc length ---
//
// The arc length from parametric angle 0 to phi is
// integral of sqrt(rx^2 sin^2 t + ry^2 cos^2 t) dt, an incomplete elliptic
// integral of the second kind. E(phi, m) is evaluated through Carlson's
// symmetric forms R_F and R_D (duplication algorithm, as in Numerical
// Recipes 3rd ed. section 6.12), whose truncation error at these ERRTOL
// values sits below double rounding.

const RF_ERRTOL = 0.0025
const RD_ERRTOL = 0.0015

const carlsonRF = (x: number, y: number, z: number): number => {
  let xt = x
  let yt = y
  let zt = z
  let ave: number
  let delx: number
  let dely: number
  let delz: number
  do {
    const sx = Math.sqrt(xt)
    const sy = Math.sqrt(yt)
    const sz = Math.sqrt(zt)
    const lambda = sx * (sy + sz) + sy * sz
    xt = 0.25 * (xt + lambda)
    yt = 0.25 * (yt + lambda)
    zt = 0.25 * (zt + lambda)
    ave = (xt + yt + zt) / 3
    delx = (ave - xt) / ave
    dely = (ave - yt) / ave
    delz = (ave - zt) / ave
  } while (Math.max(Math.abs(delx), Math.abs(dely), Math.abs(delz)) > RF_ERRTOL)
  const e2 = delx * dely - delz * delz
  const e3 = delx * dely * delz
  return (1 + (e2 / 24 - 0.1 - (3 / 44) * e3) * e2 + e3 / 14) / Math.sqrt(ave)
}

const carlsonRD = (x: number, y: number, z: number): number => {
  let xt = x
  let yt = y
  let zt = z
  let sum = 0
  let fac = 1
  let ave: number
  let delx: number
  let dely: number
  let delz: number
  do {
    const sx = Math.sqrt(xt)
    const sy = Math.sqrt(yt)
    const sz = Math.sqrt(zt)
    const lambda = sx * (sy + sz) + sy * sz
    sum += fac / (sz * (zt + lambda))
    fac *= 0.25
    xt = 0.25 * (xt + lambda)
    yt = 0.25 * (yt + lambda)
    zt = 0.25 * (zt + lambda)
    ave = 0.2 * (xt + yt + 3 * zt)
    delx = (ave - xt) / ave
    dely = (ave - yt) / ave
    delz = (ave - zt) / ave
  } while (Math.max(Math.abs(delx), Math.abs(dely), Math.abs(delz)) > RD_ERRTOL)
  const ea = delx * dely
  const eb = delz * delz
  const ec = ea - eb
  const ed = ea - 6 * eb
  const ee = ed + ec + ec
  const c3 = 9 / 22
  const c4 = 3 / 26
  return (
    3 * sum +
    (fac *
      (1 +
        ed * (-3 / 14 + 0.25 * c3 * ed - 1.5 * c4 * delz * ee) +
        delz * (ee / 6 + delz * (-c3 * ec + delz * c4 * ea)))) /
      (ave * Math.sqrt(ave))
  )
}

// E(psi, m) for psi in [-pi/2, pi/2] and m in [0, 1]. At m = 1 the integrand
// is cos t, and Carlson's arguments would both reach 0 at psi = pi/2.
const incompleteE = (psi: number, m: number): number => {
  const s = Math.sin(psi)
  if (m === 1) {
    return s
  }
  const c = Math.cos(psi)
  const c2 = c * c
  const q = 1 - m * s * s
  return s * carlsonRF(c2, q, 1) - (m * s * s * s * carlsonRD(c2, q, 1)) / 3
}

const completeE = (m: number): number =>
  m === 1 ? 1 : carlsonRF(0, 1 - m, 1) - (m * carlsonRD(0, 1 - m, 1)) / 3

// E(phi, m) for any phi: whole half-periods contribute 2 * E(m) each, so
// reduce to the nearest multiple of pi and evaluate the remainder.
const ellipticE = (phi: number, m: number, complete: number): number => {
  const n = Math.round(phi / HALF_TURN)
  return 2 * n * complete + incompleteE(phi - n * HALF_TURN, m)
}

const ellipticLength = (e: Elliptical): number => {
  const major = Math.max(e.radiusX, e.radiusY)
  const minor = Math.min(e.radiusX, e.radiusY)
  if (major === minor) {
    return major * Math.abs(e.sweep)
  }
  // The longer semi-axis leads the integrand, keeping m in (0, 1]. With
  // radiusX longer, the substitution t = s - pi/2 swaps the roles of sin
  // and cos, shifting both limits by a quarter turn.
  const m = ((major - minor) * (major + minor)) / (major * major)
  const shift = e.radiusX > e.radiusY ? QUARTER_TURN : 0
  const complete = completeE(m)
  const a0 = e.startAngle + shift
  const a1 = e.startAngle + e.sweep + shift
  return major * Math.abs(ellipticE(a1, m, complete) - ellipticE(a0, m, complete))
}

/** @internal */
export const length = (a: Arc): number =>
  a.kind === 'circular' ? a.radius * Math.abs(a.sweep) : ellipticLength(a)

/** @internal */
export const reverse = <A extends Arc>(a: A): A =>
  (a.kind === 'circular'
    ? new CircularImpl(a.center, a.radius, a.startAngle + a.sweep, -a.sweep)
    : new EllipticalImpl(
        a.center,
        a.radiusX,
        a.radiusY,
        a.rotation,
        a.startAngle + a.sweep,
        -a.sweep,
      )) as unknown as A

// Whether phi + 2*pi*k lies in [aLo, aHi] for some integer k.
/** @internal */
export const containsAngleMultiple = (aLo: number, aHi: number, phi: number): boolean =>
  Math.ceil((aLo - phi) / FULL_TURN) * FULL_TURN + phi <= aHi

// Exact range of center + h * cos(angle - phase) over the angle interval
// [aLo, aHi]: the extremes are the endpoint values unless the interval
// crosses the phase (maximum) or the phase plus a half turn (minimum).
const cosineRange = (
  center: number,
  h: number,
  phase: number,
  aLo: number,
  aHi: number,
  atStart: number,
  atEnd: number,
): [number, number] => {
  if (aHi - aLo >= FULL_TURN) {
    return [center - h, center + h]
  }
  const lo = containsAngleMultiple(aLo, aHi, phase + HALF_TURN)
    ? center - h
    : Math.min(atStart, atEnd)
  const hi = containsAngleMultiple(aLo, aHi, phase) ? center + h : Math.max(atStart, atEnd)
  return [lo, hi]
}

// Each coordinate of an ellipse point is a sinusoid in the parametric
// angle: x - cx = ax * cos a + bx * sin a = hypot(ax, bx) * cos(a - atan2(bx, ax)),
// and likewise for y.
const ellipticalBoundingBox = (
  e: Elliptical,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const f = frameOf(e)
  const a1 = e.startAngle + e.sweep
  const aLo = Math.min(e.startAngle, a1)
  const aHi = Math.max(e.startAngle, a1)
  const start = ellipsePointAt(f, aLo)
  const end = ellipsePointAt(f, aHi)
  const [xLo, xHi] = cosineRange(
    f.cx,
    Math.hypot(f.ax, f.bx),
    Math.atan2(f.bx, f.ax),
    aLo,
    aHi,
    start.x,
    end.x,
  )
  const [yLo, yHi] = cosineRange(
    f.cy,
    Math.hypot(f.ay, f.by),
    Math.atan2(f.by, f.ay),
    aLo,
    aHi,
    start.y,
    end.y,
  )
  return Interval2d.make(Interval.fromMinMax(xLo, xHi), Interval.fromMinMax(yLo, yHi))
}

/** @internal */
export const boundingBox = (a: Arc): Interval2d.Interval2d<Interval.Closed, Interval.Closed> =>
  a.kind === 'circular' ? circularBoundingBox(a) : ellipticalBoundingBox(a)

const circularBoundingBox = (
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
const quarterTurnSplit = <T>(
  a0: number,
  a1: number,
  segment: (from: number, to: number) => T,
): Array<T> => {
  const sweep = a1 - a0
  const count = Math.max(1, Math.ceil(Math.abs(sweep) / QUARTER_TURN - EPSILON))
  const step = sweep / count

  const curves: Array<T> = []
  for (let k = 0; k < count; k++) {
    const from = a0 + k * step
    const to = k === count - 1 ? a1 : a0 + (k + 1) * step
    curves.push(segment(from, to))
  }
  return curves
}

/** @internal */
export const arcSegments = (
  center: Vector2.Vector2,
  rho: number,
  a0: number,
  a1: number,
): Array<RationalCubicCurve2d.RationalCubicCurve2d> =>
  quarterTurnSplit(a0, a1, (from, to) => arcSegment(center, rho, from, to))

// The circular segment's construction on the unit circle, carried through
// the ellipse's affine frame. Affine maps act on a rational Bézier through
// its projected control points with the weights unchanged, so the segment
// stays exact.
const ellipseSegment = (
  f: Frame,
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

  const p0 = framePoint(f, x0, y0)
  const p1 = framePoint(f, (x0 + 2 * xm) / denominator, (y0 + 2 * ym) / denominator)
  const p2 = framePoint(f, (x1 + 2 * xm) / denominator, (y1 + 2 * ym) / denominator)
  const p3 = framePoint(f, x1, y1)

  return RationalCubicCurve2d.fromBezierPoints(
    Vector2.makeWeighted(p0.x, p0.y, 1),
    Vector2.makeWeighted(p1.x, p1.y, denominator / 3),
    Vector2.makeWeighted(p2.x, p2.y, denominator / 3),
    Vector2.makeWeighted(p3.x, p3.y, 1),
  )
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
export const toPath = (a: Arc): RationalCubicPath2d.RationalCubicPath2d => {
  const a1 = a.startAngle + a.sweep
  if (a.kind === 'circular') {
    return RationalCubicPath2d.fromArray(arcSegments(a.center, a.radius, a.startAngle, a1))
  }
  const f = frameOf(a)
  return RationalCubicPath2d.fromArray(
    quarterTurnSplit(a.startAngle, a1, (from, to) => ellipseSegment(f, from, to)),
  )
}

const circularPathData = (a: Circular): string => {
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

// SVG renders an A command with a zero radius as a straight line between
// its endpoints, which skips where a flat ellipse turns back. The flat
// ellipse is a segment traced back and forth, reversing where the zero
// radius's own trig term peaks: sin a = 0 when radiusY is 0, cos a = 0 when
// radiusX is 0. Lines through every reversal inside the sweep trace it.
const flatPathData = (e: Elliptical, f: Frame, sweep: number, start: Vector2.Vector2): string => {
  const phase = e.radiusY === 0 ? 0 : QUARTER_TURN
  const a1 = e.startAngle + sweep
  const step = sweep > 0 ? HALF_TURN : -HALF_TURN
  const first =
    sweep > 0
      ? Math.floor((e.startAngle - phase) / HALF_TURN) * HALF_TURN + phase + HALF_TURN
      : Math.ceil((e.startAngle - phase) / HALF_TURN) * HALF_TURN + phase - HALF_TURN
  let out = `M ${start.x},${start.y}`
  for (let a = first; sweep > 0 ? a < a1 : a > a1; a += step) {
    const p = ellipsePointAt(f, a)
    out += ` L ${p.x},${p.y}`
  }
  const end = ellipsePointAt(f, a1)
  return `${out} L ${end.x},${end.y}`
}

const ellipticalPathData = (e: Elliptical): string => {
  if (e.radiusX === 0 && e.radiusY === 0) {
    return `M ${e.center.x},${e.center.y}`
  }

  const f = frameOf(e)
  const start = ellipsePointAt(f, e.startAngle)

  if (e.sweep === 0) {
    return `M ${start.x},${start.y}`
  }

  const sweep = clampSweep(e.sweep, FULL_TURN)

  if (e.radiusX === 0 || e.radiusY === 0) {
    return flatPathData(e, f, sweep, start)
  }

  const closesExactly = isFullTurn(e.sweep, FULL_TURN)
  const count = Math.max(1, Math.ceil(Math.abs(sweep) / HALF_TURN - EPSILON))
  const flag = sweep > 0 ? 1 : 0
  const degrees = (e.rotation * 180) / Math.PI

  let out = `M ${start.x},${start.y}`
  for (let k = 1; k <= count; k++) {
    const point =
      k === count && closesExactly
        ? start
        : ellipsePointAt(f, k === count ? e.startAngle + sweep : e.startAngle + k * (sweep / count))
    out += ` A ${e.radiusX} ${e.radiusY} ${degrees} 0 ${flag} ${point.x},${point.y}`
  }
  return out
}

/** @internal */
export const toPathData = (a: Arc): string =>
  a.kind === 'circular' ? circularPathData(a) : ellipticalPathData(a)
