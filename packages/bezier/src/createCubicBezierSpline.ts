import { bezier, createCubicUniformSpline } from '@curvy/uniform'
import type { BaseAxes, CubicPoints, CubicSpline, Point, Precision } from '@curvy/types'

export const createCubicBezierSpline = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[],
  precision?: Precision<TAxis>,
  lutResolution?: number
): CubicSpline<TAxis> => createCubicUniformSpline(points, bezier, precision, lutResolution)
