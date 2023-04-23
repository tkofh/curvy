import type { BaseAxes, Point, CubicPoints } from '@curvy/types'

export const computeCatmullRomCubicPoints = <TAxis extends BaseAxes>(
  points: (Point<TAxis> | CubicPoints<TAxis>)[]
): CubicPoints<TAxis>[] => {
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

    for (let i = 0; i < points.length - 3; i++) {
      cubicPoints.push([
        points[i] as Point<TAxis>,
        points[i + 1] as Point<TAxis>,
        points[i + 2] as Point<TAxis>,
        points[i + 3] as Point<TAxis>,
      ])
    }
  }

  return cubicPoints
}
