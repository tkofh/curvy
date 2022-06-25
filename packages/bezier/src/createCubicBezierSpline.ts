import { createParametricSplineFactory } from '@curvy/parametric'

export const createCubicBezierSpline = createParametricSplineFactory([
  [-1, 3, -3, 1],
  [3, -6, 3, 0],
  [-3, 3, 0, 0],
  [1, 0, 0, 0],
])
