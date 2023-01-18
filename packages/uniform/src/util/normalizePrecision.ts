import type { BaseAxes, NormalizedPrecision, Precision } from '@curvy/types'

export const normalizePrecision = <TAxis extends BaseAxes>(
  precision: Precision<TAxis>,
  axes: ReadonlySet<TAxis>
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
