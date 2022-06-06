import { Axis, Spline, ValuedDirectedRange } from '@curvy/types'
import { remap, roundTo } from '@curvy/math'

const createSequenceArray = (length: number, start: number, step: number, precision: number) =>
  Array.from({ length }).map((_, index) => roundTo(start + step * index, precision))

export const getSplineAxisRanges = (
  spline: Spline,
  axis: Axis,
  precisionInput?: number,
  precisionOutput?: number
) => {
  const effectivePrecisionInput =
    precisionInput ?? (axis === 'X' ? spline.meta.precisionX : spline.meta.precisionY)
  const effectivePrecisionOutput =
    precisionOutput ?? (axis === 'X' ? spline.meta.precisionY : spline.meta.precisionX)

  const inputRoundedExtremaValues = spline.meta.extrema.map((extreme) =>
    roundTo(axis === 'X' ? extreme.x : extreme.y, effectivePrecisionInput)
  )
  const outputRoundedExtremaValues = spline.meta.extrema.map((extreme) =>
    roundTo(axis === 'X' ? extreme.y : extreme.x, effectivePrecisionOutput)
  )

  const solve = axis === 'X' ? spline.solveY : spline.solveX

  const ranges: ValuedDirectedRange<number>[] = []

  for (let i = 0; i < spline.meta.extrema.length - 1; i++) {
    const inputStart = inputRoundedExtremaValues[i]
    const inputEnd = inputRoundedExtremaValues[i + 1]

    const outputStart = outputRoundedExtremaValues[i]
    const outputEnd = outputRoundedExtremaValues[i + 1]

    const outputMin = Math.min(outputStart, outputEnd)
    const outputMax = Math.max(outputStart, outputEnd)

    const valueCount = Math.round(
      Math.abs(inputStart - inputEnd) * Math.pow(10, effectivePrecisionInput) + 1
    )

    const direction = inputEnd > inputStart ? 1 : inputEnd < inputStart ? -1 : 0
    const step = direction / Math.pow(10, effectivePrecisionInput)
    const values = createSequenceArray(valueCount, inputStart, step, effectivePrecisionInput)
    const thresholds = createSequenceArray(
      valueCount - 1,
      inputStart + step * 0.5,
      step,
      effectivePrecisionInput + 1
    )
    const thresholdOutputValues = thresholds.map((threshold) =>
      roundTo(solve(threshold, outputMin, outputMax)!, effectivePrecisionOutput)
    )

    ranges.push(
      ...values.map((value, index) => ({
        value,
        start: index === 0 ? outputStart : thresholdOutputValues[index - 1],
        end: index === thresholdOutputValues.length ? outputEnd : thresholdOutputValues[index],
      }))
    )
  }

  const collapsedRanges = ranges.reduce<ValuedDirectedRange<number>[]>(
    (reducedRanges, range, index, ranges) => {
      if (
        reducedRanges.length === 0 ||
        reducedRanges[reducedRanges.length - 1].value !== range.value
      ) {
        let end = range.end
        if (index < ranges.length - 1) {
          for (let i = index + 1; i < ranges.length; i++) {
            if (ranges[i].value === range.value) {
              end = ranges[i].end
            } else {
              break
            }
          }
        }
        reducedRanges.push({ ...range, end })
      }
      return reducedRanges
    },
    []
  )

  return collapsedRanges
    .reduce<ValuedDirectedRange<number>[][]>((groups, range) => {
      if (
        groups.length > 0 &&
        range.start === range.end &&
        groups[groups.length - 1][0].start === range.start &&
        groups[groups.length - 1][0].end === range.end
      ) {
        groups[groups.length - 1].push(range)
      } else {
        groups.push([range])
      }
      return groups
    }, [])
    .reduce<ValuedDirectedRange<number>[]>((ranges, group, index, groups) => {
      if (group.length === 1) {
        ranges.push(group[0])
      } else {
        ranges.push(group[Math.round(remap(index, 0, groups.length - 1, 0, group.length - 1))])
      }

      return ranges
    }, [])
}
