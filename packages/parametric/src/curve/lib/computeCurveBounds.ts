import { Bounds, PointObject } from '@curvy/types'

export const computeCurveBounds = (extrema: PointObject[]): Bounds =>
  extrema.slice(1).reduce<Bounds>(
    (bounds, extreme) => ({
      minX: Math.min(extreme.x, bounds.minX),
      maxX: Math.max(extreme.x, bounds.maxX),
      minY: Math.min(extreme.y, bounds.minY),
      maxY: Math.max(extreme.y, bounds.maxY),
    }),
    {
      minX: extrema[0].x,
      maxX: extrema[0].x,
      minY: extrema[0].y,
      maxY: extrema[0].y,
    }
  )
