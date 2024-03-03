import type {
  BaseAxes,
  CubicPoints,
  CubicSpline,
  Point,
  Precision,
} from '@curvy/types'
import { bezier, createCubicUniformSpline } from '@curvy/uniform'

export const createCubicBezierSpline = <Axis extends BaseAxes>(
  points: Array<Point<Axis> | CubicPoints<Axis>>,
  precision?: Precision<Axis>,
  lutResolution?: number,
): CubicSpline<Axis> => {
  if (points.length === 0) {
    throw new Error('At least one cubic segment (four points) must be provided')
  }

  const curvePoints: Array<CubicPoints<Axis>> = []
  if (Array.isArray(points[0])) {
    curvePoints.push(...(points as Array<CubicPoints<Axis>>))
  } else {
    if (points.length < 4) {
      throw new Error(
        'At least one cubic segment (four points) must be provided',
      )
    }
    if ((points.length - 1) % 3 !== 0) {
      throw new Error('Point array must have a length of 3n+1')
    }

    for (let i = 0; i < (points.length - 1) / 3; i++) {
      curvePoints.push([
        points[i * 3] as Point<Axis>,
        points[i * 3 + 1] as Point<Axis>,
        points[i * 3 + 2] as Point<Axis>,
        points[i * 3 + 3] as Point<Axis>,
      ])
    }
  }

  return createCubicUniformSpline(curvePoints, bezier, precision, lutResolution)
}
