import * as Characteristic from '../characteristic/characteristic.ts'
import * as CubicCurve2d from '../curve/cubic2d.ts'
import * as certified from '../curve/rationalCubic2d.internal.ts'
import * as RationalCubicCurve2d from '../curve/rationalCubic2d.ts'
import type { Bounds } from '../interval/interval.ts'
import * as Interval from '../interval/interval.ts'
import * as Interval2d from '../interval/interval2d.ts'
import { EPSILON, coincident, minMax } from '../number.ts'
import * as CubicPath2d from '../path/cubic2d.ts'
import * as RationalCubicPath2d from '../path/rationalCubic2d.ts'
import * as CubicPolynomial from '../polynomial/cubic.ts'
import { Pipeable, dual, invariant } from '../utils.ts'
import * as Vector2 from '../vector/vector2.ts'
import * as Vector4 from '../vector/vector4.ts'
import type {
  Cartesian,
  CoordinateSystem,
  Polar,
  PolarConfig,
  Winding,
} from './coordinateSystem.ts'
import * as dimension from './dimension.internal.ts'
import type { Cyclical, Linear } from './dimension.ts'

export const CoordinateSystemTypeId: unique symbol = Symbol.for(
  'curvy/coordinates/coordinateSystem',
)
export type CoordinateSystemTypeId = typeof CoordinateSystemTypeId

abstract class CoordinateSystemImpl extends Pipeable {
  readonly [CoordinateSystemTypeId]: CoordinateSystemTypeId = CoordinateSystemTypeId

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
  readonly thetaOrigin: number

  constructor(
    center: Vector2.Vector2,
    theta: Cyclical,
    winding: Winding,
    radius: Linear,
    thetaOrigin: number,
  ) {
    super()

    invariant(Number.isFinite(thetaOrigin), 'Polar thetaOrigin must be finite')

    this.center = center
    this.theta = theta
    this.winding = winding
    this.radius = radius
    this.thetaOrigin = thetaOrigin
  }

  get [Symbol.toStringTag]() {
    return `CoordinateSystem.Polar(center (${this.center.x}, ${this.center.y}), period ${this.theta.period}, origin ${this.thetaOrigin}, ${this.winding})`
  }
}

/** @internal */
export const isCoordinateSystem = (v: unknown): v is CoordinateSystem =>
  typeof v === 'object' && v !== null && CoordinateSystemTypeId in v

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
    config?.thetaOrigin ?? 0,
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
      coincident(a.thetaOrigin, b.thetaOrigin) &&
      dimension.equals(a.theta, b.theta) &&
      dimension.equals(a.radius, b.radius),
)

const windingSign = (w: Winding): 1 | -1 => (w === 'clockwise' ? 1 : -1)

// Chart angle -> mapped angle in radians, positive rotating +x toward +y.
// thetaOrigin anchors chart zero on screen independent of winding, so it
// adds before the winding sign is applied to the chart angle.
const mapTheta = (s: Polar, theta: number): number =>
  (s.thetaOrigin + windingSign(s.winding) * theta) * ((2 * Math.PI) / s.theta.period)

// Chart sweep -> mapped sweep in radians. Sweeps are differences of mapped
// angles, so the origin cancels and only the winding sign applies.
const mapSweep = (s: Polar, sweep: number): number =>
  windingSign(s.winding) * sweep * ((2 * Math.PI) / s.theta.period)

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
    windingSign(s.winding) *
      (Math.atan2(dy, dx) * (s.theta.period / (2 * Math.PI)) - s.thetaOrigin),
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

// Closed-range check with coincident edges, so boundary verdicts stay
// invariant under uniform scaling of the data (the relative term carries
// large magnitudes; see PRECISION.md regime 2).
const containsCoordinate = (min: number, max: number, value: number): boolean =>
  (value >= min && value <= max) || coincident(value, min) || coincident(value, max)

/** @internal */
export const containsPoint = dual<
  (theta: Bounds, r: Bounds, point: Vector2.Vector2) => (s: CoordinateSystem) => boolean,
  (s: CoordinateSystem, theta: Bounds, r: Bounds, point: Vector2.Vector2) => boolean
