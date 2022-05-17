import { Matrix4x3, Matrix4x4, Points, Spline } from '@curvy/types'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'
import { SplineOptions } from './SplineOptions'
import {
  createSplineCurves,
  getBoundingBox,
  getExtrema,
  getAxisMonotonicity,
  createAxisSolver,
  createLengthSolver,
} from './lib'

export const createParametricSplineFactory =
  (baseScalars: Matrix4x4, primeScalars: Matrix4x3) =>
  (points: Points, options?: SplineOptions): Spline => {
    if (points.length < 4) {
      throw new Error('At least one cubic segment (four points) must be provided')
    }

    if ((points.length - 1) % 3 !== 0) {
      throw new Error('Invalid number of points provided (must have 3n+1 points)')
    }

    const precisionY = options?.precisionY ?? options?.precision ?? DEFAULT_PRECISION
    const precisionX = options?.precisionX ?? options?.precision ?? DEFAULT_PRECISION

    const lutResolution = options?.lutResolution ?? DEFAULT_LUT_RESOLUTION

    const curves = createSplineCurves(
      baseScalars,
      primeScalars,
      points,
      precisionX,
      precisionY,
      lutResolution
    )

    const extrema = getExtrema(curves)
    const boundingBox = getBoundingBox(curves)

    const length = curves.reduce((length, curve) => length + curve.length, 0)

    const monotonicityX = getAxisMonotonicity(curves, 'X')
    const monotonicityY = getAxisMonotonicity(curves, 'Y')

    const solveX = createAxisSolver('X', boundingBox, precisionX, precisionY, curves)
    const solveY = createAxisSolver('Y', boundingBox, precisionY, precisionX, curves)

    const solvePointAtLength = createLengthSolver(length, curves)

    return {
      solveX,
      solveY,
      precisionX,
      precisionY,
      monotonicityX,
      monotonicityY,
      extrema,
      boundingBox,
      length,
      solvePointAtLength,
    }
  }
