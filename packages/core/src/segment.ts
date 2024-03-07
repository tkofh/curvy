import { basis, bezier, cardinal, catmullRom, hermite } from './splines'
import type {
  CubicScalars,
  CurveSegment,
  Matrix4x4,
  Monotonicity,
  QuadraticScalars,
} from './types'
import { round } from './util'

function getDerivativeUnitRoots(derivative: QuadraticScalars): Set<number> {
  const roots = new Set<number>()

  if (derivative[0] !== 0) {
    const discriminant = derivative[1] ** 2 - 4 * derivative[0] * derivative[2]

    // only consider when the discriminant is positive because a
    // single root means an inflection point which cannot be an extrema
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
  derivativeRoots: Set<number>,
  polynomial: CubicScalars,
): Map<number, number> {
  const localExtrema = new Map<number, number>()
  localExtrema.set(0, polynomial[3])

  for (const root of derivativeRoots) {
    const t2 = root * root
    const t3 = t2 * root
    localExtrema.set(
      root,
      round(
        polynomial[0] * t3 +
          polynomial[1] * t2 +
          polynomial[2] * root +
          polynomial[3],
      ),
    )
  }

  localExtrema.set(
    1,
    round(polynomial[0] + polynomial[1] + polynomial[2] + polynomial[3]),
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

export function createCurveSegment(
  matrix: Matrix4x4,
  points: CubicScalars,
): CurveSegment {
  const polynomial: CubicScalars = [
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

  const derivative: QuadraticScalars = [
    round(polynomial[0] * 3),
    round(polynomial[1] * 2),
    polynomial[2],
  ]

  const derivativeRoots = getDerivativeUnitRoots(derivative)

  const localExtrema = getLocalExtrema(derivativeRoots, polynomial)

  const max = Math.max(...localExtrema.values())
  const min = Math.min(...localExtrema.values())

  const monotonicity = getMonotonicity(localExtrema, derivative)

  return {
    localExtrema,
    monotonicity,
    max,
    min,
    points,
    polynomial,
    derivative,
    solve: (t: number) => {
      const t1 = round(t)
      const t2 = t1 * t1
      const t3 = t2 * t1
      return round(
        polynomial[0] * t3 +
          polynomial[1] * t2 +
          polynomial[2] * t1 +
          polynomial[3],
      )
    },
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
