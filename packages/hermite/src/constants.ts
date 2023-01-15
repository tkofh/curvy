import type { Matrix4x3, Matrix4x4 } from '@curvy/types'

export const HERMITE_BASE_SCALAR_MATRIX: Matrix4x4 = [
  [2, -3, 0, 1],
  [1, -2, 1, 0],
  [1, -1, 0, 0],
  [-2, 3, 0, 0],
]

export const HERMITE_PRIME_SCALAR_MATRIX: Matrix4x3 = [
  [6, -6, 0],
  [3, -4, 1],
  [3, -2, 0],
  [-6, 6, 0],
]
