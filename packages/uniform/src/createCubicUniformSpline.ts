import type {
  BaseAxes,
  Bounds,
  CubicCurve,
  CubicPoints,
  CubicSpline,
  Matrix4x4,
  Monotonicity,
  NormalizedPrecision,
  Point,
  Precision,
  ReadonlyExtreme,
  ReadonlyPoint,
} from '@curvy/types'
import { roundTo } from 'micro-math'
import { getBounds, getExtrema, hashBounds, mergeBounds, roundBounds } from './util'
import { createCubicUniformCurve } from './createCubicUniformCurve'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'

export const createCubicUniformSpline = <TAxis extends BaseAxes>(
  points: CubicPoints<TAxis>[],
  identityMatrix: Matrix4x4,
  precision: Precision<TAxis> = DEFAULT_PRECISION,
  lutResolution = DEFAULT_LUT_RESOLUTION
): CubicSpline<TAxis> => {
  if (points.length === 0) {
    throw new Error('At least one cubic segment must be provided')
  }

  const curves: CubicCurve<TAxis>[] = []

  let axes!: ReadonlySet<TAxis>
  let splineLength = 0
  let normalizedPrecision!: NormalizedPrecision<TAxis>
  let monotonicity!: Monotonicity<TAxis>
  const extremaCandidates: ReadonlyExtreme<TAxis>[] = []

  for (const [curveIndex, segmentPoints] of points.entries()) {
    const curve = createCubicUniformCurve(segmentPoints, identityMatrix, precision, lutResolution)
    curves.push(curve)

    for (const [extremeIndex, extreme] of curve.extrema.entries()) {
      if (extremaCandidates.length > 0 && extremeIndex === 0) {
        const tailCandidate = extremaCandidates[extremaCandidates.length - 1]
        extremaCandidates[extremaCandidates.length - 1] = {
          ...tailCandidate,
          for: new Set([...tailCandidate.for, ...extreme.for]),
        }
      } else {
        extremaCandidates.push({
          for: extreme.for,
          value: extreme.value,
          length: splineLength + extreme.length,
          t: (curveIndex + extreme.t) / points.length,
        })
      }
    }

    splineLength += curve.length

    if (curveIndex === 0) {
      axes = curve.axes
      normalizedPrecision = curve.precision
      monotonicity = curve.monotonicity
    } else {
      for (const axis of axes) {
        if (monotonicity[axis] !== 'none' && curve.monotonicity[axis] !== monotonicity[axis]) {
          monotonicity[axis] = 'none'
        }
      }
    }
  }

  const extrema = getExtrema(extremaCandidates)

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

    let result: ReadonlyPoint<TAxis> | undefined

    if (cachedResult) {
      result = cachedResult
    } else if (roundedInput >= bounds[axis].min && roundedInput <= bounds[axis].max) {
      for (const curve of curves) {
        result = curve.trySolve(axis, input, constraints)
        if (result) {
          break
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
        `No solution found for spline at ${axis}=${input}${
          constraints ? ` with constraints ${JSON.stringify(constraints)}` : ''
        }`
      )
    }

    return result
  }

  const trySolveLength = (length: number) => {
    const key = `length${length}`

    const cachedResult = solveCache.get(key)

    let result: ReadonlyPoint<TAxis> | undefined
    if (cachedResult) {
      result = cachedResult
    } else if (length <= splineLength) {
      let lengthOffset = 0
      for (const curve of curves) {
        if (length >= lengthOffset && length <= lengthOffset + curve.length) {
          result = curve.trySolveLength(length - lengthOffset)
          break
        }
        lengthOffset += curve.length
      }
    }

    solveCache.set(key, result)

    return result
  }

  const solveLength = (length: number) => {
    const result = trySolveLength(length)

    if (!result) {
      throw new Error(`No solution found for spline at length=${length}`)
    }

    return result
  }

  const trySolveT = (t: number) => {
    const key = `t${t}`

    const cachedResult = solveCache.get(key)

    let result: ReadonlyPoint<TAxis> | undefined

    if (cachedResult) {
      result = cachedResult
    } else if (t >= 0 && t <= 1) {
      const u = t * curves.length
      const curveIndex = Math.floor(u) - (u === curves.length ? 1 : 0)

      result = curves[curveIndex].trySolveT(u - curveIndex)
    }

    solveCache.set(key, result)

    return result
  }

  const solveT = (t: number) => {
    const result = trySolveT(t)

    if (!result) {
      throw new Error(`No solution found for spline at t=${t}`)
    }

    return result
  }

  return {
    trySolve,
    solve,
    trySolveLength,
    solveLength,
    trySolveT,
    solveT,

    bounds,
    extrema,
    precision: normalizedPrecision,
    monotonicity,
    length: splineLength,
    points,
    identityMatrix,
    axes,
    curves,
  }
}
