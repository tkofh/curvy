import { Matrix4x3, Matrix4x4, PointObject, Spline, SplineMetadata } from '@curvy/types'
import { roundTo } from 'micro-math'
import {
  getAxisPrimeScalars,
  getAxisScalars,
  createAxisSolver,
  computeCurveLUT,
  createProgressSolver,
  computeCurveExtrema,
  computeCurveBounds,
} from './lib'
import { getAxisPrimeRoots } from './lib/getAxisPrimeRoots'
import { getAxisMonotonicity } from './lib/getAxisMonotonicity'

export const createParametricCurve = (
  p0: PointObject,
  p1: PointObject,
  p2: PointObject,
  p3: PointObject,
  baseScalars: Matrix4x4,
  primeScalars: Matrix4x3,
  precisionX: number,
  precisionY: number,
  lutResolution: number
): Spline => {
  const p0x = roundTo(p0.x, precisionX)
  const p1x = roundTo(p1.x, precisionX)
  const p2x = roundTo(p2.x, precisionX)
  const p3x = roundTo(p3.x, precisionX)

  const p0y = roundTo(p0.y, precisionY)
  const p1y = roundTo(p1.y, precisionY)
  const p2y = roundTo(p2.y, precisionY)
  const p3y = roundTo(p3.y, precisionY)

  const baseScalarsX = getAxisScalars(baseScalars, p0x, p1x, p2x, p3x)
  const baseScalarsY = getAxisScalars(baseScalars, p0y, p1y, p2y, p3y)

  const primeScalarsX = getAxisPrimeScalars(primeScalars, p0x, p1x, p2x, p3x)
  const primeScalarsY = getAxisPrimeScalars(primeScalars, p0y, p1y, p2y, p3y)

  const primeRootsX = getAxisPrimeRoots(...primeScalarsX)
  const primeRootsY = getAxisPrimeRoots(...primeScalarsY)

  const monotonicityX = getAxisMonotonicity(primeRootsX, primeScalarsX)
  const monotonicityY = getAxisMonotonicity(primeRootsY, primeScalarsY)

  const primeRoots = Array.from(new Set([0, 1, ...primeRootsX, ...primeRootsY])).sort(
    (a, b) => a - b
  )

  const lut = computeCurveLUT(
    baseScalarsX,
    baseScalarsY,
    lutResolution,
    primeRoots,
    precisionX,
    precisionY
  )

  const extrema = computeCurveExtrema(
    baseScalarsX,
    baseScalarsY,
    primeRoots,
    precisionX,
    precisionY
  )

  const bounds = computeCurveBounds(extrema)

  const meta: SplineMetadata = {
    precisionX,
    precisionY,
    monotonicityX,
    monotonicityY,
    lut,
    length: lut[lut.length - 1].length,
    extrema,
    bounds,
  }

  const solveX = createAxisSolver('X', meta)
  const solveY = createAxisSolver('Y', meta)

  const solveLength = createProgressSolver('length', meta)
  const solveT = createProgressSolver('t', meta)

  return {
    meta,
    solveX,
    solveY,
    solveLength,
    solveT,
  }
}
