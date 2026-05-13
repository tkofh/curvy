import * as CubicCurve2d from '../curve/cubic2d'
import * as CubicPath2d from '../path/cubic2d'
import { dual, invariant, Pipeable } from '../utils'
import * as Vector2 from '../vector/vector2'
import type { Bezier2d } from './bezier2d'
import * as bezierInternal from './bezier2d.internal'
import type { Cardinal2d, Options } from './cardinal2d'
import { toPointQuads } from './util'

export const Cardinal2dTypeId: unique symbol = Symbol.for('curvy/splines/cardinal2d')
export type Cardinal2dTypeId = typeof Cardinal2dTypeId

const DEFAULT_TENSION = 0.5
const DEFAULT_ALPHA = 0.5

export class Cardinal2dImpl extends Pipeable implements Cardinal2d {
  readonly [Cardinal2dTypeId]: Cardinal2dTypeId = Cardinal2dTypeId

  readonly points: ReadonlyArray<Vector2.Vector2>
  readonly tension: number
  readonly alpha: number

  constructor(points: ReadonlyArray<Vector2.Vector2>, tension: number, alpha: number) {
    invariant(points.length >= 2, 'cardinal splines requires 2 or more points')
    super()
    this.points = points
    this.tension = tension
    this.alpha = alpha
  }

  [Symbol.iterator]() {
    return this.points[Symbol.iterator]()
  }
}

export const isCardinal2d = (p: unknown): p is Cardinal2d =>
  typeof p === 'object' && p !== null && Cardinal2dTypeId in p

const resolveOptions = (options?: Options): { tension: number; alpha: number } => ({
  tension: options?.tension ?? DEFAULT_TENSION,
  alpha: options?.alpha ?? DEFAULT_ALPHA,
})

// Overload: `make(options, p0, p1, ...points)` vs `make(p0, p1, ...points)`.
// First-arg-is-Vector2 ⇒ no options, defaults apply.
export const make = (
  ...args:
    | [Vector2.Vector2, Vector2.Vector2, ...Array<Vector2.Vector2>]
    | [Options, Vector2.Vector2, Vector2.Vector2, ...Array<Vector2.Vector2>]
): Cardinal2d => {
  if (Vector2.isVector2(args[0])) {
    return new Cardinal2dImpl(
      args as ReadonlyArray<Vector2.Vector2>,
      DEFAULT_TENSION,
      DEFAULT_ALPHA,
    )
  }
  const [options, ...points] = args as [Options, ...Array<Vector2.Vector2>]
  const { tension, alpha } = resolveOptions(options)
  return new Cardinal2dImpl(points, tension, alpha)
}

export const fromArray = (
  points: ReadonlyArray<Vector2.Vector2>,
  options?: Options,
): Cardinal2d => {
  const { tension, alpha } = resolveOptions(options)
  return new Cardinal2dImpl(points, tension, alpha)
}

export const fromTuples = (
  tuples: ReadonlyArray<readonly [number, number]>,
  options?: Options,
): Cardinal2d => {
  const { tension, alpha } = resolveOptions(options)
  return new Cardinal2dImpl(
    tuples.map(([x, y]) => Vector2.make(x, y)),
    tension,
    alpha,
  )
}

export const append = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) => Cardinal2d
>(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) =>
    new Cardinal2dImpl([...p, ...points], p.tension, p.alpha),
)

export const prepend = dual<
  (...points: ReadonlyArray<Vector2.Vector2>) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) => Cardinal2d
>(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, ...points: ReadonlyArray<Vector2.Vector2>) =>
    new Cardinal2dImpl([...points, ...p], p.tension, p.alpha),
)

export const withDuplicatedEndpoints = (p: Cardinal2d) => {
  const points = p instanceof Cardinal2dImpl ? p.points : [...p]
  return new Cardinal2dImpl(
    [
      points[0] as Vector2.Vector2,
      ...points,
      points[points.length - 1] as Vector2.Vector2,
    ],
    p.tension,
    p.alpha,
  )
}

// Pinned alias for `withReflectedEndpoints(c, 0)`. The semantics — the spline
// now interpolates its first and last control points — read more directly
// than either of the mechanism-named helpers.
export const withInterpolatedEndpoints = (p: Cardinal2d) => withDuplicatedEndpoints(p)

export const withReflectedEndpoints = dual(
  (args) => isCardinal2d(args[0]),
  (p: Cardinal2d, scale = 1) => {
    if (scale === 0) {
      return withDuplicatedEndpoints(p)
    }

    const points = p instanceof Cardinal2dImpl ? p.points : [...p]
    const p0 = points[0] as Vector2.Vector2
    const p1 = points[1] as Vector2.Vector2

    const p2 = points[points.length - 2] as Vector2.Vector2
    const p3 = points[points.length - 1] as Vector2.Vector2

    return new Cardinal2dImpl(
      [
        Vector2.subtract(p1, p0).pipe(Vector2.scale(scale), Vector2.add(p0)),
        ...points,
        Vector2.subtract(p2, p3).pipe(Vector2.scale(scale), Vector2.add(p3)),
      ],
      p.tension,
      p.alpha,
    )
  },
)

export const withTension = dual<
  (tension: number) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, tension: number) => Cardinal2d
>(2, (p: Cardinal2d, tension: number) => new Cardinal2dImpl(p.points, tension, p.alpha))

export const withAlpha = dual<
  (alpha: number) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, alpha: number) => Cardinal2d
