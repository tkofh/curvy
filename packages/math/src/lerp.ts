import { clamp as _clamp } from './clamp'

/**
 * Perform a linear interpolation between some start and end number.
 *
 * Optionally, clamp the output to said range if the input value exceeds the [0, 1] range.
 *
 * @param value Progress from start to end. Should be normalized (Sit within the [0, 1] range)
 * @param start Beginning of the range to linearly interpolate
 * @param end End of the range to linearly interpolate
 * @param clamp Whether or not to prevent extrapolation. Defaults to true
 */
export const lerp = (value: number, start: number, end: number, clamp = true) => {
  const raw = (1 - value) * start + value * end
  return clamp ? _clamp(raw, Math.min(start, end), Math.max(start, end)) : raw
}
