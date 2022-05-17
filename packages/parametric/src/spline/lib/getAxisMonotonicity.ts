import { Axis, Monotonicity, Spline } from '@curvy/types'

export const getAxisMonotonicity = (curves: Spline[], axis: Axis): Monotonicity => {
  let monotonicity = curves[0][`monotonicity${axis}`]
  for (const curve of curves.slice(1)) {
    if (curve[`monotonicity${axis}`] !== monotonicity) {
      monotonicity = 'none'
      break
    }
  }

  return monotonicity
}
