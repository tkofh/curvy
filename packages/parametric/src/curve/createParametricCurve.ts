import { Matrix4x3, Matrix4x4, PointObject, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import {
  getAxisPrimeScalars,
  getAxisScalars,
  createAxisSolver,
  computeCurveLUT,
  computeCurveMeta,
  createProgressSolver,
} from './lib'

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

  const lut = computeCurveLUT(baseScalarsX, baseScalarsY, lutResolution)

  const meta = computeCurveMeta(
    baseScalarsX,
    baseScalarsY,
    primeScalarsX,
    primeScalarsY,
    precisionX,
    precisionY,
    lut
  )

  const solveX = createAxisSolver('X', meta, lut)
  const solveY = createAxisSolver('Y', meta, lut)

  const solveLength = createProgressSolver('length', meta, lut)
  const solveT = createProgressSolver('t', meta, lut)

  return {
    meta,
    solveX,
    solveY,
    solveLength,
    solveT,
  }
}
