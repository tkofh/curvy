import type { BaseAxes, Precision, NormalizedPrecision } from '@curvy/types'

export const normalizePrecision = <TAxis extends BaseAxes>(
  precision: Precision<TAxis>,
  axes: Set<TAxis>
): NormalizedPrecision<TAxis> => {
  if (typeof precision === 'object') {
    return precision
  } else {
    const normalized = {} as NormalizedPrecision<TAxis>
    for (const axis of axes) {
      normalized[axis] = precision
    }
    return normalized
  }
}
