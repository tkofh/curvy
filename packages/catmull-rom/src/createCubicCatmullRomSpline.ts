import type { BaseAxes, CubicPoints, CubicSpline, Point, Precision } from '@curvy/types'
import { catmullRom, createCubicUniformSpline } from '@curvy/uniform'
import { computeCatmullRomCubicPoints } from './computeCatmullRomCubicPoints'

export const createCubicCatmullRomSpline = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[],
  precision?: Precision<TAxis>,
  lutResolution?: number
): CubicSpline<TAxis> =>
  createCubicUniformSpline(
    computeCatmullRomCubicPoints(points),
    catmullRom,
    precision,
    lutResolution
  )
