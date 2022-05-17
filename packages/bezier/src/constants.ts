import { Matrix4x3, Matrix4x4 } from '@curvy/types'

export const BEZIER_BASE_SCALAR_MATRIX: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]

export const BEZIER_PRIME_SCALAR_MATRIX: Matrix4x3 = [
  [-3, 6, -3],
  [9, -12, 3],
  [-9, 6, 0],
  [3, 0, 0],
]
