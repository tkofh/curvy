import { PointObject } from '@curvy/types'
import { cubicPolynomial, roundTo } from '@curvy/math'
import { collapseExtrema } from '../../common'

export const computeCurveExtrema = (
  baseScalarsX: [number, number, number, number],
  baseScalarsY: [number, number, number, number],
  primeRoots: number[],
  precisionX: number,
  precisionY: number
): PointObject[] => {
  const extremaCandidates: PointObject[] = []

  for (const root of primeRoots) {
    const candidate = {
      x: roundTo(cubicPolynomial(root, ...baseScalarsX), precisionX),
      y: roundTo(cubicPolynomial(root, ...baseScalarsY), precisionY),
    }

    extremaCandidates.push(candidate)
  }

  return collapseExtrema(extremaCandidates)
}
