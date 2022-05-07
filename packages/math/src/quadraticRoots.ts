// noinspection PointlessArithmeticExpressionJS

/**
 * Gets the real roots of a quadratic equation, using either the standard or Muller's form
 *
 * each root has +0 added to it to avoid returning -0
 * @param a
 * @param b
 * @param c
 */
export const quadraticRoots = (a: number, b: number, c: number): number[] => {
  const roots: number[] = []

  // if both a and c are 0, then neither the standard nor Muller's form of the formula will work
  if (a !== 0 || c !== 0) {
    // in both forms, we need to ensure we don't take the square root of a negative number
    const determinant = b * b - 4 * a * c
    if (determinant >= 0) {
      const root = Math.sqrt(determinant)

      if (a !== 0) {
        // if a is not 0, we can use the standard form
        roots.push((-b + root) / (2 * a) + 0)
        roots.push((-b - root) / (2 * a) + 0)
      } else {
        // otherwise, we can use Muller's form
        if (b + root !== 0) {
          roots.push((-2 * c) / (b + root) + 0)
        }
        if (b - root !== 0) {
          roots.push((-2 * c) / (b - root) + 0)
        }
      }
    }
  }

  return roots
}
