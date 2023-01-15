import type { BaseAxes, CubicPoints, Matrix4x4, Precision } from '@curvy/types'
import { roundTo, solveLinearSystem } from 'micro-math'
import { normalizePrecision } from './util'

export const convertControlPoints = <TAxis extends BaseAxes>(
  sourceControlPoints: CubicPoints<TAxis>,
  sourceIdentityMatrix: Matrix4x4,
  targetIdentityMatrix: Matrix4x4,
  precision?: Precision<TAxis>
): CubicPoints<TAxis> => {
  const targetControlPoints = [{}, {}, {}, {}] as CubicPoints<TAxis>
  const axes = new Set(Object.keys(sourceControlPoints[0]) as TAxis[])
  const normalizedPrecision = normalizePrecision(precision ?? 14, axes)

  for (const axis of axes) {
    const solutions = solveLinearSystem(targetIdentityMatrix, [
      sourceControlPoints[0][axis] * sourceIdentityMatrix[0][0] +
        sourceControlPoints[1][axis] * sourceIdentityMatrix[0][1] +
        sourceControlPoints[2][axis] * sourceIdentityMatrix[0][2] +
        sourceControlPoints[3][axis] * sourceIdentityMatrix[0][3],
      sourceControlPoints[0][axis] * sourceIdentityMatrix[1][0] +
        sourceControlPoints[1][axis] * sourceIdentityMatrix[1][1] +
        sourceControlPoints[2][axis] * sourceIdentityMatrix[1][2] +
        sourceControlPoints[3][axis] * sourceIdentityMatrix[1][3],
      sourceControlPoints[0][axis] * sourceIdentityMatrix[2][0] +
        sourceControlPoints[1][axis] * sourceIdentityMatrix[2][1] +
        sourceControlPoints[2][axis] * sourceIdentityMatrix[2][2] +
        sourceControlPoints[3][axis] * sourceIdentityMatrix[2][3],
      sourceControlPoints[0][axis] * sourceIdentityMatrix[3][0] +
        sourceControlPoints[1][axis] * sourceIdentityMatrix[3][1] +
        sourceControlPoints[2][axis] * sourceIdentityMatrix[3][2] +
        sourceControlPoints[3][axis] * sourceIdentityMatrix[3][3],
    ])
    targetControlPoints[0][axis] = roundTo(solutions[0], normalizedPrecision[axis])
    targetControlPoints[1][axis] = roundTo(solutions[1], normalizedPrecision[axis])
    targetControlPoints[2][axis] = roundTo(solutions[2], normalizedPrecision[axis])
    targetControlPoints[3][axis] = roundTo(solutions[3], normalizedPrecision[axis])
  }

  return targetControlPoints
}