>(4, (s: CoordinateSystem, theta: Bounds, r: Bounds, point: Vector2.Vector2): boolean => {
  assertFinite('containsPoint', theta.start, theta.end, r.start, r.end)

  if (s.kind === 'cartesian') {
    const [x0, x1] = minMax(theta.start, theta.end)
    const [y0, y1] = minMax(r.start, r.end)
    return containsCoordinate(x0, x1, point.x) && containsCoordinate(y0, y1, point.y)
  }

  const chart = fromCartesian(s, point)
  const [rMin, rMax] = minMax(r.start, r.end)
  if (!containsCoordinate(rMin, rMax, chart.y)) {
    return false
  }
  // At the exact center the angle is degenerate (atan2(0, 0) = 0); the
  // radial check alone decides, since the center belongs to a sector
  // exactly when the sector reaches mapped radius 0.
  if (point.x === s.center.x && point.y === s.center.y) {
    return true
  }
  return dimension.containsApprox(s.theta, theta, chart.x)
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

  const mappedSweep = mapSweep(s, sweep)
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
  const mappedSweep = mapSweep(s, sweep)

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

// --- image: certified approximation of an arbitrary chart path's image ---

const FULL_TURN = 2 * Math.PI

// The polar map's constants folded once per call: a(t) = a0 + a1 * theta(t)
// and rho(t) = m * r(t) + b. thetaOrigin contributes one constant rotation;
// winding and the angular unit fold into a1's sign and magnitude.
interface FoldedMap {
  readonly a0: number
  readonly a1: number
  readonly m: number
  readonly b: number
  readonly cx: number
  readonly cy: number
}

const foldMap = (s: Polar): FoldedMap => {
  const k = FULL_TURN / s.theta.period
  return {
    a0: k * s.thetaOrigin,
    a1: k * windingSign(s.winding),
    m: s.radius.scale,
    b: s.radius.offset,
    cx: s.center.x,
    cy: s.center.y,
  }
}

// Point and tangent of the composed image curve at parameter t, exact per
// sample: image(t) = center + rho(t) * (cos a(t), sin a(t)) and, by the
// product and chain rules,
// image'(t) = (rho'*cos a - rho*a'*sin a, rho'*sin a + rho*a'*cos a).
// Nothing in the image machinery divides, so there is no 0/0 to guard —
// a chart path crossing mapped radius 0 evaluates straight through the
// center (an analytic pass, not a parametrization cusp).
const imageEval = (f: FoldedMap, chart: CubicCurve2d.CubicCurve2d, t: number) => {
  const theta = chart.x.c0 + t * (chart.x.c1 + t * (chart.x.c2 + t * chart.x.c3))
  const r = chart.y.c0 + t * (chart.y.c1 + t * (chart.y.c2 + t * chart.y.c3))
  const dTheta = chart.x.c1 + t * (2 * chart.x.c2 + t * 3 * chart.x.c3)
  const dr = chart.y.c1 + t * (2 * chart.y.c2 + t * 3 * chart.y.c3)
  const a = f.a0 + f.a1 * theta
  const rho = f.m * r + f.b
  const cosA = Math.cos(a)
  const sinA = Math.sin(a)
  const dRho = f.m * dr
  const da = f.a1 * dTheta
  return {
    px: f.cx + rho * cosA,
    py: f.cy + rho * sinA,
    tx: dRho * cosA - rho * da * sinA,
    ty: dRho * sinA + rho * da * cosA,
  }
}

type ImageSample = ReturnType<typeof imageEval>

// Two-point Hermite candidate through exact endpoint samples. Velocities are
// used verbatim: recursion always operates on exactly-subdivided chart
// polynomials, whose coefficients already carry the local-parameter
// chain-rule factor (left'(u) = t * p'(t*u)), so no explicit width scaling
// appears here.
const hermiteCandidate = (start: ImageSample, end: ImageSample): CubicCurve2d.CubicCurve2d => {
  const [x, y] = Characteristic.apply(
    Characteristic.cubicHermite,
    Vector4.make(start.px, start.tx, end.px, end.tx),
    Vector4.make(start.py, start.ty, end.py, end.ty),
  )
  return CubicCurve2d.fromPolynomials(x, y)
}

const subdivideChart = (
  chart: CubicCurve2d.CubicCurve2d,
): [CubicCurve2d.CubicCurve2d, CubicCurve2d.CubicCurve2d] => {
  const [leftX, rightX] = CubicPolynomial.subdivide(chart.x, 0.5)
  const [leftY, rightY] = CubicPolynomial.subdivide(chart.y, 0.5)
  return [CubicCurve2d.fromPolynomials(leftX, leftY), CubicCurve2d.fromPolynomials(rightX, rightY)]
}

// Rigorous range of a cubic on [0, 1] from its Bernstein control values
// (convex-hull property). Deliberately looser than a root-based tight range:
// unconditionally conservative, and the slack vanishes under subdivision.
const bernsteinRange = (p: CubicPolynomial.CubicPolynomial): [number, number] => {
  const b0 = p.c0
  const b1 = p.c0 + p.c1 / 3
  const b2 = p.c0 + (2 * p.c1) / 3 + p.c2 / 3
  const b3 = p.c0 + p.c1 + p.c2 + p.c3
  return [Math.min(b0, b1, b2, b3), Math.max(b0, b1, b2, b3)]
}

// Whether phi + 2*pi*k lies in [aLo, aHi] for some integer k.
const containsAngleMultiple = (aLo: number, aHi: number, phi: number): boolean =>
  Math.ceil((aLo - phi) / FULL_TURN) * FULL_TURN + phi <= aHi

// Range of the product rho * u over rho in [rhoLo, rhoHi], u in [uLo, uHi]:
// a bilinear function on a rectangle attains its extrema at corners. This is
// what makes negative mapped radii free — corner products cover the
// reflected lobe with no special case.
const productRange = (rhoLo: number, rhoHi: number, uLo: number, uHi: number): [number, number] => {
  const p1 = rhoLo * uLo
  const p2 = rhoLo * uHi
  const p3 = rhoHi * uLo
  const p4 = rhoHi * uHi
  return [Math.min(p1, p2, p3, p4), Math.max(p1, p2, p3, p4)]
}

// Rigorous cartesian AABB of a chart piece's image: Bernstein hulls bound the
// chart coordinates, the affine maps carry those to sorted angle and radius
// intervals, and the image then lies in the annular patch
// { center + rho * (cos a, sin a) : a in aInterval, rho in rhoInterval }.
// The trig ranges over the angle interval are exact (endpoint values, plus
// saturation at any contained multiple of pi/2), so the returned box is the
// exact AABB of the patch; the only conservatism is patch-over-curve, which
// subdivision shrinks at O(piece width).
const patchBox = (
  f: FoldedMap,
  chart: CubicCurve2d.CubicCurve2d,
): Interval2d.Interval2d<Interval.Closed, Interval.Closed> => {
  const [thetaLo, thetaHi] = bernsteinRange(chart.x)
  const [rLo, rHi] = bernsteinRange(chart.y)

  const aA = f.a0 + f.a1 * thetaLo
  const aB = f.a0 + f.a1 * thetaHi
  const aLo = Math.min(aA, aB)
  const aHi = Math.max(aA, aB)
  const rhoA = f.m * rLo + f.b
  const rhoB = f.m * rHi + f.b
  const rhoLo = Math.min(rhoA, rhoB)
  const rhoHi = Math.max(rhoA, rhoB)

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
    cosLo = containsAngleMultiple(aLo, aHi, Math.PI) ? -1 : Math.min(cosStart, cosEnd)
    cosHi = containsAngleMultiple(aLo, aHi, 0) ? 1 : Math.max(cosStart, cosEnd)
    sinLo = containsAngleMultiple(aLo, aHi, -QUARTER_TURN) ? -1 : Math.min(sinStart, sinEnd)
    sinHi = containsAngleMultiple(aLo, aHi, QUARTER_TURN) ? 1 : Math.max(sinStart, sinEnd)
  }

  const [xLo, xHi] = productRange(rhoLo, rhoHi, cosLo, cosHi)
  const [yLo, yHi] = productRange(rhoLo, rhoHi, sinLo, sinHi)
  return Interval2d.make(
    Interval.fromMinMax(f.cx + xLo, f.cx + xHi),
    Interval.fromMinMax(f.cy + yLo, f.cy + yHi),
  )
}

// CertifiedPiece provider for the true image of a chart piece: patchBox is
// the rigorous enclosure, the witness is the exact image of the chart
// midpoint (a point ON the curve, which the one-sided walker's triangle
// bound requires), and bisection is exact polynomial subdivision.
const imagePiece = (
  f: FoldedMap,
  chart: CubicCurve2d.CubicCurve2d,
  depth: number,
): certified.CertifiedPiece => {
  const witness = imageEval(f, chart, 0.5)
  return {
    box: patchBox(f, chart),
    witnessX: witness.px,
    witnessY: witness.py,
    depth,
    subdivide: () => {
      const [left, right] = subdivideChart(chart)
      return [imagePiece(f, left, depth + 1), imagePiece(f, right, depth + 1)]
    },
  }
}

// Certified symmetric Hausdorff check between the true image of a chart
// piece and a polynomial cubic candidate — the same two one-sided walks the
// rational approximation runs, with imagePiece supplying the enclosures.
const imageWithinTolerance = (
  f: FoldedMap,
  chart: CubicCurve2d.CubicCurve2d,
  candidate: CubicCurve2d.CubicCurve2d,
  tolerance: number,
): boolean => {
  const candidateBox = CubicCurve2d.boundingBox(candidate)
  if (
    !certified.oneSidedWithinTolerance(
      imagePiece(f, chart, 0),
      candidateBox,
      (qx, qy) =>
        certified.closestSquaredDistance((s) => certified.polynomialEval(candidate, s), qx, qy),
      tolerance,
    )
  ) {
    return false
  }
  return certified.oneSidedWithinTolerance(
    certified.polynomialPiece(candidate),
    patchBox(f, chart),
    (qx, qy) => certified.closestSquaredDistance((s) => imageEval(f, chart, s), qx, qy),
    tolerance,
  )
}

// A mapped sweep at or under a quarter turn keeps the annular enclosure
// tight and the closest-point search unimodal enough for its fixed sampling;
// the EPSILON guard keeps unit conversion from splitting an exact quarter
// turn that lands an ulp high.
const SWEEP_GATE = QUARTER_TURN * (1 + EPSILON)

interface SharedPoint {
  readonly px: number
  readonly py: number
}

const imageSegment = (
  f: FoldedMap,
  segment: CubicCurve2d.CubicCurve2d,
  tolerance: number,
  out: Array<CubicCurve2d.CubicCurve2d>,
): void => {
  // Endpoint POSITIONS are shared down the recursion so the output closes
  // bitwise at every breakpoint within a segment. Tangents are never shared:
  // a tangent is only valid in its own piece's local parameterization (each
  // halving halves the true local tangent), so every piece evaluates its own
  // endpoint tangents on its exactly-subdivided polynomials, where the
  // chain-rule factor is already baked into the coefficients.
  const recurse = (
    chart: CubicCurve2d.CubicCurve2d,
    startPoint: SharedPoint,
    endPoint: SharedPoint,
    depth: number,
  ): void => {
    const split = (): void => {
      const [left, right] = subdivideChart(chart)
      const mid = imageEval(f, left, 1)
      recurse(left, startPoint, mid, depth + 1)
      recurse(right, mid, endPoint, depth + 1)
    }

    if (depth < certified.MAX_APPROX_DEPTH) {
      // Adaptive conditioning gate: pre-split pieces whose mapped sweep can
      // exceed a quarter turn (Bernstein bound), spending certification
      // only where it can plausibly succeed.
      const [thetaLo, thetaHi] = bernsteinRange(chart.x)
      if (Math.abs(f.a1) * (thetaHi - thetaLo) > SWEEP_GATE) {
        split()
        return
      }
    }

    const start = imageEval(f, chart, 0)
    const end = imageEval(f, chart, 1)
    const candidate = hermiteCandidate(
      { px: startPoint.px, py: startPoint.py, tx: start.tx, ty: start.ty },
      { px: endPoint.px, py: endPoint.py, tx: end.tx, ty: end.ty },
    )
    if (
      depth >= certified.MAX_APPROX_DEPTH ||
      imageWithinTolerance(f, chart, candidate, tolerance)
    ) {
      out.push(candidate)
      return
    }
    split()
  }

  recurse(segment, imageEval(f, segment, 0), imageEval(f, segment, 1), 0)
}

/** @internal */
export const image = dual<
  (
    path: CubicPath2d.CubicPath2d,
    tolerance: number,
  ) => (s: CoordinateSystem) => CubicPath2d.CubicPath2d,
  (s: CoordinateSystem, path: CubicPath2d.CubicPath2d, tolerance: number) => CubicPath2d.CubicPath2d
>(3, (s: CoordinateSystem, path: CubicPath2d.CubicPath2d, tolerance: number) => {
  invariant(Number.isFinite(tolerance) && tolerance > 0, 'image: tolerance must be finite and > 0')

  if (s.kind === 'cartesian') {
    return path
  }

  const f = foldMap(s)
  const out: Array<CubicCurve2d.CubicCurve2d> = []
  for (const segment of path) {
    imageSegment(f, segment, tolerance, out)
  }
  return CubicPath2d.fromArray(out)
})
