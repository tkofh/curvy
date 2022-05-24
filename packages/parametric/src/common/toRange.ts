import { DirectedRange, Range } from '@curvy/types'

export const toRange = (range: Range | DirectedRange): Range =>
  'min' in range
    ? range
    : {
        min: range.start <= range.end ? range.start : range.end,
        max: range.start >= range.end ? range.start : range.end,
      }
