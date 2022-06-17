import { remap, roundTo } from 'micro-math'
import { warnDev } from '@curvy/dx'
import { Axis, DirectedRange, Range, SplineMetadata } from '@curvy/types'
import { rangeIncludes, rangesOverlap, rangeString } from '../../common'

export const createAxisSolver = (inputAxis: Axis, meta: SplineMetadata) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputRange: Range = inputAxis === 'X' ? meta.bounds.x : meta.bounds.y
  const defaultOutputRange: Range = outputAxis === 'X' ? meta.bounds.x : meta.bounds.y

  const precisionInput = meta[`precision${inputAxis}`]
  const precisionOutput = meta[`precision${outputAxis}`]

  const lutResolution = meta.lut.length

  const inputLUTProp = inputAxis === 'X' ? 'x' : 'y'
  const outputLUTProp = outputAxis === 'X' ? 'x' : 'y'

  const lutRanges: [DirectedRange, DirectedRange][] = []
  for (let i = 0; i < lutResolution - 1; i++) {
    lutRanges.push([
      { start: meta.lut[i][inputLUTProp], end: meta.lut[i + 1][inputLUTProp] },
      { start: meta.lut[i][outputLUTProp], end: meta.lut[i + 1][outputLUTProp] },
    ])
  }

  return (input: number, outputMin?: number, outputMax?: number): number | undefined => {
    const inputRounded = roundTo(input, precisionInput)

    const outputRange: Range = {
      min: outputMin ?? defaultOutputRange.min,
      max: outputMax ?? defaultOutputRange.max,
    }

    const cacheKey = `${inputRounded}/${outputRange.min}/${outputRange.max}`

    let output: number | undefined

    if (cache.has(cacheKey)) {
      output = cache.get(cacheKey)
    } else if (!rangeIncludes(inputRounded, inputRange)) {
      warnDev(
        `Cannot solve curve for ${inputAxis} ${inputRounded} because curve is undefined outside of ${rangeString(
          inputRange
        )}`
      )
    } else {
      for (const [inputLUTRange, outputLUTRange] of lutRanges) {
        if (
          rangesOverlap(outputLUTRange, outputRange) &&
          rangeIncludes(inputRounded, inputLUTRange)
        ) {
          const x = roundTo(
            remap(
              input,
              inputLUTRange.start,
              inputLUTRange.end,
              outputLUTRange.start,
              outputLUTRange.end
            ),
            precisionOutput
          )
          if (rangeIncludes(x, outputRange)) {
            output = x
            break
          }
        }
      }
    }

    cache.set(cacheKey, output)

    return output
  }
}
