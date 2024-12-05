export type Monotonicity = 'none' | 'increasing' | 'decreasing' | 'constant'
export type GuaranteedMonotonicity = 'increasing' | 'decreasing' | 'constant'

export function guaranteedMonotonicityFromComparison(
  s0: number,
  s1: number,
): GuaranteedMonotonicity {
  if (s0 < s1) {
    return 'increasing'
  }

  if (s0 > s1) {
    return 'decreasing'
  }

  return 'constant'
}
