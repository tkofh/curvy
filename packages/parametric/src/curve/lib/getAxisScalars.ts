import { Matrix4x4 } from '@curvy/types'

export const getAxisScalars = (
  matrix: Matrix4x4,
  p0: number,
  p1: number,
  p2: number,
  p3: number
) => [
  p0 * matrix[0][0] + p1 * matrix[1][0] + p2 * matrix[2][0] + p3 * matrix[3][0],
  p0 * matrix[0][1] + p1 * matrix[1][1] + p2 * matrix[2][1] + p3 * matrix[3][1],
  p0 * matrix[0][2] + p1 * matrix[1][2] + p2 * matrix[2][2] + p3 * matrix[3][2],
  p0 * matrix[0][3] + p1 * matrix[1][3] + p2 * matrix[2][3] + p3 * matrix[3][3],
]
