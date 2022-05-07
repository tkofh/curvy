/**
 * Modulates an input value within a specified range
 *
 * @param value input value to modulate
 * @param min the minimum value in the modulation range
 * @param max the maximum value in the modulation range
 */
export const mod = (value: number, min: number, max: number) => {
  if (min === max) {
    return min
  }

  if (max < min) {
    [min, max] = [max, min]
  }

  const delta = max - min

  let result = value

  if (result < min) {
    while (result < min) {
      result += delta
    }
  } else if (result > max) {
    result = min + ((result - min) % delta)
  }

  return result
}
