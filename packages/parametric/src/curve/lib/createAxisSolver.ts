import { remap, roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'
import { Axis, SplineMetadata } from '@curvy/types'
import { rangeIncludes, rangesOverlap } from '../../common'
import { LUTEntry } from '../types'

export const createAxisSolver = (inputAxis: Axis, meta: SplineMetadata, lut: LUTEntry[]) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = meta.bounds[`min${inputAxis}`]
  const inputMax = meta.bounds[`max${inputAxis}`]

  const defaultOutputMin = meta.bounds[`min${outputAxis}`]
  const defaultOutputMax = meta.bounds[`max${outputAxis}`]

  const precisionInput = meta[`precision${inputAxis}`]
  const precisionOutput = meta[`precision${outputAxis}`]

  const lutSize = lut.length

  const inputLutProp = inputAxis === 'X' ? 'x' : 'y'
  const outputLutProp = outputAxis === 'X' ? 'x' : 'y'

  return (
    input: number,
    outputMin = defaultOutputMin,
    outputMax = defaultOutputMax
  ): number | undefined => {
    const inputRounded = roundTo(input, precisionInput)

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
      for (let i = 0; i < lutSize - 1; i++) {
        if (
          rangesOverlap(lut[i][outputLutProp], lut[i + 1][outputLutProp], outputMin, outputMax) &&
          rangeIncludes(inputRounded, lut[i][inputLutProp], lut[i + 1][inputLutProp])
        ) {
          const x = roundTo(
            remap(
              input,
              lut[i][inputLutProp],
              lut[i + 1][inputLutProp],
              lut[i][outputLutProp],
              lut[i + 1][outputLutProp]
            ),
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
