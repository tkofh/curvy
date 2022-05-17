import { distance } from '@curvy/math'

export const getLengthLUT = (lutX: number[], lutY: number[]): number[] => {
  const lut: number[] = [0]

  for (let s = 1; s < lutX.length; s++) {
    lut.push(lut[s - 1] + distance(lutX[s - 1], lutY[s - 1], lutX[s], lutY[s]))
  }

  return lut
}
