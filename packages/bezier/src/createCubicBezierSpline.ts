import type { BaseAxes, CubicPoints, CubicSpline, Point, Precision } from '@curvy/types'
import { bezier, createCubicUniformSpline } from '@curvy/uniform'

export const createCubicBezierSpline = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[],
  precision?: Precision<TAxis>,
  lutResolution?: number
): CubicSpline<TAxis> => {
  if (points.length === 0) {
    throw new Error('At least one cubic segment (four points) must be provided')
  }

  const curvePoints: CubicPoints<TAxis>[] = []
  if (Array.isArray(points[0])) {
    curvePoints.push(...(points as CubicPoints<TAxis>[]))
  } else {
    if (points.length < 4) {
      throw new Error('At least one cubic segment (four points) must be provided')
    }
    if ((points.length - 1) % 3 !== 0) {
      throw new Error('Point array must have a length of 3n+1')
    }

    for (let i = 0; i < (points.length - 1) / 3; i++) {
      curvePoints.push([
        points[i * 3] as Point<TAxis>,
        points[i * 3 + 1] as Point<TAxis>,
        points[i * 3 + 2] as Point<TAxis>,
        points[i * 3 + 3] as Point<TAxis>,
      ])
    }
  }

  return createCubicUniformSpline(curvePoints, bezier, precision, lutResolution)
}
