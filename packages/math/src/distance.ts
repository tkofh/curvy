/**
 * Computes the distance between two points
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 */
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  if (x1 === x2 && y1 === y2) {
    return 0
  } else if (x1 === x2) {
    return Math.abs(y2 - y1)
  } else if (y1 === y2) {
    return Math.abs(x2 - x1)
  } else {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  }
}
