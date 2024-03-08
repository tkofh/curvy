import type {
  BaseAxes,
  CubicPoints,
  CubicSpline,
  Point,
  Precision,
} from '@curvy/types'
import { cardinal, createCubicUniformSpline } from '@curvy/uniform'

export const createCubicCardinalSpline = <Axis extends BaseAxes>(
  points: Array<Point<Axis> | CubicPoints<Axis>>,
  tension = 0.5,
  precision?: Precision<Axis>,
  lutResolution?: number,
): CubicSpline<Axis> => {
  if (points.length === 0) {
    throw new Error('At least one cubic segment (four points) must be provided')
  }

  const cubicPoints: Array<CubicPoints<Axis>> = []

  if (Array.isArray(points[0])) {
    cubicPoints.push(...(points as Array<CubicPoints<Axis>>))
  } else {
    if (points.length < 4) {
      throw new Error(
        'At least one cubic segment (four points) must be provided',
      )
    }

    for (let i = 0; i < points.length - 3; i++) {
      cubicPoints.push([
        points[i] as Point<Axis>,
        points[i + 1] as Point<Axis>,
        points[i + 2] as Point<Axis>,
        points[i + 3] as Point<Axis>,
      ])
    }
  }

  return createCubicUniformSpline(
    cubicPoints,
    cardinal(tension),
    precision,
    lutResolution,
  )
}
