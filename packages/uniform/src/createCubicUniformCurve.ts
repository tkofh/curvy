import {
  cubicPolynomial,
  distance,
  lerp,
  normalize,
  quadraticPolynomial,
  quadraticRoots,
  roundTo,
} from 'micro-math'
import type {
  BaseAxes,
  Bounds,
  CubicCurve,
  CubicPoints,
  Matrix4x4,
  Monotonicity,
  Point,
  Precision,
  ReadonlyCubicPoints,
  ReadonlyExtreme,
} from '@curvy/types'
import {
  getBounds,
  getExtrema,
  getPrimeScalars,
  hashBounds,
  mergeBounds,
  normalizePrecision,
  roundBounds,
  roundPoint,
} from './util'
import type { CubicScalars, LUTEntry, LUTRange, QuadraticScalars } from './types'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'

export const createCubicUniformCurve = <TAxis extends BaseAxes>(
  points: CubicPoints<TAxis>,
  identityMatrix: Matrix4x4,
  precision: Precision<TAxis> = DEFAULT_PRECISION,
  lutResolution = DEFAULT_LUT_RESOLUTION
): CubicCurve<TAxis> => {
  const axes = new Set(Object.keys(points[0]) as TAxis[])
  const normalizedPrecision = normalizePrecision(precision, axes)

  const roundedPoints: ReadonlyCubicPoints<TAxis> = [
    roundPoint(points[0], normalizedPrecision),
    roundPoint(points[1], normalizedPrecision),
    roundPoint(points[2], normalizedPrecision),
    roundPoint(points[3], normalizedPrecision),
  ]

  const primeIdentityMatrix = getPrimeScalars(identityMatrix)
  const primeRoots = new Map([
    [0, axes],
    [1, axes],
  ])

  const baseScalars = {} as Record<TAxis, CubicScalars>
  const monotonicity = {} as Monotonicity<TAxis>

  for (const axis of axes) {
    baseScalars[axis] = [
      roundedPoints[0][axis] * identityMatrix[0][0] +
        roundedPoints[1][axis] * identityMatrix[1][0] +
        roundedPoints[2][axis] * identityMatrix[2][0] +
        roundedPoints[3][axis] * identityMatrix[3][0],
      roundedPoints[0][axis] * identityMatrix[0][1] +
        roundedPoints[1][axis] * identityMatrix[1][1] +
        roundedPoints[2][axis] * identityMatrix[2][1] +
        roundedPoints[3][axis] * identityMatrix[3][1],
      roundedPoints[0][axis] * identityMatrix[0][2] +
        roundedPoints[1][axis] * identityMatrix[1][2] +
        roundedPoints[2][axis] * identityMatrix[2][2] +
        roundedPoints[3][axis] * identityMatrix[3][2],
      roundedPoints[0][axis] * identityMatrix[0][3] +
        roundedPoints[1][axis] * identityMatrix[1][3] +
        roundedPoints[2][axis] * identityMatrix[2][3] +
        roundedPoints[3][axis] * identityMatrix[3][3],
    ]

    const primeScalars: QuadraticScalars = [
      roundedPoints[0][axis] * primeIdentityMatrix[0][0] +
        roundedPoints[1][axis] * primeIdentityMatrix[1][0] +
        roundedPoints[2][axis] * primeIdentityMatrix[2][0] +
        roundedPoints[3][axis] * primeIdentityMatrix[3][0],
      roundedPoints[0][axis] * primeIdentityMatrix[0][1] +
        roundedPoints[1][axis] * primeIdentityMatrix[1][1] +
        roundedPoints[2][axis] * primeIdentityMatrix[2][1] +
        roundedPoints[3][axis] * primeIdentityMatrix[3][1],
      roundedPoints[0][axis] * primeIdentityMatrix[0][2] +
        roundedPoints[1][axis] * primeIdentityMatrix[1][2] +
        roundedPoints[2][axis] * primeIdentityMatrix[2][2] +
        roundedPoints[3][axis] * primeIdentityMatrix[3][2],
    ]

    const [root1, root2] = quadraticRoots(...primeScalars)
    let hasRoots = false

    if (root1 !== root2) {
      if (root1 !== undefined && root1 > 0 && root1 < 1) {
        if (primeRoots.has(root1)) {
          primeRoots.get(root1)!.add(axis)
        } else {
          primeRoots.set(root1, new Set([axis]))
        }
        hasRoots = true
      }
      if (root2 !== undefined && root2 > 0 && root2 < 1) {
        if (primeRoots.has(root2)) {
          primeRoots.get(root2)!.add(axis)
        } else {
          primeRoots.set(root2, new Set([axis]))
        }
        hasRoots = true
      }
    }

    monotonicity[axis] = 'none'
    if (!hasRoots) {
      let basis = quadraticPolynomial(0, ...primeScalars)
      if (basis === 0) {
        basis = quadraticPolynomial(0.5, ...primeScalars)
      }

      if (basis < 0) {
        monotonicity[axis] = 'negative'
      } else if (basis > 0) {
        monotonicity[axis] = 'positive'
      }
    }
  }

  const lutUniqueSamples = new Set([0, 1, ...primeRoots.keys()])
  const sampleScalar = 1 / (lutResolution - 1)
  for (let s = 0; s < lutResolution; s++) {
    lutUniqueSamples.add(s * sampleScalar)
  }
  const lutSamples = Array.from(lutUniqueSamples).sort((a, b) => a - b)

  const lut = new Set<LUTRange<TAxis>>()

  const extremaCandidates: ReadonlyExtreme<TAxis>[] = []

  let lutTail: LUTEntry<TAxis> | undefined
  for (const t of lutSamples) {
    const value = {} as Point<TAxis>

    const min = {} as Point<TAxis>
    const max = {} as Point<TAxis>

    for (const axis of axes) {
      value[axis] = roundTo(
        cubicPolynomial(t, ...(baseScalars[axis] as CubicScalars)),
        normalizedPrecision[axis]
      )

      if (lutTail) {
        if (Math.min(value[axis], lutTail.value[axis]) === value[axis]) {
          min[axis] = value[axis]
          max[axis] = lutTail.value[axis]
        } else {
          min[axis] = lutTail.value[axis]
          max[axis] = value[axis]
        }
      }
    }

    let length = 0
    if (lutTail) {
      length = lutTail.length + distance(Object.values(lutTail.value), Object.values(value))
    }

    if (primeRoots.has(t)) {
      extremaCandidates.push({
        value: roundPoint(value, normalizedPrecision),
        for: primeRoots.get(t)!,
        t,
        length,
      })
    }

    const entry: LUTEntry<TAxis> = { t, length, value }

    if (lutTail) {
      lut.add({ start: lutTail, end: entry, min, max })
    }

    lutTail = entry
  }

  const extrema = getExtrema(extremaCandidates)

  // bounds are rounded because it is made of the rounded extrema
  const bounds = getBounds(extrema, axes)

  const solveCache = new Map<string, Point<TAxis> | undefined>()

  const trySolve = <TSolveAxis extends TAxis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<TAxis, TSolveAxis>>>
  ) => {
    const roundedInput = roundTo(input, normalizedPrecision[axis])
    const resolvedConstraints = mergeBounds(
      (constraints ? roundBounds(constraints, normalizedPrecision) : {}) as Partial<Bounds<TAxis>>,
      bounds
    )

    const key = `axis${axis}${roundedInput}${hashBounds(resolvedConstraints, normalizedPrecision)}`

    const cachedResult = solveCache.get(key)

    let result: Point<TAxis> | undefined
    if (cachedResult) {
      result = cachedResult
    } else if (roundedInput >= bounds[axis].min && roundedInput <= bounds[axis].max) {
      for (const { start, end, min, max } of lut.values()) {
        result =
          start.value[axis] === roundedInput
            ? start.value
            : end.value[axis] === roundedInput
            ? end.value
            : undefined

        if (result !== undefined) {
          let matches = true
          for (const otherAxis of axes) {
            if (
              otherAxis !== axis &&
              (result[axis] < resolvedConstraints[axis as TAxis].min ||
                result[axis] > resolvedConstraints[axis as TAxis].max)
            ) {
              matches = false
              break
            }
          }
          if (!matches) {
            result = undefined
          } else {
            break
          }
        } else if (roundedInput >= min[axis] && roundedInput <= max[axis]) {
          const t = normalize(input, start.value[axis], end.value[axis])

          const candidate = {} as Point<TAxis>
          let candidateValid = true
          for (const axis of axes) {
            const axisValue = roundTo(
              lerp(t, start.value[axis], end.value[axis]),
              normalizedPrecision[axis]
            )
            if (
              axisValue >= resolvedConstraints[axis].min &&
              axisValue <= resolvedConstraints[axis].max
            ) {
              candidate[axis] = axisValue
            } else {
              candidateValid = false
              break
            }
          }

          if (candidateValid) {
            result = candidate
            break
          }
        }
      }
    }

    solveCache.set(key, result)
    return result
  }

  const solve = <TSolveAxis extends TAxis>(
    axis: TSolveAxis,
    input: number,
    constraints?: Partial<Bounds<Exclude<TAxis, TSolveAxis>>>
  ) => {
    const result = trySolve(axis, input, constraints)
    if (result === undefined) {
      throw new Error(
        `No solution found for curve at ${axis}=${input}${
          constraints ? ` with constraints ${JSON.stringify(constraints)}` : ''
        }`
      )
    }
    return result
  }

  const trySolveLength = (length: number) => {
    const key = `length${length}`

    const cachedResult = solveCache.get(key)

    let result: Point<TAxis> | undefined
    if (cachedResult) {
      result = cachedResult
    } else if (length >= 0 && length <= lutTail!.length) {
      for (const { start, end } of lut.values()) {
        result =
          start.length === length ? start.value : end.length === length ? end.value : undefined

        if (result !== undefined) {
          break
        } else if (length >= start.length && length <= end.length) {
          const t = normalize(length, start.length, end.length)
          result = {} as Point<TAxis>
          for (const axis of axes) {
            result[axis] = roundTo(
              lerp(t, start.value[axis], end.value[axis]),
              normalizedPrecision[axis]
            )
          }
          break
        }
      }
    }

    solveCache.set(key, result)
    return result
  }

  const solveLength = (length: number) => {
    const result = trySolveLength(length)

    if (result === undefined) {
      throw new Error(`No solution found for curve at length=${length}`)
    }

    return result
  }

  const trySolveT = (t: number) => {
    const key = `t${t}`

    const cachedResult = solveCache.get(key)

    let result: Point<TAxis> | undefined
    if (cachedResult) {
      result = cachedResult
    } else if (t >= 0 && t <= 1) {
      for (const { start, end } of lut.values()) {
        result = start.t === t ? start.value : end.t === t ? end.value : undefined

        if (result !== undefined) {
          break
        } else if (t >= start.t && t <= end.t) {
          const entryT = normalize(t, start.t, end.t)
          result = {} as Point<TAxis>
          for (const axis of axes) {
            result[axis] = roundTo(
              lerp(entryT, start.value[axis], end.value[axis]),
              normalizedPrecision[axis]
            )
          }
          break
        }
      }
    }

    solveCache.set(key, result)
    return result
  }

  const solveT = (t: number) => {
    const result = trySolveT(t)

    if (result === undefined) {
      throw new Error(`No solution found for curve at t=${t}`)
    }

    return result
  }

  return {
    points: roundedPoints,
    identityMatrix,
    extrema,
    bounds,
    monotonicity,
    axes,
    precision: normalizedPrecision,
    length: lutTail!.length,
    trySolve,
    solve,
    trySolveLength,
    solveLength,
    trySolveT,
    solveT,
  }
}
