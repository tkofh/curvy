import { arcCommands, arcSegments } from '../../arc/internal/arc.ts'
import type { Winding } from '../../coordinates/coordinateSystem.ts'
import { lineSegment } from '../../curve/internal/rationalCubic2d.ts'
import * as LinearCurve2d from '../../curve/linear2d.ts'
import type { Closed } from '../../interval/interval.ts'
import type * as Interval2d from '../../interval/interval2d.ts'
import * as interval2d from '../../interval/internal/interval2d.ts'
import { EPSILON, RELATIVE_TOLERANCE } from '../../number.ts'
import * as LinearPath2d from '../../path/linear2d.ts'
import * as RationalCubicPath2d from '../../path/rationalCubic2d.ts'
import * as Solution from '../../solution/solution.ts'
import type { Affine2d } from '../../transform/affine2d.ts'
import * as affine2d from '../../transform/internal/affine2d.ts'
import { dual } from '../../utils/function.ts'
import { invariant } from '../../utils/invariant.ts'
import { Value } from '../../utils/value.ts'
import * as Vector2 from '../../vector/vector2.ts'
import type { Polygon2d, Split } from '../polygon2d.ts'
import type { Convex } from './traits.ts'
import { PolygonTraits } from './traits.ts'

const Polygon2dTypeId = '~curvy/Polygon2d'

class Polygon2dImpl extends Value(Polygon2dTypeId) implements Polygon2d<unknown> {
  declare readonly [PolygonTraits]: unknown
  readonly vertices: ReadonlyArray<Vector2.Vector2>

  constructor(vertices: ReadonlyArray<Vector2.Vector2>) {
    super()
    this.vertices = vertices
  }

  [Symbol.iterator](): Iterator<Vector2.Vector2> {
    return this.vertices[Symbol.iterator]()
  }

  toString() {
    return `Polygon2d(${this.vertices.map((v) => `(${v.x}, ${v.y})`).join(', ')})`
  }
}

// Results built by an operation that guarantees convexity by construction
// (hull, clip, inset) skip the public validation and carry the brand.
const convex = (vertices: ReadonlyArray<Vector2.Vector2>): Polygon2d<Convex> =>
  new Polygon2dImpl(vertices) as Polygon2d<Convex>

/** @internal */
export const isPolygon2d = (p: unknown): p is Polygon2d =>
  typeof p === 'object' && p !== null && Polygon2dTypeId in p

/** @internal */
export const fromArray = (vertices: ReadonlyArray<Vector2.Vector2>): Polygon2d => {
  invariant(vertices.length >= 3, 'Polygon2d requires at least 3 vertices')
  for (const v of vertices) {
    invariant(
      Number.isFinite(v.x) && Number.isFinite(v.y),
      'Polygon2d requires finite vertex coordinates',
    )
  }
  return new Polygon2dImpl(vertices.slice())
}

/** @internal */
export const fromTuples = (tuples: ReadonlyArray<readonly [number, number]>): Polygon2d =>
  fromArray(tuples.map(([x, y]) => Vector2.make(x, y)))

/** @internal */
export const equals = dual<
  (b: Polygon2d) => (a: Polygon2d) => boolean,
  (a: Polygon2d, b: Polygon2d) => boolean
>(2, (a: Polygon2d, b: Polygon2d): boolean => {
  if (a.vertices.length !== b.vertices.length) {
    return false
  }
  for (let i = 0; i < a.vertices.length; i++) {
    if (!Vector2.equals(a.vertices[i]!, b.vertices[i]!)) {
      return false
    }
  }
  return true
})

// ---------------------------------------------------------------------------
// Tolerance helpers (PRECISION.md regime 3)
// ---------------------------------------------------------------------------

const coordinateMagnitude = (vertices: ReadonlyArray<Vector2.Vector2>): number => {
  let m = 0
  for (const v of vertices) {
    m = Math.max(m, Math.abs(v.x), Math.abs(v.y))
  }
  return m
}

