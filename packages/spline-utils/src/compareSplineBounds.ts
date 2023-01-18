import type { BaseAxes, Bounds, CubicSpline } from '@curvy/types'
import { warnDev } from 'log-if-env'

export const compareBounds = <TAxes extends BaseAxes>(
  a: Partial<Bounds<TAxes>>,
  b: Partial<Bounds<TAxes>>,
  strict: boolean,
  axes?: ReadonlySet<TAxes>
): boolean => {
  const comparisonAxes = axes ?? new Set(Object.keys(a) as TAxes[])
  let result = true
  for (const axis of comparisonAxes) {
    if (!(axis in a && axis in b)) {
      if (strict) {
        result = false
        break
      }
    } else {
      if (a[axis]!.min == null || b[axis]!.min == null) {
        if (strict) {
          result = false
          break
        }
      } else if (a[axis]!.min !== b[axis]!.min) {
        result = false
        break
      }
      if (a[axis]!.max == null || b[axis]!.max == null) {
        if (strict) {
          result = false
          break
        }
      } else if (a[axis]!.max !== b[axis]!.max) {
        result = false
        break
      }
    }
  }

  return result
}

export const compareSplineBounds = <TAxes extends BaseAxes>(
  basis: CubicSpline<TAxes>,
  comparison: CubicSpline<TAxes> | CubicSpline<TAxes>[],
  strict = true
): boolean => {
  let result = true
  const comparisons = Array.isArray(comparison) ? comparison : [comparison]
  if (comparisons.length === 0) {
    warnDev('[compareSplineBounds]: No comparison Splines provided')
  } else {
    for (const spline of comparisons) {
      if (!compareBounds(basis.bounds, spline.bounds, strict, spline.axes)) {
        result = false
        break
      }
    }
  }

  return result
}
