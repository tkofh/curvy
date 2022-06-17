import { LUTEntry, PointObject, SplineMetadata, ValuedDirectedRange } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import { remap, roundTo } from 'micro-math'
import { rangeIncludes } from '../../common'

export const createProgressSolver = (dimension: 'length' | 't', meta: SplineMetadata) => {
  const cache = new Map<number, PointObject | undefined>()

  const inputMax = meta.lut[meta.lut.length - 1][dimension]

  const lutRanges: ValuedDirectedRange<{ start: LUTEntry; end: LUTEntry }>[] = []
  for (let i = 0; i < meta.lut.length - 1; i++) {
    lutRanges.push({
      start: meta.lut[i][dimension],
      end: meta.lut[i + 1][dimension],
      value: { start: meta.lut[i], end: meta.lut[i + 1] },
    })
  }

  return (input: number): Readonly<PointObject> | undefined => {
    let output: PointObject | undefined

    if (cache.has(input)) {
      output = cache.get(input)
    } else if (input < 0) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined below ${dimension} 0`
      )
    } else if (input > inputMax) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined above ${dimension} ${inputMax}`
      )
    } else {
      for (const lutRange of lutRanges) {
        if (rangeIncludes(input, lutRange)) {
          output = {
            x: roundTo(
              remap(
                input,
                lutRange.start,
                lutRange.end,
                lutRange.value.start.x,
                lutRange.value.end.x
              ),
              meta.precisionX
            ),
            y: roundTo(
              remap(
                input,
                lutRange.start,
                lutRange.end,
                lutRange.value.start.y,
                lutRange.value.end.y
              ),
              meta.precisionY
            ),
          }
        }

        if (output !== undefined) {
          break
        }
      }
    }

    cache.set(input, output)

    return output
  }
}
