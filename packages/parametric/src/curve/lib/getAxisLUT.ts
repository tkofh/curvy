import { cubicPolynomial } from '@curvy/math'

export const getAxisLUT = (
  resolution: number,
  a: number,
  b: number,
  c: number,
  d: number
): number[] => {
  const lut: number[] = []

  for (let s = 0; s < resolution; s++) {
    const t = s / (resolution - 1)
    lut.push(cubicPolynomial(t, a, b, c, d))
  }

  return lut
}
