import type { BaseAxes, ReadonlyExtreme } from '@curvy/types'

export const getExtrema = <Axis extends BaseAxes>(
  candidates: Array<ReadonlyExtreme<Axis>>,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: not dealing w this
): Array<ReadonlyExtreme<Axis>> => {
  const axes = Object.keys(candidates[0].value) as Array<Axis>
  const extrema: Array<ReadonlyExtreme<Axis>> = []

  const deduplicatedCandidates: Array<ReadonlyExtreme<Axis>> = []
  for (const candidate of candidates) {
    if (
      deduplicatedCandidates.length === 0 ||
      deduplicatedCandidates[deduplicatedCandidates.length - 1]?.t !==
        candidate.t
    ) {
      deduplicatedCandidates.push(candidate)
    } else {
      const comparison =
        deduplicatedCandidates[deduplicatedCandidates.length - 1]
      for (const axis of axes) {
        if (comparison?.value[axis] !== candidate.value[axis]) {
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
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      const previous = extrema[extrema.length - 1]!
      // biome-ignore lint/style/noNonNullAssertion: we know its there
      const next = deduplicatedCandidates[index + 1]!

      for (const axis of axes) {
        if (
          current.value[axis] <=
            Math.min(previous.value[axis], next.value[axis]) ||
          current.value[axis] >=
            Math.max(previous.value[axis], next.value[axis])
        ) {
          extrema.push(current)
          break
        }
      }
    }
  }

  return extrema
}
