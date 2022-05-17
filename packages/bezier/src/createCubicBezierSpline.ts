import { createParametricSplineFactory } from '@curvy/parametric'
import { BEZIER_BASE_SCALAR_MATRIX, BEZIER_PRIME_SCALAR_MATRIX } from './constants'

export const createCubicBezierSpline = createParametricSplineFactory(
  BEZIER_BASE_SCALAR_MATRIX,
  BEZIER_PRIME_SCALAR_MATRIX
)
