import { Bounds, LUTEntry, Monotonicity, PointObject, Spline, SplineMetadata } from '@curvy/types'
import { collapseExtrema } from '../../common'

export const computeSplineMeta = (curves: Spline[]): SplineMetadata => {
  const bounds: Bounds = {
    x: { min: 0, max: 0 },
    y: { min: 0, max: 0 },
  }
  let length = 0
  let monotonicityX: Monotonicity = 'none'
  let monotonicityY: Monotonicity = 'none'
  const extremaCandidates: PointObject[] = []
  const lut: LUTEntry[] = []

  for (const [index, curve] of curves.entries()) {
    if (index === 0 || curve.meta.bounds.x.min < bounds.x.min) {
      bounds.x.min = curve.meta.bounds.x.min
    }
    if (index === 0 || curve.meta.bounds.y.min < bounds.y.min) {
      bounds.y.min = curve.meta.bounds.y.min
    }
    if (index === 0 || curve.meta.bounds.x.max > bounds.x.max) {
      bounds.x.max = curve.meta.bounds.x.max
    }
    if (index === 0 || curve.meta.bounds.y.max > bounds.y.max) {
      bounds.y.max = curve.meta.bounds.y.max
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
