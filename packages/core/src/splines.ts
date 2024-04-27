import type { CubicCoefficients } from './polynomial'
import { invariant } from './util'

export type Matrix4x4 = readonly [
  CubicCoefficients,
  CubicCoefficients,
  CubicCoefficients,
  CubicCoefficients,
]

export type Spline = {
  matrix: Matrix4x4
  chunkCoefficients: (
    parameters: ReadonlyArray<number>,
  ) => ReadonlyArray<CubicCoefficients>
}

function chunkPointsBy(
  values: ReadonlyArray<number>,
  stride: number,
): Array<CubicCoefficients> {
  const chunks: Array<CubicCoefficients> = []

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

export function pointsToCoefficients(
  matrix: Matrix4x4,
  parameters: CubicCoefficients,
): CubicCoefficients {
  return [
    parameters[0] * matrix[0][0] +
      parameters[1] * matrix[0][1] +
      parameters[2] * matrix[0][2] +
      parameters[3] * matrix[0][3],
    parameters[0] * matrix[1][0] +
      parameters[1] * matrix[1][1] +
      parameters[2] * matrix[1][2] +
      parameters[3] * matrix[1][3],
    parameters[0] * matrix[2][0] +
      parameters[1] * matrix[2][1] +
      parameters[2] * matrix[2][2] +
      parameters[3] * matrix[2][3],
    parameters[0] * matrix[3][0] +
      parameters[1] * matrix[3][1] +
      parameters[2] * matrix[3][2] +
      parameters[3] * matrix[3][3],
  ]
}

export const bezier: Spline = {
  matrix: [
    [-1, 3, -3, 1],
    [3, -6, 3, 0],
    [-3, 3, 0, 0],
    [1, 0, 0, 0],
  ],
  chunkCoefficients(parameters) {
    const coefficients: Array<CubicCoefficients> = []
    for (const chunk of chunkPointsBy(parameters, 3)) {
      coefficients.push(pointsToCoefficients(this.matrix, chunk))
    }
    return coefficients
  },
}

export const hermite: Spline = {
  matrix: [
    [2, 1, -2, 1],
    [-3, -2, 3, -1],
    [0, 1, 0, 0],
    [1, 0, 0, 0],
  ],
  chunkCoefficients(parameters) {
    const coefficients: Array<CubicCoefficients> = []
    for (const chunk of chunkPointsBy(parameters, 2)) {
      coefficients.push(pointsToCoefficients(this.matrix, chunk))
    }
    return coefficients
  },
}

export const cardinal = (a: number, duplicateEndpoints = true): Spline => ({
  matrix: [
    [-a, 2 - a, a - 2, a],
    [2 * a, a - 3, 3 - 2 * a, -a],
    [-a, 0, a, 0],
    [0, 1, 0, 0],
  ],
  chunkCoefficients(parameters) {
    const coefficients: Array<CubicCoefficients> = []
    for (const chunk of chunkPointsBy(
      duplicateEndpoints
        ? [parameters[0], ...parameters, parameters[parameters.length - 1]]
        : parameters,
      1,
    )) {
      coefficients.push(pointsToCoefficients(this.matrix, chunk))
    }
    return coefficients
  },
})

export const catmullRom = (duplicateEndpoints = true): Spline => ({
  matrix: [
    [-0.5, 1.5, -1.5, 0.5],
    [1, -2.5, 2, -0.5],
    [-0.5, 0, 0.5, 0],
    [0, 1, 0, 0],
  ],
  chunkCoefficients(parameters) {
    const coefficients: Array<CubicCoefficients> = []
    for (const chunk of chunkPointsBy(
      duplicateEndpoints
        ? [parameters[0], ...parameters, parameters[parameters.length - 1]]
        : parameters,
      1,
    )) {
      coefficients.push(pointsToCoefficients(this.matrix, chunk))
    }
    return coefficients
  },
})

const ONE_SIXTH = 1 / 6

export const basis = (triplicateEndpoints = true): Spline => ({
  matrix: [
    [-ONE_SIXTH, 0.5, -0.5, ONE_SIXTH],
    [0.5, -1, 0.5, 0],
    [-0.5, 0, 0.5, 0],
    [ONE_SIXTH, 4 * ONE_SIXTH, ONE_SIXTH, 0],
  ],
  chunkCoefficients(parameters) {
    const coefficients: Array<CubicCoefficients> = []
    for (const chunk of chunkPointsBy(
      triplicateEndpoints
        ? [
            parameters[0],
            parameters[0],
            ...parameters,
            parameters[parameters.length - 1],
            parameters[parameters.length - 1],
          ]
        : parameters,
      1,
    )) {
      coefficients.push(pointsToCoefficients(this.matrix, chunk))
    }
    return coefficients
  },
})

export const splines = {
  basis,
  bezier,
  cardinal,
  catmullRom,
  hermite,
} as const
