import { DirectedRange, Range } from '@curvy/types'
import { toRange } from './toRange'

export const rangesOverlap = (a: Range | DirectedRange, b: Range | DirectedRange) => {
  const { min: aMin, max: aMax } = toRange(a)
  const { min: bMin, max: bMax } = toRange(b)

  return bMin <= aMax && aMin <= bMax
}
