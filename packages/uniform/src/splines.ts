import type { Matrix4x4 } from '@curvy/types'

export const bezier: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]

export const hermite: Matrix4x4 = [
  [2, 1, -2, 1],
  [-3, -2, 3, -1],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
]

export const cardinal = (a: number): Matrix4x4 => [
  [-a, 2 - a, a - 2, a],
  [2 * a, a - 3, 3 - 2 * a, -a],
  [-a, 0, a, 0],
  [0, 1, 0, 0],
]

export const catmullRom: Matrix4x4 = [
  [-0.5, 1.5, -1.5, 0.5],
  [1, -2.5, 2, -0.5],
  [-0.5, 0, 0.5, 0],
  [0, 1, 0, 0],
]

const ONE_SIXTH = 1 / 6
export const bSpline: Matrix4x4 = [
  [-ONE_SIXTH, 0.5, -0.5, ONE_SIXTH],
  [0.5, -1, 0.5, 0],
  [-0.5, 0, 0.5, 0],
  [ONE_SIXTH, 4 * ONE_SIXTH, ONE_SIXTH, 0],
]
