import invariant from 'tiny-invariant'
import type { CubicScalars, Matrix4x4 } from './splines'
import { basis, bezier, cardinal, catmullRom, hermite } from './splines'
import { round } from './util'

export type Interval = readonly [number, number]
export type QuadraticScalars = readonly [number, number, number]
export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'

export type CurveSegment = {
  readonly positions: CubicScalars
  readonly positionScalars: CubicScalars
  readonly velocityScalars: QuadraticScalars
  readonly monotonicity: Monotonicity
  readonly extrema: ReadonlyMap<number, number>
  readonly range: Interval
  readonly positionAt: (t: number) => number
  readonly velocityAt: (t: number) => number
  readonly solveT: (position: number, domain?: Interval) => number
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

function getExtremaAndRange(
  velocityRoots: Set<number>,
  positionScalars: CubicScalars,
): { extrema: ReadonlyMap<number, number>; range: Interval } {
  const extrema = new Map<number, number>()
  const range: [number, number] = [Infinity, -Infinity]

  for (const root of [0, ...velocityRoots, 1]) {
    const t2 = root * root
    const t3 = t2 * root

    const extreme = round(
      positionScalars[0] * t3 +
        positionScalars[1] * t2 +
        positionScalars[2] * root +
        positionScalars[3],
    )

    extrema.set(root, extreme)

    range[0] = Math.min(range[0], extreme)
    range[1] = Math.max(range[1], extreme)
  }

  return { extrema, range }
}

function getMonotonicity(
  extrema: ReadonlyMap<number, number>,
  derivative: QuadraticScalars,
): Monotonicity {
  if (extrema.size > 2) {
    return 'none'
  }

  if (derivative[0] === 0 && derivative[1] === 0 && derivative[2] === 0) {
    return 'constant'
  }

  let test = derivative[0] * 0.5 ** 2 + derivative[1] * 0.5 + derivative[2]
  if (test === 0) {
    test = derivative[2]
  }

  return Math.sign(test) > 0 ? 'increasing' : 'decreasing'
}

export function getPositionScalars(
  matrix: Matrix4x4,
  positions: CubicScalars,
): CubicScalars {
  return [
    round(
      positions[0] * matrix[0][0] +
        positions[1] * matrix[0][1] +
        positions[2] * matrix[0][2] +
        positions[3] * matrix[0][3],
    ),
    round(
      positions[0] * matrix[1][0] +
        positions[1] * matrix[1][1] +
        positions[2] * matrix[1][2] +
        positions[3] * matrix[1][3],
    ),
    round(
      positions[0] * matrix[2][0] +
        positions[1] * matrix[2][1] +
        positions[2] * matrix[2][2] +
        positions[3] * matrix[2][3],
    ),
    round(
      positions[0] * matrix[3][0] +
        positions[1] * matrix[3][1] +
        positions[2] * matrix[3][2] +
        positions[3] * matrix[3][3],
    ),
  ]
}

const twoThirdsPI = (2 * Math.PI) / 3

export function createCubicRootSolver(
  polynomial: CubicScalars,
): (y: number) => ReadonlyArray<number> {
  const oneOverA = 1 / polynomial[0]

  const a2 = polynomial[1] * oneOverA
  const a1 = polynomial[2] * oneOverA

  const a2Over3 = a2 / 3

  const q = a1 / 3 - a2 ** 2 / 9
  const r0 = (a1 * a2) / 6 - a2 ** 3 / 27

  return function solve(y: number) {
    const a0 = (polynomial[3] - y) * oneOverA

    const r = r0 - a0 * 0.5

    const discriminant = q ** 3 + r ** 2

    if (discriminant > 0) {
      const a = Math.cbrt(Math.abs(r) + Math.sqrt(discriminant))

      /* c8 ignore next */
      const t = r < 0 ? q / a - a : a - q / a
      return [round(t - a2Over3)]
    }
    const theta = Math.acos(r / Math.sqrt((-q) ** 3))
    const theta1 = theta / 3
    const theta2 = theta1 - twoThirdsPI
    const theta3 = theta1 + twoThirdsPI

    const twoRootQ = 2 * Math.sqrt(-q)

    return [
      round(twoRootQ * Math.cos(theta1) - a2Over3),
      round(twoRootQ * Math.cos(theta2) - a2Over3),
      round(twoRootQ * Math.cos(theta3) - a2Over3),
    ].sort((a, b) => a - b)
  }
}

export function createCurveSegment(
  matrix: Matrix4x4,
  positions: CubicScalars,
): CurveSegment {
  const positionScalars = getPositionScalars(matrix, positions)

  const velocityScalars: QuadraticScalars = [
    round(positionScalars[0] * 3),
    round(positionScalars[1] * 2),
    positionScalars[2],
  ]

  const velocityRoots = getVelocityUnitRoots(velocityScalars)

  const { extrema, range } = getExtremaAndRange(velocityRoots, positionScalars)

  const monotonicity = getMonotonicity(extrema, velocityScalars)

  const solveForPosition = createCubicRootSolver(positionScalars)

  function positionAt(t: number): number {
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

  function velocityAt(t: number): number {
    const t1 = round(t)
    const t2 = t1 * t1
    return round(
      velocityScalars[0] * t2 + velocityScalars[1] * t1 + velocityScalars[2],
    )
  }

  function solveT(position: number, domain: Interval = [0, 1]) {
    invariant(typeof position === 'number', 'position must be a number')

    const rounded = round(position)

    invariant(
      rounded >= range[0] && rounded <= range[1],
      'position out of range',
    )

    let solution: number | undefined
    for (const t of solveForPosition(position)) {
      if (t >= domain[0] && t <= domain[1]) {
        solution = t
        break
      }
    }

    invariant(typeof solution === 'number', 'no solution found')

    return solution
  }

  return {
    extrema,
    monotonicity,
    range,
    positions,
    positionScalars,
    velocityScalars,
    positionAt,
    velocityAt,
    solveT,
  }
}

export function createBezierSegment(positions: CubicScalars) {
  return createCurveSegment(bezier, positions)
}

export function createHermiteSegment(positions: CubicScalars) {
  return createCurveSegment(hermite, positions)
}

export function createCardinalSegment(positions: CubicScalars, tension = 0.5) {
  return createCurveSegment(cardinal(tension), positions)
}

export function createCatmullRomSegment(positions: CubicScalars) {
  return createCurveSegment(catmullRom, positions)
}

export function createBasisSegment(positions: CubicScalars) {
  return createCurveSegment(basis, positions)
}
