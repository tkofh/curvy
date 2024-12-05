// import type { AxisInput } from './axis'
// import type { Curve } from './curve'
// import type { Matrix4x4Internal } from './matrix/matrix4x4'
// import type { CubicCoefficients } from './polynomial'
// import { invariant, objectEntries } from './util'
// import { type Vector4, vector4 } from './vector/vector4'

// class Spline {
//   readonly matrix: Matrix4x4Internal

//   private readonly stride: number

//   constructor(matrix: Matrix4x4Internal, stride = 1) {
//     this.matrix = matrix
//     this.stride = stride
//   }

//   chunkPoints(points: ReadonlyArray<number>): ReadonlyArray<Vector4> {
//     invariant(points.length >= 4, 'Values must have at least 4 elements')
//     invariant(
//       this.stride === 1 || this.stride === 2 || this.stride === 3,
//       'Stride must be 1, 2, or 3',
//     )
//     if (this.stride === 3) {
//       invariant(
//         points.length % this.stride === 1,
//         'Values length must be a multiple of 3 plus 1',
//       )
//     } else {
//       invariant(
//         points.length % this.stride === 0,
//         `Values length must be a multiple of ${this.stride}`,
//       )
//     }

//     const chunks: Array<Vector4> = []

//     for (let i = 0; i <= points.length - 4; i += this.stride) {
//       chunks.push(
//         vector4(
//           points[i] as number,
//           points[i + 1] as number,
//           points[i + 2] as number,
//           points[i + 3] as number,
//         ),
//       )
//     }
//     return chunks
//   }

//   fromAxes<Axis extends string | number, _Ruler extends Axis = never>(
//     parameters: Record<Axis, ReadonlyArray<number>>,
//   ): Curve<Axis> {
//     const _result = {} as Record<Axis, ReadonlyArray<AxisInput>>

//     let length: number | undefined
//     for (const [axis, axisParameters] of objectEntries(parameters)) {
//       length ??= axisParameters.length
//       invariant(
//         axisParameters.length === length,
//         `All axis inputs must have the same length, got ${axisParameters.length} for axis ${axis} (vs ${length})`,
//       )
//       const axisInputs: Array<AxisInput> = []
//       for (const [_index, axisParameter] of axisParameters.entries()) {
//         axisInputs.push({
//           value: axisParameter,
//           weight: 1 / length,
//         })
//       }
//     }
//   }

//   private normalizeParameters<
//     Axis extends string | number,
//     Ruler extends Axis = never,
//   >(
//     parameters:
//       | ReadonlyArray<Partial<Record<Axis, number | undefined>>>
//       | Record<Axis, number | ReadonlyArray<number>>,
//     ruler?: Ruler,
//   ): Record<Exclude<Axis, Ruler>, ReadonlyArray<number>> {
//     if (Array.isArray(parameters)) {
//       for (const [index, parameter] of parameters.entries()) {
//         invariant(
//           ruler === undefined || Object.hasOwn(parameter, ruler),
//           'ruler must be present on all parameters',
//         )

//         const _rulerValue =
//           ruler === undefined ? index : (parameter[ruler] as number)

//         for (const [axis, value] of Object.entries(parameter)) {
//           if (axis === ruler || value === undefined) {
//           }
//         }
//       }
//     }
//   }
// }

// function chunkPointsBy(
//   values: ReadonlyArray<number>,
//   stride: number,
// ): Array<CubicCoefficients> {
//   const chunks: Array<CubicCoefficients> = []

//   invariant(values.length >= 4, 'Values must have at least 4 elements')
//   invariant(
//     stride === 1 || stride === 2 || stride === 3,
//     'Stride must be 1, 2, or 3',
//   )
//   if (stride === 3) {
//     invariant(
//       values.length % stride === 1,
//       'Values length must be a multiple of 3 plus 1',
//     )
//   } else {
//     invariant(
//       values.length % stride === 0,
//       `Values length must be a multiple of ${stride}`,
//     )
//   }

//   for (let i = 0; i <= values.length - 4; i += stride) {
//     chunks.push([
//       values[i] as number,
//       values[i + 1] as number,
//       values[i + 2] as number,
//       values[i + 3] as number,
//     ])
//   }
//   return chunks
// }

// function replicateEndpoints(
//   values: ReadonlyArray<number>,
//   replication: number,
// ): ReadonlyArray<number> {
//   const first = values[0]
//   invariant(typeof first === 'number', 'Values must have at least one element')

//   const last = values[values.length - 1] ?? first