// Sign of cross(e1, e2), or 0 when the cross product sits inside its own
// rounding noise. Each edge component is a difference of coordinates of size
// up to `magnitude`, so it carries absolute error on the order of an ulp of
// `magnitude`. The band covers that error scaled by the other edge, plus the
// products' own rounding.
const turnSign = (
  e1x: number,
  e1y: number,
  e2x: number,
  e2y: number,
  magnitude: number,
): -1 | 0 | 1 => {
  const a = e1x * e2y
  const b = e1y * e2x
  const cross = a - b
  const scale =
    Math.abs(a) +
    Math.abs(b) +
    magnitude * (Math.abs(e1x) + Math.abs(e1y) + Math.abs(e2x) + Math.abs(e2y))
  if (Math.abs(cross) <= RELATIVE_TOLERANCE * scale) {
    return 0
  }
  return cross > 0 ? 1 : -1
}

// Twice the signed area by the shoelace formula, on coordinates taken
// relative to the first vertex so a polygon far from the origin doesn't
// cancel large products, together with the noise scale of that sum.
const doubledArea = (
  vertices: ReadonlyArray<Vector2.Vector2>,
): { readonly sum: number; readonly scale: number } => {
  const p0 = vertices[0]!
  const m = coordinateMagnitude(vertices)
  let sum = 0
  let scale = 0
  for (let i = 1; i < vertices.length - 1; i++) {
    const q1x = vertices[i]!.x - p0.x
    const q1y = vertices[i]!.y - p0.y
    const q2x = vertices[i + 1]!.x - p0.x
    const q2y = vertices[i + 1]!.y - p0.y
    const a = q1x * q2y
    const b = q1y * q2x
    sum += a - b
    scale +=
      Math.abs(a) +
      Math.abs(b) +
      m * (Math.abs(q1x) + Math.abs(q1y) + Math.abs(q2x) + Math.abs(q2y))
  }
  return { sum, scale }
}

const isDegenerate = (area: { readonly sum: number; readonly scale: number }): boolean =>
  Math.abs(area.sum) <= RELATIVE_TOLERANCE * area.scale

// ---------------------------------------------------------------------------
// Measures
// ---------------------------------------------------------------------------

/** @internal */
export const signedArea = (p: Polygon2d): number => doubledArea(p.vertices).sum / 2

/** @internal */
export const area = (p: Polygon2d): number => Math.abs(signedArea(p))

/** @internal */
export const winding = (p: Polygon2d): Solution.AtMostOne<Winding> => {
  const doubled = doubledArea(p.vertices)
  if (isDegenerate(doubled)) {
    return Solution.none
  }
  // Positive shoelace area means the vertices rotate +x toward +y, which is
  // `Winding`'s 'clockwise' (on screen, with the SVG y axis pointing down).
  return Solution.one(doubled.sum > 0 ? 'clockwise' : 'counterclockwise')
}

/** @internal */
export const perimeter = (p: Polygon2d): number => {
  const vs = p.vertices
  let total = 0
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]!
    const b = vs[(i + 1) % vs.length]!
    total += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

/** @internal */
export const centroid = (p: Polygon2d): Solution.AtMostOne<Vector2.Vector2> => {
  const vs = p.vertices
  const doubled = doubledArea(vs)
  if (isDegenerate(doubled)) {
    return Solution.none
  }
  const p0 = vs[0]!
  let cx = 0
  let cy = 0
  for (let i = 1; i < vs.length - 1; i++) {
    const q1x = vs[i]!.x - p0.x
    const q1y = vs[i]!.y - p0.y
    const q2x = vs[i + 1]!.x - p0.x
    const q2y = vs[i + 1]!.y - p0.y
    const cross = q1x * q2y - q1y * q2x
    cx += (q1x + q2x) * cross
    cy += (q1y + q2y) * cross
  }
  // 1 / (6 * area) with area = sum / 2.
  const k = 1 / (3 * doubled.sum)
  return Solution.one(Vector2.make(p0.x + cx * k, p0.y + cy * k))
}

/** @internal */
export const boundingBox = (p: Polygon2d): Interval2d.Interval2d<Closed, Closed> =>
  interval2d.fromVectors(p.vertices)

// ---------------------------------------------------------------------------
// Convexity
// ---------------------------------------------------------------------------

