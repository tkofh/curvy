import { BaseAxes, CubicPoints, Matrix4x4 } from '@curvy/types'
import { solveLinearSystem } from 'micro-math'

export const convertControlPoints = <TAxis extends BaseAxes>(
  sourceControlPoints: CubicPoints<TAxis>,
  sourceIdentityMatrix: Matrix4x4,
  targetIdentityMatrix: Matrix4x4
): CubicPoints<TAxis> => {
  const targetControlPoints = [{}, {}, {}, {}] as CubicPoints<TAxis>
  const axes = Object.keys(sourceControlPoints[0]) as TAxis[]

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
    targetControlPoints[0][axis] = solutions[0]
    targetControlPoints[1][axis] = solutions[1]
    targetControlPoints[2][axis] = solutions[2]
    targetControlPoints[3][axis] = solutions[3]
  }

  return targetControlPoints
}
