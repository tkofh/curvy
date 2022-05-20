import { cubicPolynomial, distance, roundTo } from '@curvy/math'
import { LUTEntry } from '@curvy/types'

export const computeCurveLUT = (
  baseScalarsX: [number, number, number, number],
  baseScalarsY: [number, number, number, number],
  sampleCount: number,
  fixedSamples: number[],
  precisionX: number,
  precisionY: number
): LUTEntry[] => {
  const lut: LUTEntry[] = []

  const uniqueSamples = new Set([...fixedSamples])
  for (let s = 0; s < sampleCount; s++) {
    uniqueSamples.add(s / (sampleCount - 1))
  }

  const samples = Array.from(uniqueSamples).sort((a, b) => a - b)

  for (const [sample, t] of samples.entries()) {
    let x = cubicPolynomial(t, ...baseScalarsX)
    let y = cubicPolynomial(t, ...baseScalarsY)

    // round fixed samples to the curve's precision to ensure spline.solveX(extreme.y) === extreme.x and vice versa
    if (fixedSamples.includes(t)) {
      x = roundTo(x, precisionX)
      y = roundTo(y, precisionY)
    }

    let length = 0
    if (sample > 0) {
      const prev = lut[sample - 1]
      length = prev.length + distance(prev.x, prev.y, x, y)
    }

    lut.push({ t, x, y, length })
  }

  return lut
}
