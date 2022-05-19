import { SplineMetadata, PointObject, Bounds, LUTEntry } from '@curvy/types'
import { cubicPolynomial, roundTo } from '@curvy/math'
import { collapseExtrema } from '../../common'
import { getAxisPrimeRoots } from './getAxisPrimeRoots'
import { getAxisMonotonicity } from './getAxisMonotonicity'

export const computeCurveMeta = (
  baseScalarsX: [number, number, number, number],
  baseScalarsY: [number, number, number, number],
  primeScalarsX: [number, number, number],
  primeScalarsY: [number, number, number],
  precisionX: number,
  precisionY: number,
  lut: LUTEntry[]
): SplineMetadata => {
  const primeRootsX = getAxisPrimeRoots(...primeScalarsX)
  const primeRootsY = getAxisPrimeRoots(...primeScalarsY)

  const monotonicityX = getAxisMonotonicity(primeRootsX, primeScalarsX)
  const monotonicityY = getAxisMonotonicity(primeRootsY, primeScalarsY)

  const lutStart = lut[0]
  const lutEnd = lut[lut.length - 1]

  const bounds: Bounds = {
    minX: Math.min(lutStart.x, lutEnd.x),
    minY: Math.min(lutStart.y, lutEnd.y),
    maxX: Math.max(lutStart.x, lutEnd.x),
    maxY: Math.max(lutStart.y, lutEnd.y),
  }

  const extremaCandidates: PointObject[] = []

  const orderedPrimeRoots = Array.from(new Set([0, 1, ...primeRootsX, ...primeRootsY])).sort(
    (a, b) => a - b
  )

  for (const root of orderedPrimeRoots) {
    const candidate = {
      x: roundTo(cubicPolynomial(root, ...baseScalarsX), precisionX),
      y: roundTo(cubicPolynomial(root, ...baseScalarsY), precisionY),
    }

    extremaCandidates.push(candidate)

    if (candidate.x < bounds.minX) {
      bounds.minX = candidate.x
    } else if (candidate.x > bounds.maxX) {
      bounds.maxX = candidate.x
    }

    if (candidate.y < bounds.minY) {
      bounds.minY = candidate.y
    } else if (candidate.y > bounds.maxY) {
      bounds.maxY = candidate.y
    }
  }

  const extrema = collapseExtrema(extremaCandidates)

  return {
    extrema,
    bounds,
    monotonicityY,
    monotonicityX,
    precisionY,
    precisionX,
    length: lutEnd.length,
    lut,
  }
}
