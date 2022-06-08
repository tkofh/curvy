import { Bounds, Spline } from '@curvy/types'
import { warnDev } from '@curvy/dx'

export const compareBounds = (a: Bounds, b: Bounds) =>
  a.x.min === b.x.min && a.x.max === b.x.max && a.y.min === b.y.min && a.y.max === b.y.max

export const compareSplineBounds = (basis: Spline, ...comparisons: Spline[]): boolean => {
  let result = true
  if (comparisons.length === 0) {
    warnDev('[compareSplineBounds]: No comparison Splines provided')
  } else {
    for (const spline of comparisons) {
      if (!compareBounds(basis.meta.bounds, spline.meta.bounds)) {
        result = false
        break
      }
    }
  }

  return result
}
