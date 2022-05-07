/**
 * Returns a scalar from 0 to 1 representing how far along a range the input value is.
 *
 * @param value input value to normalize
 * @param start beginning of normalization range
 * @param end end of normalization range
 */
export const normalize = (value: number, start: number, end: number) => {
  if (start - end === 0) {
    throw new Error('Cannot normalize range of 0, range start and end must be different')
  }

  const normalized = (value - start) / (end - start)

  return Object.is(normalized, -0) ? 0 : normalized
}
