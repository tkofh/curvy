import { lerp } from './lerp'
import { normalize } from './normalize'
import { roundTo } from './roundTo'

/**
 * Translates some value within a source range to some target range, by normalizing the input within the
 * source range and using the result as the scalar for a linear interpolation of the target range.
 *
 * @param value input value within the source range
 * @param sourceStart beginning of the source range
 * @param sourceEnd end of the source range
 * @param targetStart beginning of the target range
 * @param targetEnd end of the target range
 * @param clamp whether or not to prevent extrapolation outside the target range
 * @param precision an optional number of decimal places to consider for both the normalized scalar and the final result
 */
export const remap = (
  value: number,
  sourceStart: number,
  sourceEnd: number,
  targetStart: number,
  targetEnd: number,
  clamp = true,
  precision?: number
) => {
  if (sourceStart === sourceEnd) {
    throw new Error('Cannot remap a range of 0, source range start and end must be different')
  }

  if (targetStart === targetEnd) {
    return targetStart
  }

  let normalized = normalize(value, sourceStart, sourceEnd)

  if (precision !== undefined) {
    normalized = roundTo(normalized, precision)
  }

  let remapped = lerp(normalized, targetStart, targetEnd, clamp)

  if (precision !== undefined) {
    remapped = roundTo(remapped, precision)
  }

  return remapped
}
