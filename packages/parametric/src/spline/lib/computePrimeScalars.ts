import { Matrix4x3, Matrix4x4 } from '@curvy/types'

export const computePrimeScalars = (base: Matrix4x4): Matrix4x3 => [
  [base[0][0] * 3, base[0][1] * 2, base[0][2]],
  [base[1][0] * 3, base[1][1] * 2, base[1][2]],
  [base[2][0] * 3, base[2][1] * 2, base[2][2]],
  [base[3][0] * 3, base[3][1] * 2, base[3][2]],
]
