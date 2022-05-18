import { PointObject, Spline, SplineMetadata } from '@curvy/types'
import { collapseExtrema } from '../../common'

export const computeSplineMeta = (curves: Spline[]): SplineMetadata => {
  const bounds = { ...curves[0].meta.bounds }
  let length = curves[0].meta.length
  let monotonicityX = curves[0].meta.monotonicityX
  let monotonicityY = curves[0].meta.monotonicityY
  const extremaCandidates: PointObject[] = [...curves[0].meta.extrema]

  for (const curve of curves.slice(1)) {
    if (curve.meta.bounds.minX < bounds.minX) {
      bounds.minX = curve.meta.bounds.minX
    }
    if (curve.meta.bounds.minY < bounds.minY) {
      bounds.minY = curve.meta.bounds.minY
    }
    if (curve.meta.bounds.maxX > bounds.maxX) {
      bounds.maxX = curve.meta.bounds.maxX
    }
    if (curve.meta.bounds.maxY > bounds.maxY) {
      bounds.maxY = curve.meta.bounds.maxY
    }

    if (curve.meta.monotonicityX !== monotonicityX) {
      monotonicityX = 'none'
    }
    if (curve.meta.monotonicityY !== monotonicityY) {
      monotonicityY = 'none'
    }

    length += curve.meta.length

    extremaCandidates.push(...curve.meta.extrema.slice(1))
  }

  const extrema = collapseExtrema(extremaCandidates)

  return {
    length,
    monotonicityY,
    monotonicityX,
    bounds,
    extrema,
    precisionX: curves[0].meta.precisionX,
    precisionY: curves[0].meta.precisionY,
  }
}
