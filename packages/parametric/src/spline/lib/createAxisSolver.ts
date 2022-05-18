import { Axis, Spline, SplineMetadata } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'

export const createAxisSolver = (inputAxis: Axis, meta: SplineMetadata, curves: Spline[]) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = meta.bounds[`min${inputAxis}`]
  const inputMax = meta.bounds[`max${inputAxis}`]

  const defaultOutputMin = meta.bounds[`min${outputAxis}`]
  const defaultOutputMax = meta.bounds[`max${outputAxis}`]

  const precisionInput = meta[`precision${inputAxis}`]
  const precisionOutput = meta[`precision${outputAxis}`]

  const curveData = curves.map((curve) => ({
    // solve function called if the bounds check passes
    solve: curve[`solve${outputAxis}`],

    // inputMin/inputMax are the min & max value the roundedInput can be to consider this spline
    // i.e., `input` must lie within the bounds of the spline on our input axis
    inputMin: curve.meta.bounds[`min${inputAxis}`],
    inputMax: curve.meta.bounds[`max${inputAxis}`],

    // output min/max are the range that must intersect with the output min/max parameters
    // i.e., the min/max desired output must have some overlap with the possible output values of the spline
    outputMin: curve.meta.bounds[`min${outputAxis}`],
    outputMax: curve.meta.bounds[`max${outputAxis}`],
  }))

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
      for (const curve of curveData) {
        if (
          inputRounded >= curve.inputMin &&
          inputRounded <= curve.inputMax &&
          outputMin <= curve.outputMax &&
          outputMax >= curve.outputMin
        ) {
          output = curve.solve(input, outputMin, outputMax)
          if (output !== undefined) {
            break
          }
        }
      }
    }

    if (output !== undefined) {
      output = roundTo(output, precisionOutput)
    }

    cache.set(cacheKey, output)

    return output
  }
}
