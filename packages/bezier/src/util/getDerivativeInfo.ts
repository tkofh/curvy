import { quadraticRoots } from '@squiggles/math'
import { Monotonicity } from '@squiggles/types'

interface DerivativeInfo {
  roots: number[]
  monotonicity: Monotonicity
}

export const getDerivativeInfo = (
  x0: number,
  x1: number,
  x2: number,
  x3: number
): DerivativeInfo => {
  const a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3
  const b = 6 * x0 - 12 * x1 + 6 * x2
  const c = -3 * x0 + 3 * x1

  let roots: number[] = []
  for (const root of quadraticRoots(a, b, c)) {
    if (root !== undefined && root > 0 && root < 1) {
      roots.push(root)
    }
  }

  if (roots.length > 0) {
    if (roots[0] === roots[1]) {
      roots = []
    } else {
      roots.sort((a, b) => a - b)
    }
  }

  let monotonicity!: Monotonicity
  if (roots.length > 0) {
    monotonicity = 'none'
  } else {
    const basis = c !== 0 ? c : a * 0.25 + b * 0.5 + c
    monotonicity = basis < 0 ? 'negative' : 'positive'
  }

  return {
    roots,
    monotonicity,
  }
}