//   const result: Array<number> = []
//   for (let i = 0; i < replication; i++) {
//     result.push(first)
//   }
//   result.push(...values)
//   for (let i = 0; i < replication; i++) {
//     result.push(last)
//   }

//   return result
// }

// export function pointsToCoefficients(
//   matrix: Matrix4x4Internal,
//   parameters: CubicCoefficients,
// ): CubicCoefficients {
//   return [
//     parameters[0] * matrix[0][0] +
//       parameters[1] * matrix[0][1] +
//       parameters[2] * matrix[0][2] +
//       parameters[3] * matrix[0][3],
//     parameters[0] * matrix[1][0] +
//       parameters[1] * matrix[1][1] +
//       parameters[2] * matrix[1][2] +
//       parameters[3] * matrix[1][3],
//     parameters[0] * matrix[2][0] +
//       parameters[1] * matrix[2][1] +
//       parameters[2] * matrix[2][2] +
//       parameters[3] * matrix[2][3],
//     parameters[0] * matrix[3][0] +
//       parameters[1] * matrix[3][1] +
//       parameters[2] * matrix[3][2] +
//       parameters[3] * matrix[3][3],
//   ]
// }

// export const splines: Spline = {
//   matrix: [
//     [-1, 3, -3, 1],
//     [3, -6, 3, 0],
//     [-3, 3, 0, 0],
//     [1, 0, 0, 0],
//   ],
//   chunkCoefficients(parameters) {
//     const coefficients: Array<CubicCoefficients> = []
//     for (const chunk of chunkPointsBy(parameters, 3)) {
//       coefficients.push(pointsToCoefficients(this.matrix, chunk))
//     }
//     return coefficients
//   },
// }

// export const hermite: Spline = {
//   matrix: [
//     [2, 1, -2, 1],
//     [-3, -2, 3, -1],
//     [0, 1, 0, 0],
//     [1, 0, 0, 0],
//   ],
//   chunkCoefficients(parameters) {
//     const coefficients: Array<CubicCoefficients> = []
//     for (const chunk of chunkPointsBy(parameters, 2)) {
//       coefficients.push(pointsToCoefficients(this.matrix, chunk))
//     }
//     return coefficients
//   },
// }

// export const cardinal = (a: number, duplicateEndpoints = true): Spline => ({
//   matrix: [
//     [-a, 2 - a, a - 2, a],
//     [2 * a, a - 3, 3 - 2 * a, -a],
//     [-a, 0, a, 0],
//     [0, 1, 0, 0],
//   ],
//   chunkCoefficients(parameters) {
//     const coefficients: Array<CubicCoefficients> = []
//     for (const chunk of chunkPointsBy(
//       duplicateEndpoints ? replicateEndpoints(parameters, 1) : parameters,
//       1,
//     )) {
//       coefficients.push(pointsToCoefficients(this.matrix, chunk))
//     }
//     return coefficients
//   },
// })

// export const catmullRom = (duplicateEndpoints = true): Spline => ({
//   matrix: [
//     [-0.5, 1.5, -1.5, 0.5],
//     [1, -2.5, 2, -0.5],
//     [-0.5, 0, 0.5, 0],
//     [0, 1, 0, 0],
//   ],
//   chunkCoefficients(parameters) {
//     const coefficients: Array<CubicCoefficients> = []
//     for (const chunk of chunkPointsBy(
//       duplicateEndpoints ? replicateEndpoints(parameters, 1) : parameters,
//       1,
//     )) {
//       coefficients.push(pointsToCoefficients(this.matrix, chunk))
//     }
//     return coefficients
//   },
// })

// const ONE_SIXTH = 1 / 6

// export const basis = (triplicateEndpoints = true): Spline => ({
//   matrix: [
//     [-ONE_SIXTH, 0.5, -0.5, ONE_SIXTH],
//     [0.5, -1, 0.5, 0],
//     [-0.5, 0, 0.5, 0],
//     [ONE_SIXTH, 4 * ONE_SIXTH, ONE_SIXTH, 0],
//   ],
//   chunkCoefficients(parameters) {
//     const coefficients: Array<CubicCoefficients> = []
//     for (const chunk of chunkPointsBy(
//       triplicateEndpoints ? replicateEndpoints(parameters, 2) : parameters,
//       1,
//     )) {
//       coefficients.push(pointsToCoefficients(this.matrix, chunk))
//     }
//     return coefficients
//   },
// })

// export const splines = {
//   basis,
//   splines,
//   cardinal,
//   catmullRom,
//   hermite,
// } as const