// Drops each vertex that coincides with the one before it (cyclically), so
// every remaining edge has a direction.
const withoutRepeats = (vertices: ReadonlyArray<Vector2.Vector2>): Array<Vector2.Vector2> => {
  const out: Array<Vector2.Vector2> = []
  for (const v of vertices) {
    if (out.length === 0 || !Vector2.equals(out[out.length - 1]!, v)) {
      out.push(v)
    }
  }
  while (out.length > 1 && Vector2.equals(out[out.length - 1]!, out[0]!)) {
    out.pop()
  }
  return out
}

/** @internal */
export const isConvex = <T>(p: Polygon2d<T>): p is Polygon2d<T & Convex> => {
  if (isDegenerate(doubledArea(p.vertices))) {
    return false
  }
  const vs = withoutRepeats(p.vertices)
  const n = vs.length
  if (n < 3) {
    return false
  }
  const m = coordinateMagnitude(vs)
  let sign = 0
  let turning = 0
  for (let i = 0; i < n; i++) {
    const prev = vs[(i + n - 1) % n]!
    const v = vs[i]!
    const next = vs[(i + 1) % n]!
    const e1x = v.x - prev.x
    const e1y = v.y - prev.y
    const e2x = next.x - v.x
    const e2y = next.y - v.y
    const dot = e1x * e2x + e1y * e2y
    const s = turnSign(e1x, e1y, e2x, e2y, m)
    if (s === 0) {
      // Straight through is fine. Doubling back along the same line is a
      // spike, never part of a convex outline.
      if (dot < 0) {
        return false
      }
      continue
    }
    if (sign === 0) {
      sign = s
    } else if (s !== sign) {
      return false
    }
    turning += Math.atan2(e1x * e2y - e1y * e2x, dot)
  }
  // Corners that all turn one way can still wind twice (a pentagram turns
  // through 4 * pi). A simple convex outline turns through exactly 2 * pi.
  return Math.abs(turning) < 3 * Math.PI
}

/** @internal */
export const asConvex = <T>(p: Polygon2d<T>): Polygon2d<T & Convex> => {
  invariant(isConvex(p), 'polygon is not convex')
  return p
}

/** @internal */
export const convexHull = (
  points: ReadonlyArray<Vector2.Vector2>,
): Solution.AtMostOne<Polygon2d<Convex>> => {
  // Andrew's monotone chain. Popping on turns that aren't strictly positive
  // drops collinear and repeated points, and leaves the hull rotating +x
  // toward +y.
  const sorted = points.toSorted((a, b) => a.x - b.x || a.y - b.y)
  const m = coordinateMagnitude(sorted)

  const chain = (ordered: ReadonlyArray<Vector2.Vector2>): Array<Vector2.Vector2> => {
    const out: Array<Vector2.Vector2> = []
    for (const p of ordered) {
      while (out.length >= 2) {
        const a = out[out.length - 2]!
        const b = out[out.length - 1]!
        if (turnSign(b.x - a.x, b.y - a.y, p.x - b.x, p.y - b.y, m) > 0) {
          break
        }
        out.pop()
      }
      out.push(p)
    }
    return out
  }

  const lower = chain(sorted)
  const upper = chain(sorted.toReversed())
  const hull = [...lower.slice(0, -1), ...upper.slice(0, -1)]
  if (hull.length < 3 || isDegenerate(doubledArea(hull))) {
    return Solution.none
  }
  return Solution.one(convex(hull))
}

// ---------------------------------------------------------------------------
// Half-plane clipping (Sutherland–Hodgman, one plane at a time)
// ---------------------------------------------------------------------------

interface Cut {
  readonly distances: ReadonlyArray<number>
  readonly sides: ReadonlyArray<-1 | 0 | 1>
  readonly hasFront: boolean
  readonly hasBack: boolean
}

