import type { BaseAxes, ReadonlyExtreme } from '@curvy/types'

export const getExtrema = <TAxis extends BaseAxes>(
  candidates: ReadonlyExtreme<TAxis>[]
): ReadonlyExtreme<TAxis>[] => {
  const axes = Object.keys(candidates[0].value) as TAxis[]
  const extrema: ReadonlyExtreme<TAxis>[] = []

  const deduplicatedCandidates: ReadonlyExtreme<TAxis>[] = []
  for (const candidate of candidates) {
    if (
      deduplicatedCandidates.length === 0 ||
      deduplicatedCandidates[deduplicatedCandidates.length - 1].t !== candidate.t
    ) {
      deduplicatedCandidates.push(candidate)
    } else {
      const comparison = deduplicatedCandidates[deduplicatedCandidates.length - 1]
      for (const axis of axes) {
        if (comparison.value[axis] !== candidate.value[axis]) {
          deduplicatedCandidates.push(candidate)
          break
        }
      }
    }
  }

  for (const [index, current] of deduplicatedCandidates.entries()) {
    if (index === 0 || index === deduplicatedCandidates.length - 1) {
      extrema.push(current)
    } else {
      const previous = extrema[extrema.length - 1]
      const next = deduplicatedCandidates[index + 1]

      for (const axis of axes) {
        if (
          current.value[axis] <= Math.min(previous.value[axis], next.value[axis]) ||
          current.value[axis] >= Math.max(previous.value[axis], next.value[axis])
        ) {
          extrema.push(current)
          break
        }
      }
    }
  }

  return extrema
}
