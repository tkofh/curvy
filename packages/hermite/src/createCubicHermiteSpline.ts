import type { BaseAxes, CubicPoints, CubicSpline, Point, Precision } from '@curvy/types'
import { createCubicUniformSpline, hermite } from '@curvy/uniform'

export const createCubicHermiteSpline = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[],
  precision?: Precision<TAxis>,
  lutResolution?: number
): CubicSpline<TAxis> => {
  if (points.length === 0) {
    throw new Error('At least one cubic segment (four points) must be provided')
  }

  const cubicPoints: CubicPoints<TAxis>[] = []

  if (Array.isArray(points[0])) {
    cubicPoints.push(...(points as CubicPoints<TAxis>[]))
  } else {
    if (points.length < 4) {
      throw new Error('At least one cubic segment (four points) must be provided')
    }

    if (points.length % 2 !== 0) {
      throw new Error('An even number of points and velocities must be provided')
    }

    for (let i = 0; i < points.length / 2; i++) {
      cubicPoints.push([
        points[i * 2] as Point<TAxis>,
        points[i * 2 + 1] as Point<TAxis>,
        points[i * 2 + 2] as Point<TAxis>,
        points[i * 2 + 3] as Point<TAxis>,
      ])
    }
  }

  return createCubicUniformSpline(cubicPoints, hermite, precision, lutResolution)
}
