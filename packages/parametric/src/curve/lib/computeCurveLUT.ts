import { cubicPolynomial, distance } from '@curvy/math'
import { LUTEntry } from '../types'

export const computeCurveLUT = (
  baseScalarsX: [number, number, number, number],
  baseScalarsY: [number, number, number, number],
  samples: number
): LUTEntry[] => {
  const lut: LUTEntry[] = []

  for (let s = 0; s < samples; s++) {
    const t = s / (samples - 1)

    const x = cubicPolynomial(t, ...baseScalarsX)
    const y = cubicPolynomial(t, ...baseScalarsY)

    let length = 0
    if (s > 0) {
      const prev = lut[s - 1]
      length = prev.length + distance(prev.x, prev.y, x, y)
    }

    lut.push({ t, x, y, length })
  }

  return lut
}
