import { Matrix4x3, Matrix4x4, Point, Spline } from '@curvy/types'
import { toPointObject } from '../common'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'
import { SplineOptions } from './SplineOptions'
import {
  createSplineCurves,
  createAxisSolver,
  createProgressSolver,
  computeSplineMeta,
} from './lib'

export const createParametricSplineFactory =
  (baseScalars: Matrix4x4, primeScalars: Matrix4x3) =>
  (points: Array<Point>, options?: SplineOptions): Spline => {
    if (points.length < 4) {
      throw new Error('At least one cubic segment (four points) must be provided')
    }

    if ((points.length - 1) % 3 !== 0) {
      throw new Error('Invalid number of points provided (must have 3n+1 points)')
    }

    const precisionY = options?.precisionY ?? options?.precision ?? DEFAULT_PRECISION
    const precisionX = options?.precisionX ?? options?.precision ?? DEFAULT_PRECISION

    const lutResolution = options?.lutResolution ?? DEFAULT_LUT_RESOLUTION

    const pointObjects = points.map((point) => toPointObject(point))

    const curves = createSplineCurves(
      baseScalars,
      primeScalars,
      pointObjects,
      precisionX,
      precisionY,
      lutResolution
    )

    const meta = computeSplineMeta(curves)

    const solveX = createAxisSolver('X', meta, curves)
    const solveY = createAxisSolver('Y', meta, curves)

    const solveLength = createProgressSolver('length', meta, curves)
    const solveT = createProgressSolver('t', meta, curves)

    return {
      meta,
      solveX,
      solveY,
      solveT,
      solveLength,
    }
  }
