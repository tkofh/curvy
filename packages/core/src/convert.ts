import invariant from 'tiny-invariant'
import type { CubicCoefficients } from './polynomial'
import { pointsToCoefficients } from './splines'
import type { Matrix4x4 } from './splines'
import { round } from './util'

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is a complex algorithm
function determinant(matrix: ReadonlyArray<ReadonlyArray<number>>) {
  const size = matrix.length

  invariant(
    matrix.every((row) => row.length === size),
    'matrix must be square',
  )

  let result = 0
  /* c8 ignore next 2 */
  if (size === 1) {
    result = matrix[0][0]
  } else if (size === 2) {
    result = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
  } else {
    for (const [columnIndex, value] of matrix[0].entries()) {
      const subMatrix: Array<Array<number>> = []
      for (const row of matrix.slice(1)) {
        const subMatrixRow: Array<number> = []
        for (const [subColumnIndex, subColumnValue] of row.entries()) {
          if (subColumnIndex !== columnIndex) {
            subMatrixRow.push(subColumnValue)
          }
        }
        subMatrix.push(subMatrixRow)
      }

      result =
        result + (-1) ** (columnIndex + 2) * value * determinant(subMatrix)
    }
  }
  return result
}

function solveLinearSystem(
  coefficients: Matrix4x4,
  solutions: CubicCoefficients,
): CubicCoefficients {
  const coefficientDeterminant = determinant(coefficients)

  invariant(
    coefficientDeterminant !== 0,
    'Cannot solve system of equations when coefficient matrix determinant is zero',
  )

  const variables: [number, number, number, number] = [0, 0, 0, 0]

  for (let index = 0; index < solutions.length; index++) {
    const solutionMatrix: Array<Array<number>> = []
    for (const [rowIndex, row] of coefficients.entries()) {
      const solutionMatrixRow: Array<number> = []
      for (const [columnIndex, column] of row.entries()) {
        solutionMatrixRow.push(
          columnIndex === index ? solutions[rowIndex] : column,
        )
      }
      solutionMatrix.push(solutionMatrixRow)
    }

    variables[index] = determinant(solutionMatrix) / coefficientDeterminant
  }

  return variables as CubicCoefficients
}

export function convertScalars(
  points: CubicCoefficients,
  sourceSpline: Matrix4x4,
  targetSpline: Matrix4x4,
): CubicCoefficients {
  const solutions = solveLinearSystem(
    targetSpline,
    pointsToCoefficients(sourceSpline, points),
  )

  return [
    round(solutions[0]),
    round(solutions[1]),
    round(solutions[2]),
    round(solutions[3]),
  ]
}
