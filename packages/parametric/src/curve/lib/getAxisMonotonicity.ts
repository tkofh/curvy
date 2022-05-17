import { Monotonicity } from '@curvy/types'

export const getAxisMonotonicity = (
  primeRoots: number[],
  pa: number,
  pb: number,
  pc: number
): Monotonicity => {
  let monotonicity: Monotonicity = 'none'

  if (primeRoots.length === 0) {
    const basis = pc !== 0 ? pc : pa * 0.25 + pb * 0.5

    if (basis < 0) {
      monotonicity = 'negative'
    } else if (basis > 0) {
      monotonicity = 'positive'
    }
  }

  return monotonicity
}