// Signed distances of every vertex from the line through (ox, oy) with unit
// normal (nx, ny), and which side each vertex falls on. A vertex within the
// point-identity band of the line (PRECISION.md regime 2) counts as on it.
const cut = (
  vertices: ReadonlyArray<Vector2.Vector2>,
  ox: number,
  oy: number,
  nx: number,
  ny: number,
): Cut => {
  const tolerance =
    EPSILON +
    RELATIVE_TOLERANCE * Math.max(coordinateMagnitude(vertices), Math.abs(ox), Math.abs(oy))
  const distances: Array<number> = []
  const sides: Array<-1 | 0 | 1> = []
  let hasFront = false
  let hasBack = false
  for (const v of vertices) {
    const d = (v.x - ox) * nx + (v.y - oy) * ny
    distances.push(d)
    if (d > tolerance) {
      sides.push(1)
      hasFront = true
    } else if (d < -tolerance) {
      sides.push(-1)
      hasBack = true
    } else {
      sides.push(0)
    }
  }
  return { distances, sides, hasFront, hasBack }
}

// The part of a convex polygon on side `keep` of a cut that crosses it.
// Vertices on the line stay as they are. Each edge that crosses from one
// strict side to the other gains its intersection point.
const piece = (
  vertices: ReadonlyArray<Vector2.Vector2>,
  c: Cut,
  keep: -1 | 1,
): Solution.AtMostOne<Polygon2d<Convex>> => {
  const n = vertices.length
  const out: Array<Vector2.Vector2> = []
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const si = c.sides[i]!
    const sj = c.sides[j]!
    if (si === keep || si === 0) {
      out.push(vertices[i]!)
    }
    if (si * sj === -1) {
      const a = vertices[i]!
      const b = vertices[j]!
      const t = c.distances[i]! / (c.distances[i]! - c.distances[j]!)
      out.push(Vector2.make(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t))
    }
  }
  if (out.length < 3 || isDegenerate(doubledArea(out))) {
    return Solution.none
  }
  return Solution.one(convex(out))
}

const unitNormal = (label: string, origin: Vector2.Vector2, normal: Vector2.Vector2) => {
  invariant(
    Number.isFinite(origin.x) && Number.isFinite(origin.y),
    `${label} requires a finite origin`,
  )
  const length = Math.hypot(normal.x, normal.y)
  invariant(Number.isFinite(length) && length > 0, `${label} requires a non-zero finite normal`)
  return { nx: normal.x / length, ny: normal.y / length }
}

/** @internal */
export const clip = dual<
  (
    origin: Vector2.Vector2,
    normal: Vector2.Vector2,
  ) => (p: Polygon2d<Convex>) => Solution.AtMostOne<Polygon2d<Convex>>,
  (
    p: Polygon2d<Convex>,
    origin: Vector2.Vector2,
    normal: Vector2.Vector2,
  ) => Solution.AtMostOne<Polygon2d<Convex>>
>(3, (p: Polygon2d<Convex>, origin: Vector2.Vector2, normal: Vector2.Vector2) => {
  const { nx, ny } = unitNormal('clip', origin, normal)
  const c = cut(p.vertices, origin.x, origin.y, nx, ny)
  if (!c.hasFront) {
    return Solution.none
  }
  if (!c.hasBack) {
    return Solution.one(p)
  }
  return piece(p.vertices, c, 1)
})

/** @internal */
export const split = dual<
  (origin: Vector2.Vector2, normal: Vector2.Vector2) => (p: Polygon2d<Convex>) => Split,
  (p: Polygon2d<Convex>, origin: Vector2.Vector2, normal: Vector2.Vector2) => Split
>(3, (p: Polygon2d<Convex>, origin: Vector2.Vector2, normal: Vector2.Vector2): Split => {
  const { nx, ny } = unitNormal('split', origin, normal)
  const c = cut(p.vertices, origin.x, origin.y, nx, ny)
  if (!c.hasBack) {
    return { front: c.hasFront ? Solution.one(p) : Solution.none, back: Solution.none }
  }
  if (!c.hasFront) {
    return { front: Solution.none, back: Solution.one(p) }
  }
  return { front: piece(p.vertices, c, 1), back: piece(p.vertices, c, -1) }
})

/** @internal */
export const inset = dual<
  (distance: number) => (p: Polygon2d<Convex>) => Solution.AtMostOne<Polygon2d<Convex>>,
  (p: Polygon2d<Convex>, distance: number) => Solution.AtMostOne<Polygon2d<Convex>>
