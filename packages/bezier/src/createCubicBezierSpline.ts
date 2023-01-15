import { createCubicUniformSpline } from '@curvy/uniform'
import type { BaseAxes, CubicPoints, CubicSpline, Point, Precision } from '@curvy/types'

export const createCubicBezierSpline = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[],
  precision?: Precision<TAxis>,
  lutResolution?: number
): CubicSpline<TAxis> =>
  createCubicUniformSpline(
    points,
    [
      [-1, 3, -3, 1],
      [3, -6, 3, 0],
      [-3, 3, 0, 0],
      [1, 0, 0, 0],
    ],
    precision,
    lutResolution
  )
