import type { BaseAxes, NormalizedPrecision, Point } from '@curvy/types'
import { roundTo } from 'micro-math'

export const roundPoint = <Axis extends BaseAxes>(
  point: Point<Axis>,
  precision: NormalizedPrecision<Axis>,
): Point<Axis> => {
  const rounded: Point<Axis> = { ...point }
  for (const key in rounded) {
    if (Object.hasOwn(rounded, key)) {
      rounded[key] = roundTo(rounded[key], precision[key])
    }
  }

  return rounded
}
