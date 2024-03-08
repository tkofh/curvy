import type { BaseAxes, NormalizedPrecision, Precision } from '@curvy/types'

export const normalizePrecision = <Axis extends BaseAxes>(
  precision: Precision<Axis>,
  axes: ReadonlySet<Axis>,
): NormalizedPrecision<Axis> => {
  if (typeof precision === 'object') {
    return precision
  }
  const normalized = {} as NormalizedPrecision<Axis>
  for (const axis of axes) {
    normalized[axis] = precision
  }
  return normalized
}
