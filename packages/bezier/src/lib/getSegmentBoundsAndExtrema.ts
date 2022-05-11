import { Points, Rect } from '@curvy/types'
import { roundTo } from '@curvy/math'

export const getSegmentBoundsAndExtrema = (
  precisionX: number,
  precisionY: number,
  p0x: number,
  p0y: number,
  p3x: number,
  p3y: number,
  solveXForT: (t: number) => number,
  solveYForT: (t: number) => number,
  rootsX: number[],
  rootsY: number[]
) => {
  const extrema: Points = [[p0x, p0y]]

  const boundingBox: Rect = {
    minX: Math.min(p0x, p3x),
    maxX: Math.max(p0x, p3x),
    minY: Math.min(p0y, p3y),
    maxY: Math.max(p0y, p3y),
  }

  const orderedRootsT = Array.from(new Set<number>([...rootsX, ...rootsY])).sort((a, b) => a - b)

  for (const root of orderedRootsT) {
    const rx = roundTo(solveXForT(root), precisionX)
    const ry = roundTo(solveYForT(root), precisionY)

    const prevX = extrema[extrema.length - 1][0]
    const prevY = extrema[extrema.length - 1][1]

    if (
      rx < Math.min(prevX, p3x) ||
      rx > Math.max(prevX, p3x) ||
      ry < Math.min(prevY, p3y) ||
      ry > Math.max(prevY, p3y)
    ) {
      extrema.push([rx, ry])

      if (rx < boundingBox.minX) {
        boundingBox.minX = rx
      } else if (rx > boundingBox.maxX) {
        boundingBox.maxX = rx
      }
      if (ry < boundingBox.minY) {
        boundingBox.minY = ry
      } else if (ry > boundingBox.maxY) {
        boundingBox.maxY = ry
      }
    }
  }
  extrema.push([p3x, p3y])

  return {
    boundingBox,
    extrema,
  }
}
