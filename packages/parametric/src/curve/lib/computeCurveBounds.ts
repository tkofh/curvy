import { Bounds, PointObject } from '@curvy/types'

export const computeCurveBounds = (extrema: PointObject[]): Bounds =>
  extrema.slice(1).reduce(
    (bounds, extreme) => {
      if (extreme.x < bounds.x.min) {
        bounds.x.min = extreme.x
      } else if (extreme.x > bounds.x.max) {
        bounds.x.max = extreme.x
      }

      if (extreme.y < bounds.y.min) {
        bounds.y.min = extreme.y
      } else if (extreme.y > bounds.y.max) {
        bounds.y.max = extreme.y
      }

      return bounds
    },
    {
      x: { min: extrema[0].x, max: extrema[0].x },
      y: { min: extrema[0].y, max: extrema[0].y },
    }
  )
