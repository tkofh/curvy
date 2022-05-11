import { quadraticRoots } from '@curvy/math'
import { Monotonicity } from '@curvy/types'

interface GetSegmentComponentInfo {
  derivativeRoots: number[]
  monotonicity: Monotonicity
}

export const getSegmentComponentInfo = (
  x0: number,
  x1: number,
  x2: number,
  x3: number
): GetSegmentComponentInfo => {
  const a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3
  const b = 6 * x0 - 12 * x1 + 6 * x2
  const c = -3 * x0 + 3 * x1

  let derivativeRoots: number[] = []
  for (const root of quadraticRoots(a, b, c)) {
    if (root !== undefined && root > 0 && root < 1) {
      derivativeRoots.push(root)
    }
  }

  if (derivativeRoots.length > 0) {
    if (derivativeRoots[0] === derivativeRoots[1]) {
      derivativeRoots = []
    } else {
      derivativeRoots.sort((a, b) => a - b)
    }
  }

  let monotonicity!: Monotonicity
  if (derivativeRoots.length > 0) {
    monotonicity = 'none'
  } else {
    const basis = c !== 0 ? c : a * 0.25 + b * 0.5 + c
    monotonicity = basis < 0 ? 'negative' : 'positive'
  }

  return {
    derivativeRoots,
    monotonicity,
  }
}
