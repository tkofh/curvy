import { remap, roundTo } from '@squiggles/math'
import { warnDev } from '@squiggles/dx'

export const createCubicBezierDimensionSolver = (
  inputMin: number,
  inputMax: number,
  defaultOutputMin: number,
  defaultOutputMax: number,
  precisionInput: number,
  precisionOutput: number,
  lutInput: number[],
  lutOutput: number[]
) => {
  const cache = new Map<string, number | undefined>()

  return (
    input: number,
    outputMin = defaultOutputMin,
    outputMax = defaultOutputMax
  ): number | undefined => {
    const inputRounded = roundTo(input, precisionInput)

    const cacheKey = `${inputRounded}/${outputMin}/${outputMax}`

    let output: number | undefined

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!
    } else if (inputRounded < inputMin) {
      warnDev(`Cannot solve curve for ${inputRounded} because curve is undefined below ${inputMin}`)
    } else if (inputRounded > inputMax) {
      warnDev(`Cannot solve curve for ${inputRounded} because curve is undefined above ${inputMax}`)
    } else {
      for (let i = 0; i < lutInput.length - 1; i++) {
        const lutInputMin = Math.min(lutInput[i], lutInput[i + 1])
        const lutInputMax = Math.max(lutInput[i], lutInput[i + 1])
        if (
          lutOutput[i] <= outputMax &&
          lutOutput[i + 1] >= outputMin &&
          lutInputMin <= input &&
          lutInputMax >= input
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
