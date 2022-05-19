import { remap, roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'
import { Axis, SplineMetadata } from '@curvy/types'
import { rangeIncludes, rangesOverlap } from '../../common'

export const createAxisSolver = (inputAxis: Axis, meta: SplineMetadata) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = meta.bounds[`min${inputAxis}`]
  const inputMax = meta.bounds[`max${inputAxis}`]

  const defaultOutputMin = meta.bounds[`min${outputAxis}`]
  const defaultOutputMax = meta.bounds[`max${outputAxis}`]

  const precisionInput = meta[`precision${inputAxis}`]
  const precisionOutput = meta[`precision${outputAxis}`]

  const lutResolution = meta.lut.length

  const inputLUTProp = inputAxis === 'X' ? 'x' : 'y'
  const outputLUTProp = outputAxis === 'X' ? 'x' : 'y'

  return (input: number, outputMin?: number, outputMax?: number): number | undefined => {
    const inputRounded = roundTo(input, precisionInput)

    outputMin = outputMin ?? defaultOutputMin
    outputMax = outputMax ?? defaultOutputMax

    const cacheKey = `${inputRounded}/${outputMin}|${outputMax}`

    let output: number | undefined

    if (cache.has(cacheKey)) {
      output = cache.get(cacheKey)
    } else if (inputRounded < inputMin) {
      warnDev(
        `Cannot solve curve for ${inputAxis} ${inputRounded} because curve is undefined below ${inputAxis} ${inputMin}`
      )
    } else if (inputRounded > inputMax) {
      warnDev(
        `Cannot solve curve for ${inputAxis} ${inputRounded} because curve is undefined above ${inputAxis} ${inputMin}`
      )
    } else {
      for (let i = 0; i < lutResolution - 1; i++) {
        const inputLUTStart = meta.lut[i][inputLUTProp]
        const inputLUTEnd = meta.lut[i + 1][inputLUTProp]
        const outputLUTStart = meta.lut[i][outputLUTProp]
        const outputLUTEnd = meta.lut[i + 1][outputLUTProp]

        if (
          rangesOverlap(outputLUTStart, outputLUTEnd, outputMin, outputMax) &&
          rangeIncludes(inputRounded, inputLUTStart, inputLUTEnd)
        ) {
          const x = roundTo(
            remap(input, inputLUTStart, inputLUTEnd, outputLUTStart, outputLUTEnd),
            precisionOutput
          )
          if (x >= outputMin && x <= outputMax) {
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
