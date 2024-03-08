import type { CubicScalars, Matrix4x4 } from './splines'
import { basis, bezier, cardinal, catmullRom, hermite } from './splines'
import { round } from './util'

export type QuadraticScalars = readonly [number, number, number]
export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type CurveSegment = {
  readonly monotonicity: Monotonicity
  readonly localExtrema: ReadonlyMap<number, number>
  readonly points: CubicScalars
  readonly positionScalars: CubicScalars
  readonly velocityScalars: QuadraticScalars
  readonly min: number
  readonly max: number
  readonly solve: (t: number) => number
  readonly velocity: (t: number) => number
}

function getVelocityUnitRoots(derivative: QuadraticScalars): Set<number> {
  const roots = new Set<number>()

  if (derivative[0] !== 0) {
    const discriminant = derivative[1] ** 2 - 4 * derivative[0] * derivative[2]

    // only consider when the discriminant is positive because a
    // single root means an inflection point in the first derivative,
    // which cannot be an extrema
    if (discriminant > 0) {
      const sqrtDiscriminant = Math.sqrt(discriminant)
      const denominator = 2 * derivative[0]

      const root1 = (-derivative[1] - sqrtDiscriminant) / denominator
      const root2 = (-derivative[1] + sqrtDiscriminant) / denominator

      if (root1 > 0 && root1 < 1) {
        roots.add(root1)
      }
      if (root2 > 0 && root2 < 1) {
        roots.add(root2)
      }
    }
  } else if (derivative[1] !== 0) {
    const root = -derivative[2] / derivative[1]
    if (root >= 0 && root <= 1) {
      roots.add(root)
    }
  }
  return roots
}

function getLocalExtrema(
  velocityRoots: Set<number>,
  positionScalars: CubicScalars,
): Map<number, number> {
  const localExtrema = new Map<number, number>()
  localExtrema.set(0, positionScalars[3])

  for (const root of velocityRoots) {
    const t2 = root * root
    const t3 = t2 * root
    localExtrema.set(
      root,
      round(
        positionScalars[0] * t3 +
          positionScalars[1] * t2 +
          positionScalars[2] * root +
          positionScalars[3],
      ),
    )
  }

  localExtrema.set(
    1,
    round(
      positionScalars[0] +
        positionScalars[1] +
        positionScalars[2] +
        positionScalars[3],
    ),
  )

  return localExtrema
}

function getMonotonicity(
  localExtrema: Map<number, number>,
  derivative: QuadraticScalars,
): Monotonicity {
  if (localExtrema.size > 2) {
    return 'none'
  }

  if (derivative[0] === 0 && derivative[1] === 0 && derivative[2] === 0) {
    return 'constant'
  }

  let test = derivative[0] / 4 + derivative[1] / 2 + derivative[2]
  if (test === 0) {
    test = derivative[2]
  }

  return Math.sign(test) > 0 ? 'increasing' : 'decreasing'
}

export function getPositionScalars(
  matrix: Matrix4x4,
  points: CubicScalars,
): CubicScalars {
  return [
    round(
      points[0] * matrix[0][0] +
        points[1] * matrix[0][1] +
        points[2] * matrix[0][2] +
        points[3] * matrix[0][3],
    ),
    round(
      points[0] * matrix[1][0] +
        points[1] * matrix[1][1] +
        points[2] * matrix[1][2] +
        points[3] * matrix[1][3],
    ),
    round(
      points[0] * matrix[2][0] +
        points[1] * matrix[2][1] +
        points[2] * matrix[2][2] +
        points[3] * matrix[2][3],
    ),
    round(
      points[0] * matrix[3][0] +
        points[1] * matrix[3][1] +
        points[2] * matrix[3][2] +
        points[3] * matrix[3][3],
    ),
  ]
}

export function createCurveSegment(
  matrix: Matrix4x4,
  points: CubicScalars,
): CurveSegment {
  const positionScalars = getPositionScalars(matrix, points)

  const velocityScalars: QuadraticScalars = [
    round(positionScalars[0] * 3),
    round(positionScalars[1] * 2),
    positionScalars[2],
  ]

  const velocityRoots = getVelocityUnitRoots(velocityScalars)

  const localExtrema = getLocalExtrema(velocityRoots, positionScalars)

  const max = Math.max(...localExtrema.values())
  const min = Math.min(...localExtrema.values())

  const monotonicity = getMonotonicity(localExtrema, velocityScalars)

  function solve(t: number): number {
    const t1 = round(t)
    const t2 = t1 * t1
    const t3 = t2 * t1
    return round(
      positionScalars[0] * t3 +
        positionScalars[1] * t2 +
        positionScalars[2] * t1 +
        positionScalars[3],
    )
  }

  function velocity(t: number): number {
    const t1 = round(t)
    const t2 = t1 * t1
    return round(
      velocityScalars[0] * t2 + velocityScalars[1] * t1 + velocityScalars[2],
    )
  }

  return {
    localExtrema,
    monotonicity,
    max,
    min,
    points,
    positionScalars,
    velocityScalars,
    solve,
    velocity,
  }
}

export function createBezierSegment(points: CubicScalars) {
  return createCurveSegment(bezier, points)
}

export function createHermiteSegment(points: CubicScalars) {
  return createCurveSegment(hermite, points)
}

export function createCardinalSegment(points: CubicScalars, tension = 0.5) {
  return createCurveSegment(cardinal(tension), points)
}

export function createCatmullRomSegment(points: CubicScalars) {
  return createCurveSegment(catmullRom, points)
}

export function createBasisSegment(points: CubicScalars) {
  return createCurveSegment(basis, points)
}
