import type {
  BaseAxes,
  CubicPoints,
  CubicSpline,
  Point,
  Precision,
} from '@curvy/types'
import { createCubicUniformSpline, hermite } from '@curvy/uniform'

export const createCubicHermiteSpline = <Axis extends BaseAxes>(
  points: Array<Point<Axis> | CubicPoints<Axis>>,
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

    if (points.length % 2 !== 0) {
      throw new Error(
        'An even number of points and velocities must be provided',
      )
    }

    for (let i = 0; i < points.length / 2; i++) {
      cubicPoints.push([
        points[i * 2] as Point<Axis>,
        points[i * 2 + 1] as Point<Axis>,
        points[i * 2 + 2] as Point<Axis>,
        points[i * 2 + 3] as Point<Axis>,
      ])
    }
  }

  return createCubicUniformSpline(
    cubicPoints,
    hermite,
    precision,
    lutResolution,
  )
}
