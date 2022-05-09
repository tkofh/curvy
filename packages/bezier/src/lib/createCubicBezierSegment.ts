import { CubicPoints, Points, Rect, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { createCubicBezierSegmentDimensionSolver } from './createCubicBezierSegmentDimensionSolver'
import { createCubicBezierSolver } from './createCubicBezierSolver'
import { getDerivativeInfo } from './getDerivativeInfo'
import { DEFAULT_LUT_RESOLUTION, DEFAULT_PRECISION } from './constants'
import { BezierSplineOptions } from './BezierSplineOptions'

export const createCubicBezierSegment = (
  points: CubicPoints,
  options?: BezierSplineOptions
): Spline => {
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

  const dx = getDerivativeInfo(p0x, p1x, p2x, p3x)
  const dy = getDerivativeInfo(p0y, p1y, p2y, p3y)

  const solveXForT = createCubicBezierSolver(p0x, p1x, p2x, p3x)
  const solveYForT = createCubicBezierSolver(p0y, p1y, p2y, p3y)

  const lutX: number[] = []
  const lutY: number[] = []

  lutX.push(p0x)
  lutY.push(p0y)

  // start at s=1 and end where s=(resolution - 1) because the endpoints are already known from the input
  for (let s = 1; s < lutResolution - 1; s++) {
    const t = s / (lutResolution - 1)

    const sx = solveXForT(t)
    const sy = solveYForT(t)

    lutX.push(sx)
    lutY.push(sy)
  }

  lutX.push(p3x)
  lutY.push(p3y)

  const extrema: Points = []

  const boundingBox: Rect = {
    minX: Math.min(p0x, p3x),
    maxX: Math.max(p0x, p3x),
    minY: Math.min(p0y, p3y),
    maxY: Math.max(p0y, p3y),
  }

  extrema.push([p0x, p0y])

  const uniqueRoots = new Set<number>()
  for (const root of dx.roots) {
    uniqueRoots.add(root)
  }
  for (const root of dy.roots) {
    uniqueRoots.add(root)
  }

  const orderedRootsT = Array.from(new Set<number>([...dx.roots, ...dy.roots])).sort(
    (a, b) => a - b
  )

  for (const root of orderedRootsT) {
    const rx = roundTo(solveXForT(root), precisionX)
    const ry = roundTo(solveYForT(root), precisionY)

    const prevX = extrema[extrema.length - 1][0]
    const prevY = extrema[extrema.length - 1][1]

    if (
      rx < Math.min(prevX, p3x) ||
      rx > Math.max(prevX, p3x) ||
      ry < Math.min(prevY, p3y) ||
      ry > Math.max(prevY, p3y)
    ) {
      extrema.push([rx, ry])

      if (rx < boundingBox.minX) {
        boundingBox.minX = rx
      } else if (rx > boundingBox.maxX) {
        boundingBox.maxX = rx
      }
      if (ry < boundingBox.minY) {
        boundingBox.minY = ry
      } else if (ry > boundingBox.maxY) {
        boundingBox.maxY = ry
      }
    }
  }
  extrema.push([p3x, p3y])

  const solveX = createCubicBezierSegmentDimensionSolver(
    boundingBox.minY,
    boundingBox.maxY,
    boundingBox.minX,
    boundingBox.maxX,
    precisionY,
    precisionX,
    lutY,
    lutX
  )
  const solveY = createCubicBezierSegmentDimensionSolver(
    boundingBox.minX,
    boundingBox.maxX,
    boundingBox.minY,
    boundingBox.maxY,
    precisionX,
    precisionY,
    lutX,
    lutY
  )

  return {
    solveX,
    solveY,
    extrema,
    boundingBox,
    monotonicityX: dx.monotonicity,
    monotonicityY: dy.monotonicity,
    precisionX,
    precisionY,
  }
}
