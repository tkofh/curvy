import { PointObject } from '@curvy/types'

export const collapseExtrema = (candidates: Array<PointObject>): Array<PointObject> =>
  candidates.reduce<Array<PointObject>>((extrema, candidate, index, candidates) => {
    if (index === 0 || index === candidates.length - 1) {
      extrema.push(candidate)
    } else {
      const previous = extrema[extrema.length - 1]
      const next = candidates[index + 1]

      if (
        candidate.x <= Math.min(previous.x, next.x) ||
        candidate.x >= Math.max(previous.x, next.x) ||
        candidate.y <= Math.min(previous.y, next.y) ||
        candidate.y >= Math.max(previous.y, next.y)
      ) {
        extrema.push(candidate)
      }
    }

    return extrema
  }, [])
