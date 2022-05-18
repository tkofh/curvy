import { Monotonicity } from '@curvy/types'
import { quadraticPolynomial } from '@curvy/math'

export const getAxisMonotonicity = (
  primeRoots: number[],
  primeScalars: [number, number, number]
): Monotonicity => {
  let monotonicity: Monotonicity = 'none'

  if (primeRoots.length === 0) {
    let basis = quadraticPolynomial(0, ...primeScalars)
    if (basis === 0) {
      basis = quadraticPolynomial(0.5, ...primeScalars)
    }

    if (basis < 0) {
      monotonicity = 'negative'
    } else if (basis > 0) {
      monotonicity = 'positive'
    }
  }

  return monotonicity
}