>(2, (p: Cardinal2d, alpha: number) => new Cardinal2dImpl(p.points, p.tension, alpha))

export const withOptions = dual<
  (options: Options) => (p: Cardinal2d) => Cardinal2d,
  (p: Cardinal2d, options: Options) => Cardinal2d
>(
  2,
  (p: Cardinal2d, options: Options) =>
    new Cardinal2dImpl(p.points, options.tension ?? p.tension, options.alpha ?? p.alpha),
)

// Builds one segment from P1 to P2, using P0 and P3 as the surrounding
// neighbors for tangent computation. Math: standard non-uniform Catmull-Rom
// tangents, generalized to a tension τ such that τ=0.5 recovers classical
// Catmull-Rom and τ=0 produces zero tangents (smoothstep-shaped segments).
// For each endpoint, the local-parameter velocity is the alpha-weighted
// Hermite tangent scaled by 2τ. When alpha = 0 the chord-length terms
// collapse to 1 and the formula reduces algebraically to the cached
// `cubicCardinal` matrix output.
const buildCardinalSegment = (
  p0: Vector2.Vector2,
  p1: Vector2.Vector2,
  p2: Vector2.Vector2,
  p3: Vector2.Vector2,
  tension: number,
  alpha: number,
): CubicCurve2d.CubicCurve2d => {
  const d01 = Vector2.magnitude(Vector2.subtract(p1, p0)) ** alpha
  const d12 = Vector2.magnitude(Vector2.subtract(p2, p1)) ** alpha
  const d23 = Vector2.magnitude(Vector2.subtract(p3, p2)) ** alpha

  invariant(
    Number.isFinite(d01) && Number.isFinite(d12) && Number.isFinite(d23),
    'cardinal: non-finite chord length',
  )

  const factor = 2 * tension

  // Coincident-point handling: when `d01 = 0` (P0 = P1) and `alpha > 0`, the
  // first tangent term contains `0 × ∞`. The mathematical limit is 0 — the
  // phantom side doesn't contribute — so we drop the term explicitly rather
  // than propagate NaN. Same at the trailing edge with `d23 = 0`.
  // When `alpha = 0`, `d = 1` regardless of chord, so no special-casing.
  const lead = d01 === 0 ? 0 : d12 / d01
  const trail = d23 === 0 ? 0 : d12 / d23
  const mid01 = d01 + d12 === 0 ? 0 : d12 / (d01 + d12)
  const mid23 = d12 + d23 === 0 ? 0 : d12 / (d12 + d23)

  // Local-parameter tangent at p1.
  const v1x = factor * ((p1.x - p0.x) * lead - (p2.x - p0.x) * mid01 + (p2.x - p1.x))
  const v1y = factor * ((p1.y - p0.y) * lead - (p2.y - p0.y) * mid01 + (p2.y - p1.y))

  // Local-parameter tangent at p2.
  const v2x = factor * ((p2.x - p1.x) - (p3.x - p1.x) * mid23 + (p3.x - p2.x) * trail)
  const v2y = factor * ((p2.y - p1.y) - (p3.y - p1.y) * mid23 + (p3.y - p2.y) * trail)

  // Monomial cubic from Hermite (P1, v1, P2, v2):
  //   c0 = P1
  //   c1 = v1
  //   c2 = 3·(P2 - P1) - 2·v1 - v2
  //   c3 = 2·(P1 - P2) + v1 + v2
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y

  return CubicCurve2d.fromCoefficients(
    Vector2.make(p1.x, p1.y),
    Vector2.make(v1x, v1y),
    Vector2.make(3 * dx - 2 * v1x - v2x, 3 * dy - 2 * v1y - v2y),
    Vector2.make(-2 * dx + v1x + v2x, -2 * dy + v1y + v2y),
  )
}

function* cardinalCurves(p: Cardinal2d): IterableIterator<CubicCurve2d.CubicCurve2d> {
  for (const [p0, p1, p2, p3] of toPointQuads(p, 1)) {
    yield buildCardinalSegment(p0, p1, p2, p3, p.tension, p.alpha)
  }
}

export const toPath = (p: Cardinal2d) => CubicPath2d.make(...cardinalCurves(p))

// Converts each segment's monomial cubic to four Bézier control points and
// stitches them, dropping the shared endpoint between adjacent segments.
//
//   p0 = c0
//   p1 = c0 + c1/3
//   p2 = c0 + 2c1/3 + c2/3
//   p3 = c0 + c1 + c2 + c3   (== next segment's p0 — shared)
export const toBezier = (p: Cardinal2d): Bezier2d => {
  const points: Array<Vector2.Vector2> = []
  let first = true

  for (const curve of cardinalCurves(p)) {
    const c0x = curve.x.c0
    const c0y = curve.y.c0
    const c1x = curve.x.c1
    const c1y = curve.y.c1
    const c2x = curve.x.c2
    const c2y = curve.y.c2
    const c3x = curve.x.c3
    const c3y = curve.y.c3

    if (first) {
      points.push(Vector2.make(c0x, c0y))
      first = false
    }
    points.push(Vector2.make(c0x + c1x / 3, c0y + c1y / 3))
    points.push(Vector2.make(c0x + (2 * c1x) / 3 + c2x / 3, c0y + (2 * c1y) / 3 + c2y / 3))
    points.push(Vector2.make(c0x + c1x + c2x + c3x, c0y + c1y + c2y + c3y))
  }

  return bezierInternal.fromArray(points)
}
