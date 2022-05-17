import { Points, Spline } from '@curvy/types'
import { collapseExtrema } from '../../common'

export const getExtrema = (curves: Spline[]): Points => {
  const extremaCandidates: Points = [...(curves[0].extrema as Points)]

  for (const curve of curves.slice(1)) {
    extremaCandidates.push(...(curve.extrema.slice(1) as Points))
  }

  return collapseExtrema(extremaCandidates)
}
