// import type { CubicCoefficients } from './polynomial'
// import type { Matrix4x4Internal } from './splines'
// import { pointsToCoefficients } from './splines'
// import { invariant, round } from './util'

// // using ReadonlyArray<ReadonlyArray<number>> instead of Matrix4x4Internal because the algorithm is recursive
// // this means there need to be some extra assertions

// // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this is a complex algorithm
// function determinant(matrix: ReadonlyArray<ReadonlyArray<number>>) {
//   const size = matrix.length

//   invariant(
//     matrix.every((row) => row.length === size),
//     'matrix must be square',
//   )

//   let result = 0

//   const m0 = matrix[0] as ReadonlyArray<number>
//   const m00 = m0[0] as number

//   /* c8 ignore next 2 */
//   if (size === 1) {
//     result = m00 as number
//   } else if (size === 2) {
//     const m1 = matrix[1] as ReadonlyArray<number>
//     const m10 = m1[0] as number
//     const m01 = m0[1] as number
//     const m11 = m1[1] as number

//     result = m00 * m11 - m01 * m10
//   } else {
//     for (const [columnIndex, value] of m0.entries()) {
//       const subMatrix: Array<Array<number>> = []
//       for (const row of matrix.slice(1)) {
//         const subMatrixRow: Array<number> = []
//         for (const [subColumnIndex, subColumnValue] of row.entries()) {
//           if (subColumnIndex !== columnIndex) {
//             subMatrixRow.push(subColumnValue)
//           }
//         }
//         subMatrix.push(subMatrixRow)
//       }

//       result += (-1) ** (columnIndex + 2) * value * determinant(subMatrix)
//     }
//   }
//   return result
// }

// function solveLinearSystem(
//   coefficients: Matrix4x4Internal,
//   solutions: CubicCoefficients,
// ): CubicCoefficients {
//   const coefficientDeterminant = determinant(coefficients)

//   invariant(
//     coefficientDeterminant !== 0,
//     'Cannot solve system of equations when coefficient matrix determinant is zero',
//   )

//   const variables: [number, number, number, number] = [0, 0, 0, 0]

//   for (let index = 0; index < solutions.length; index++) {
//     const solutionMatrix: Array<Array<number>> = []
//     for (const [rowIndex, row] of coefficients.entries()) {
//       const solutionMatrixRow: Array<number> = []
//       for (const [columnIndex, column] of row.entries()) {
//         solutionMatrixRow.push(
//           columnIndex === index ? (solutions[rowIndex] as number) : column,
//         )
//       }
//       solutionMatrix.push(solutionMatrixRow)
//     }

//     variables[index] = determinant(solutionMatrix) / coefficientDeterminant
//   }

//   return variables as CubicCoefficients
// }

// export function convertScalars(
//   points: CubicCoefficients,
//   sourceSpline: Matrix4x4Internal,
//   targetSpline: Matrix4x4Internal,
// ): CubicCoefficients {
//   const solutions = solveLinearSystem(
//     targetSpline,
//     // matrix vector
//     pointsToCoefficients(sourceSpline, points),
//   )

//   return [
//     round(solutions[0]),
//     round(solutions[1]),
//     round(solutions[2]),
//     round(solutions[3]),
//   ]
// }
