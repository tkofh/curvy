import invariant from 'tiny-invariant'
import type { CubicScalars, Matrix4x4 } from './types'

export function toCubicScalars(
  values: Array<number>,
  stride: number,
): Array<CubicScalars> {
  const chunks: Array<CubicScalars> = []

  invariant(values.length >= 4, 'Values must have at least 4 elements')
  invariant(
    stride === 1 || stride === 2 || stride === 3,
    'Stride must be 1, 2, or 3',
  )
  if (stride === 3) {
    invariant(
      values.length % stride === 1,
      'Values length must be a multiple of 3 plus 1',
    )
  } else {
    invariant(
      values.length % stride === 0,
      `Values length must be a multiple of ${stride}`,
    )
  }

  for (let i = 0; i <= values.length - 4; i += stride) {
    chunks.push([
      values[i] as number,
      values[i + 1] as number,
      values[i + 2] as number,
      values[i + 3] as number,
    ])
  }
  return chunks
}

export const bezier: Matrix4x4 = [
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
]

export function toBezierSegments(values: Array<number>) {
  return toCubicScalars(values, 3)
}

export const hermite: Matrix4x4 = [
  [2, 1, -2, 1],
  [-3, -2, 3, -1],
  [0, 1, 0, 0],
  [1, 0, 0, 0],
]

export function toHermiteSegments(values: Array<number>) {
  return toCubicScalars(values, 2)
}

export const cardinal = (a: number): Matrix4x4 => [
  [-a, 2 - a, a - 2, a],
  [2 * a, a - 3, 3 - 2 * a, -a],
  [-a, 0, a, 0],
  [0, 1, 0, 0],
]

export function toCardinalSegments(values: Array<number>) {
  return toCubicScalars(values, 1)
}

export const catmullRom: Matrix4x4 = [
  [-0.5, 1.5, -1.5, 0.5],
  [1, -2.5, 2, -0.5],
  [-0.5, 0, 0.5, 0],
  [0, 1, 0, 0],
]

export function toCatmullRomSegments(values: Array<number>) {
  return toCubicScalars(values, 1)
}

const ONE_SIXTH = 1 / 6
export const bSpline: Matrix4x4 = [
  [-ONE_SIXTH, 0.5, -0.5, ONE_SIXTH],
  [0.5, -1, 0.5, 0],
  [-0.5, 0, 0.5, 0],
  [ONE_SIXTH, 4 * ONE_SIXTH, ONE_SIXTH, 0],
]

export function toBSplineSegments(values: Array<number>) {
  return toCubicScalars(values, 1)
}