>(2, (p: Polygon2d<Convex>, distance: number): Solution.AtMostOne<Polygon2d<Convex>> => {
  invariant(
    Number.isFinite(distance) && distance >= 0,
    'inset requires a finite, non-negative distance',
  )
  if (distance === 0) {
    return Solution.one(p)
  }
  // A convex polygon is the intersection of the inner half-planes of its
  // edges, so its inset is the intersection of those half-planes pushed
  // inward by `distance`. Clipping by each in turn removes edges that
  // collapse, and leaves nothing once the inset passes the inradius.
  const vs = p.vertices
  const orientation = doubledArea(vs).sum > 0 ? 1 : -1
  let current: ReadonlyArray<Vector2.Vector2> = vs
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i]!
    const b = vs[(i + 1) % vs.length]!
    if (Vector2.equals(a, b)) {
      continue
    }
    const length = Math.hypot(b.x - a.x, b.y - a.y)
    // Left of the edge is inside for a polygon rotating +x toward +y.
    const nx = (-(b.y - a.y) / length) * orientation
    const ny = ((b.x - a.x) / length) * orientation
    const c = cut(current, a.x + nx * distance, a.y + ny * distance, nx, ny)
    if (!c.hasFront) {
      return Solution.none
    }
    if (c.hasBack) {
      const next = piece(current, c, 1)
      if (Solution.isNone(next)) {
        return Solution.none
      }
      current = next.value.vertices
    }
  }
  return Solution.one(convex(current))
})

// ---------------------------------------------------------------------------
// Transforms and output
// ---------------------------------------------------------------------------

/** @internal */
export const reverse = <T>(p: Polygon2d<T>): Polygon2d<T> =>
  new Polygon2dImpl(p.vertices.toReversed()) as Polygon2d<T>

/** @internal */
export const transform = dual<
  (a: Affine2d) => (p: Polygon2d) => Polygon2d,
  (p: Polygon2d, a: Affine2d) => Polygon2d
>(
  2,
  (p: Polygon2d, a: Affine2d): Polygon2d =>
    new Polygon2dImpl(p.vertices.map((v) => affine2d.apply(a, v))),
)

/** @internal */
export const toPath = (p: Polygon2d): LinearPath2d.LinearPath2d => {
  const vs = p.vertices
  return LinearPath2d.fromArray(
    vs.map((v, i) => LinearCurve2d.fromEndpoints(v, vs[(i + 1) % vs.length]!)),
  )
}

/** @internal */
export const toPathData = (p: Polygon2d): string => {
  const [first, ...rest] = p.vertices
  let out = `M ${first!.x},${first!.y}`
  for (const v of rest) {
    out += ` L ${v.x},${v.y}`
  }
  return `${out} Z`
}

// ---------------------------------------------------------------------------
// Rounded corners
// ---------------------------------------------------------------------------

interface Corner {
  // Where the outline arrives at the corner and leaves it. Both are the
  // vertex itself when the corner stays sharp.
  readonly entry: Vector2.Vector2
  readonly exit: Vector2.Vector2
  // The fillet arc, absent for a sharp corner.
  readonly arc?: {
    readonly center: Vector2.Vector2
    readonly radius: number
    readonly startAngle: number
    readonly sweep: number
  }
}

const radiusAt = (
  label: string,
  radius: number | ReadonlyArray<number>,
  count: number,
): ((i: number) => number) => {
  const check = (r: number) =>
    invariant(Number.isFinite(r) && r >= 0, `${label} requires finite, non-negative radii`)
  if (typeof radius === 'number') {
    check(radius)
    return () => radius
  }
  invariant(radius.length === count, `${label} requires one radius per vertex`)
  radius.forEach(check)
  return (i) => radius[i]!
}

