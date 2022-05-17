import { remap, roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'
import { Axis } from '@curvy/types'
import { Rect } from '@curvy/types/src'
import { rangeIncludes, rangesOverlap } from '../../common'

export const createAxisSolver = (
  inputAxis: Axis,
  bounds: Rect,
  precisionInput: number,
  precisionOutput: number,
  lutInput: number[],
  lutOutput: number[]
) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = bounds[`min${inputAxis}`]
  const inputMax = bounds[`max${inputAxis}`]

  const defaultOutputMin = bounds[`min${outputAxis}`]
  const defaultOutputMax = bounds[`max${outputAxis}`]

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
      for (let i = 0; i < lutInput.length - 1; i++) {
        if (
          rangesOverlap(lutOutput[i], lutOutput[i + 1], outputMin, outputMax) &&
          rangeIncludes(inputRounded, lutInput[i], lutInput[i + 1])
        ) {
          const x = roundTo(
            remap(input, lutInput[i], lutInput[i + 1], lutOutput[i], lutOutput[i + 1]),
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
