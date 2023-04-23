import type { BaseAxes, CubicPoints, Matrix4x4, Monotonicity } from '@curvy/types'
import { polynomial, quadraticRoots } from 'micro-math'
import type { QuadraticScalars } from './types'

export const computeMonotonicity = <TAxis extends BaseAxes>(
  points: CubicPoints<TAxis>,
  identityMatrix: Matrix4x4
): Monotonicity<TAxis> => {
  const axes = new Set(Object.keys(points[0]) as TAxis[])

  const monotonicity = {} as Monotonicity<TAxis>

  for (const axis of axes) {
    const primeScalars: QuadraticScalars = [
      (points[0][axis] * identityMatrix[0][0] +
        points[1][axis] * identityMatrix[0][1] +
        points[2][axis] * identityMatrix[0][2] +
        points[3][axis] * identityMatrix[0][3]) *
        3,
      (points[0][axis] * identityMatrix[1][0] +
        points[1][axis] * identityMatrix[1][1] +
        points[2][axis] * identityMatrix[1][2] +
        points[3][axis] * identityMatrix[1][3]) *
        2,
      points[0][axis] * identityMatrix[2][0] +
        points[1][axis] * identityMatrix[2][1] +
        points[2][axis] * identityMatrix[2][2] +
        points[3][axis] * identityMatrix[2][3],
    ]

    const [root1, root2] = quadraticRoots(...primeScalars)

    const hasRoots =
      root1 !== root2 &&
      ((root1 !== undefined && root1 > 0 && root1 < 1) ||
        (root2 !== undefined && root2 > 0 && root2 < 1))

    monotonicity[axis] = 'none'
    if (!hasRoots) {
      let basis = polynomial(0, primeScalars)
      if (basis === 0) {
        basis = polynomial(0.5, primeScalars)
      }

      if (basis < 0) {
        monotonicity[axis] = 'negative'
      } else if (basis > 0) {
        monotonicity[axis] = 'positive'
      }
    }
  }

  return monotonicity
}
