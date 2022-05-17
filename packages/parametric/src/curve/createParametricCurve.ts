import { CubicPoints, Matrix4x3, Matrix4x4, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import {
  getAxisMonotonicity,
  getAxisPrimeRoots,
  getAxisPrimeScalars,
  getAxisScalars,
  getExtrema,
  getBoundingBox,
  getAxisLUT,
  getLengthLUT,
  createAxisSolver,
  createLengthSolver,
} from './lib'

export const createParametricCurve = (
  baseScalars: Matrix4x4,
  primeScalars: Matrix4x3,
  points: CubicPoints,
  precisionX: number,
  precisionY: number,
  lutResolution: number
): Spline => {
  const p0x = roundTo(points[0][0], precisionX)
  const p1x = roundTo(points[1][0], precisionX)
  const p2x = roundTo(points[2][0], precisionX)
  const p3x = roundTo(points[3][0], precisionX)

  const p0y = roundTo(points[0][1], precisionY)
  const p1y = roundTo(points[1][1], precisionY)
  const p2y = roundTo(points[2][1], precisionY)
  const p3y = roundTo(points[3][1], precisionY)

  const [xba, xbb, xbc, xbd] = getAxisScalars(baseScalars, p0x, p1x, p2x, p3x)
  const [yba, ybb, ybc, ybd] = getAxisScalars(baseScalars, p0y, p1y, p2y, p3y)

  const [xpa, xpb, xpc] = getAxisPrimeScalars(primeScalars, p0x, p1x, p2x, p3x)
  const [ypa, ypb, ypc] = getAxisPrimeScalars(primeScalars, p0y, p1y, p2y, p3y)

  const primeRootsX = getAxisPrimeRoots(xpa, xpb, xpc)
  const primeRootsY = getAxisPrimeRoots(ypa, ypb, ypc)

  const monotonicityX = getAxisMonotonicity(primeRootsX, xpa, xpb, xpc)
  const monotonicityY = getAxisMonotonicity(primeRootsY, ypa, ypb, ypc)

  const extrema = getExtrema(
    primeRootsX,
    primeRootsY,
    precisionX,
    precisionY,
    xba,
    xbb,
    xbc,
    xbd,
    yba,
    ybb,
    ybc,
    ybd
  )

  const boundingBox = getBoundingBox(extrema)

  const lutX = getAxisLUT(lutResolution, xba, xbb, xbc, xbd)
  const lutY = getAxisLUT(lutResolution, yba, ybb, ybc, ybd)

  const lutL = getLengthLUT(lutX, lutY)

  const length = lutL[lutL.length - 1]

  const solveX = createAxisSolver('X', boundingBox, precisionX, precisionY, lutX, lutY)
  const solveY = createAxisSolver('Y', boundingBox, precisionY, precisionX, lutY, lutX)

  const solvePointAtLength = createLengthSolver(lutL, lutX, lutY, precisionX, precisionY)

  return {
    solveX,
    solveY,
    solvePointAtLength,
    length,
    monotonicityY,
    monotonicityX,
    precisionY,
    precisionX,
    boundingBox,
    extrema,
  }
}
