import { Bounds, LUTEntry, Monotonicity, PointObject, Spline, SplineMetadata } from '@curvy/types'
import { collapseExtrema } from '../../common'

export const computeSplineMeta = (curves: Spline[]): SplineMetadata => {
  const bounds: Bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 }
  let length = 0
  let monotonicityX: Monotonicity = 'none'
  let monotonicityY: Monotonicity = 'none'
  const extremaCandidates: PointObject[] = []
  const lut: LUTEntry[] = []

  for (const [index, curve] of curves.entries()) {
    if (index === 0 || curve.meta.bounds.minX < bounds.minX) {
      bounds.minX = curve.meta.bounds.minX
    }
    if (index === 0 || curve.meta.bounds.minY < bounds.minY) {
      bounds.minY = curve.meta.bounds.minY
    }
    if (index === 0 || curve.meta.bounds.maxX > bounds.maxX) {
      bounds.maxX = curve.meta.bounds.maxX
    }
    if (index === 0 || curve.meta.bounds.maxY > bounds.maxY) {
      bounds.maxY = curve.meta.bounds.maxY
    }

    if (index === 0) {
      monotonicityX = curve.meta.monotonicityX
    } else if (curve.meta.monotonicityX !== monotonicityX) {
      monotonicityX = 'none'
    }
    if (index === 0) {
      monotonicityY = curve.meta.monotonicityY
    } else if (curve.meta.monotonicityY !== monotonicityY) {
      monotonicityY = 'none'
    }

    for (const entry of curve.meta.lut) {
      lut.push({
        x: entry.x,
        y: entry.y,
        t: (index + entry.t) / curves.length,
        length: length + entry.length,
      })
    }

    length += curve.meta.length

    extremaCandidates.push(...curve.meta.extrema.slice(Math.min(index, 1)))
  }

  const extrema = collapseExtrema(extremaCandidates)

  return {
    lut,
    length,
    monotonicityY,
    monotonicityX,
    bounds,
    extrema,
    precisionX: curves[0].meta.precisionX,
    precisionY: curves[0].meta.precisionY,
  }
}