// The circular fillet of radius r tangent to both edges at each vertex. The
// tangent points sit r / tan(theta / 2) from the vertex, theta being the
// angle between the edges. That distance is capped at half of each adjacent
// edge so neighboring fillets never overlap, and the radius shrinks to fit.
const corners = (
  label: string,
  p: Polygon2d,
  radius: number | ReadonlyArray<number>,
): Array<Corner> => {
  const vs = p.vertices
  const n = vs.length
  const radiusOf = radiusAt(label, radius, n)
  const m = coordinateMagnitude(vs)
  const out: Array<Corner> = []
  for (let i = 0; i < n; i++) {
    const prev = vs[(i + n - 1) % n]!
    const v = vs[i]!
    const next = vs[(i + 1) % n]!
    const ax = prev.x - v.x
    const ay = prev.y - v.y
    const bx = next.x - v.x
    const by = next.y - v.y
    const r = radiusOf(i)
    // Sharp when there is nothing to round: no radius, a repeated vertex, or
    // edges that continue straight through (or fold straight back).
    if (
      r === 0 ||
      Vector2.equals(prev, v) ||
      Vector2.equals(next, v) ||
      turnSign(-ax, -ay, bx, by, m) === 0
    ) {
      out.push({ entry: v, exit: v })
      continue
    }
    const la = Math.hypot(ax, ay)
    const lb = Math.hypot(bx, by)
    const ux = ax / la
    const uy = ay / la
    const wx = bx / lb
    const wy = by / lb
    const cross = ux * wy - uy * wx
    const dot = ux * wx + uy * wy
    const sinTheta = Math.abs(cross)
    // tan(theta / 2) = sin(theta) / (1 + cos(theta))
    let t = (r * (1 + dot)) / sinTheta
    let fit = r
    const limit = Math.min(la, lb) / 2
    if (t > limit) {
      t = limit
      fit = (t * sinTheta) / (1 + dot)
    }
    const entry = Vector2.make(v.x + ux * t, v.y + uy * t)
    const exit = Vector2.make(v.x + wx * t, v.y + wy * t)
    // The center sits one radius from the entry point, perpendicular to the
    // incoming edge, on the side the outgoing edge leaves toward.
    const side = cross > 0 ? 1 : -1
    const center = Vector2.make(entry.x - uy * fit * side, entry.y + ux * fit * side)
    // The outline turns opposite to the sign of cross(u, w), through
    // pi - theta.
    const sweep = -side * (Math.PI - Math.atan2(sinTheta, dot))
    const startAngle = Math.atan2(entry.y - center.y, entry.x - center.x)
    out.push({ entry, exit, arc: { center, radius: fit, startAngle, sweep } })
  }
  return out
}

/** @internal */
export const rounded = dual<
  (
    radius: number | ReadonlyArray<number>,
  ) => (p: Polygon2d) => RationalCubicPath2d.RationalCubicPath2d,
  (p: Polygon2d, radius: number | ReadonlyArray<number>) => RationalCubicPath2d.RationalCubicPath2d
>(2, (p: Polygon2d, radius: number | ReadonlyArray<number>) => {
  const cs = corners('rounded', p, radius)
  const segments = []
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]!
    if (c.arc !== undefined) {
      const { center, radius: r, startAngle, sweep } = c.arc
      segments.push(...arcSegments(center, r, startAngle, startAngle + sweep))
    }
    const next = cs[(i + 1) % cs.length]!
    if (!Vector2.equals(c.exit, next.entry)) {
      segments.push(lineSegment(c.exit, next.entry))
    }
  }
  if (segments.length === 0) {
    // Every vertex coincides: the outline is a single point.
    const v = p.vertices[0]!
    segments.push(lineSegment(v, v))
  }
  return RationalCubicPath2d.fromArray(segments)
})

/** @internal */
export const roundedPathData = dual<
  (radius: number | ReadonlyArray<number>) => (p: Polygon2d) => string,
  (p: Polygon2d, radius: number | ReadonlyArray<number>) => string
>(2, (p: Polygon2d, radius: number | ReadonlyArray<number>): string => {
  const cs = corners('roundedPathData', p, radius)
  let out = `M ${cs[0]!.entry.x},${cs[0]!.entry.y}`
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i]!
    if (c.arc !== undefined) {
      out += arcCommands(c.arc.center, c.arc.radius, c.arc.startAngle, c.arc.sweep, c.exit)
    }
    const next = cs[i + 1]
    if (next !== undefined && !Vector2.equals(c.exit, next.entry)) {
      out += ` L ${next.entry.x},${next.entry.y}`
    }
  }
  return `${out} Z`
})
