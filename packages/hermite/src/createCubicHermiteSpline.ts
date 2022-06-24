import { createParametricSplineFactory } from '@curvy/parametric'
import { HERMITE_BASE_SCALAR_MATRIX, HERMITE_PRIME_SCALAR_MATRIX } from './constants'

export const createCubicHermiteSpline = createParametricSplineFactory(
  HERMITE_BASE_SCALAR_MATRIX,
  HERMITE_PRIME_SCALAR_MATRIX
)
