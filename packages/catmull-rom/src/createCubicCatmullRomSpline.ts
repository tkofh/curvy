import type {
  BaseAxes,
  CubicPoints,
  CubicSpline,
  Point,
  Precision,
} from '@curvy/types'
import { catmullRom, createCubicUniformSpline } from '@curvy/uniform'
import { computeCatmullRomCubicPoints } from './computeCatmullRomCubicPoints'

export const createCubicCatmullRomSpline = <Axis extends BaseAxes>(
  points: Array<Point<Axis> | CubicPoints<Axis>>,
  precision?: Precision<Axis>,
  lutResolution?: number,
): CubicSpline<Axis> =>
  createCubicUniformSpline(
    computeCatmullRomCubicPoints(points),
    catmullRom,
    precision,
    lutResolution,
  )
