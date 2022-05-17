import { Points } from '@curvy/types'

export const collapseExtrema = (candidates: Points): Points =>
  candidates.reduce<Points>((extrema, candidate, index, candidates) => {
    if (index === 0 || index === candidates.length - 1) {
      extrema.push(candidate)
    } else {
      const [currentX, currentY] = candidate
      const [previousX, previousY] = extrema[extrema.length - 1]
      const [nextX, nextY] = candidates[index + 1]

      if (
        currentX <= Math.min(previousX, nextX) ||
        currentX >= Math.max(previousX, nextX) ||
        currentY <= Math.min(previousY, nextY) ||
        currentY >= Math.max(previousY, nextY)
      ) {
        extrema.push(candidate)
      }
    }

    return extrema
  }, [])
