import { roundTo } from 'micro-math'
import type { Point, NormalizedPrecision, BaseAxes } from '@curvy/types'

export const roundPoint = <TAxis extends BaseAxes>(
  point: Point<TAxis>,
  precision: NormalizedPrecision<TAxis>
): Point<TAxis> => {
  const rounded: Point<TAxis> = { ...point }
  for (const key in rounded) {
    if (Object.hasOwn(rounded, key)) {
      rounded[key] = roundTo(rounded[key], precision[key])
    }
  }

  return rounded
}
