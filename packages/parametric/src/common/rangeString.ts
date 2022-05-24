import { DirectedRange, Range } from '@curvy/types'
import { toRange } from './toRange'

export const rangeString = (range: Range | DirectedRange): string => {
  const { min, max } = toRange(range)
  return `[${min}, ${max}]`
}
