import { CubicPoints, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { createSegmentAxisSolver } from './createSegmentAxisSolver'
import { createCubicBezierSolver } from './createCubicBezierSolver'
import { getSegmentComponentInfo } from './getSegmentComponentInfo'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'
import { BezierSplineOptions } from './BezierSplineOptions'
import { createSegmentLengthSolver } from './createSegmentLengthSolver'
import { getSegmentLUT } from './getSegmentLUT'
import { getSegmentBoundsAndExtrema } from './getSegmentBoundsAndExtrema'

export const createSegment = (points: CubicPoints, options?: BezierSplineOptions): Spline => {
  const precisionY = options?.precisionY ?? options?.precision ?? DEFAULT_PRECISION
  const precisionX = options?.precisionX ?? options?.precision ?? DEFAULT_PRECISION

  const lutResolution = options?.lutResolution ?? DEFAULT_LUT_RESOLUTION

  /**
   * It's safe to round the input points because they shouldn't
   * be more precise than the desired input and output values
   *
   * They need to be rounded to determine the extrema of the
   * curve after precision is taken into account, as these
   * values may differ from the extrema of an input curve
   * with extra precision
   */

  const p0x = roundTo(points[0][0], precisionX)
  const p1x = roundTo(points[1][0], precisionX)
  const p2x = roundTo(points[2][0], precisionX)
  const p3x = roundTo(points[3][0], precisionX)

  const p0y = roundTo(points[0][1], precisionY)
  const p1y = roundTo(points[1][1], precisionY)
  const p2y = roundTo(points[2][1], precisionY)
  const p3y = roundTo(points[3][1], precisionY)

  const solveXForT = createCubicBezierSolver(p0x, p1x, p2x, p3x)
  const solveYForT = createCubicBezierSolver(p0y, p1y, p2y, p3y)

  const infoX = getSegmentComponentInfo(p0x, p1x, p2x, p3x)
  const infoY = getSegmentComponentInfo(p0y, p1y, p2y, p3y)

  const lut = getSegmentLUT(lutResolution, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y)
  const segmentLength = lut.length[lut.length.length - 1]

  const { boundingBox, extrema } = getSegmentBoundsAndExtrema(
    precisionX,
    precisionY,
    p0x,
    p0y,
    p3x,
    p3y,
    solveXForT,
    solveYForT,
    infoX.derivativeRoots,
    infoY.derivativeRoots
  )

  const solveX = createSegmentAxisSolver(
    boundingBox.minY,
    boundingBox.maxY,
    boundingBox.minX,
    boundingBox.maxX,
    precisionY,
    precisionX,
    lut.y,
    lut.x
  )
  const solveY = createSegmentAxisSolver(
    boundingBox.minX,
    boundingBox.maxX,
    boundingBox.minY,
    boundingBox.maxY,
    precisionX,
    precisionY,
    lut.x,
    lut.y
  )

  const solvePointAtLength = createSegmentLengthSolver(
    lut.length,
    lut.x,
    lut.y,
    precisionX,
    precisionY
  )

  return {
    solveX,
    solveY,
    extrema,
    boundingBox,
    monotonicityX: infoX.monotonicity,
    monotonicityY: infoY.monotonicity,
    precisionX,
    precisionY,
    length: segmentLength,
    solvePointAtLength,
  }
}
