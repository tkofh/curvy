import { DirectedRange, Range } from '@curvy/types'
import { toRange } from './toRange'

export const rangeIncludes = (value: number, range: Range | DirectedRange) => {
  const { min, max } = toRange(range)
  return min <= value && max >= value
}
