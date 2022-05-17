import { Points, Rect } from '@curvy/types'

export const getBoundingBox = (extrema: Points): Rect => {
  const bounds: Rect = {
    minX: extrema[0][0],
    maxX: extrema[0][0],
    minY: extrema[0][1],
    maxY: extrema[0][1],
  }

  for (const point of extrema.slice(1)) {
    if (point[0] < bounds.minX) {
      bounds.minX = point[0]
    } else if (point[0] > bounds.maxX) {
      bounds.maxX = point[0]
    }

    if (point[1] < bounds.minY) {
      bounds.minY = point[1]
    } else if (point[1] > bounds.maxY) {
      bounds.maxY = point[1]
    }
  }

  return bounds
}
