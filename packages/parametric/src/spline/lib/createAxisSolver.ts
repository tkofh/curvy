import { Axis, Rect, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'

interface CurveData {
  inputMin: number
  inputMax: number
  outputMin: number
  outputMax: number
  solve: Spline['solveX'] | Spline['solveY']
}

export const createAxisSolver = (
  inputAxis: Axis,
  bounds: Rect,
  precisionInput: number,
  precisionOutput: number,
  curves: Spline[]
) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = bounds[`min${inputAxis}`]
  const inputMax = bounds[`max${inputAxis}`]

  const defaultOutputMin = bounds[`min${outputAxis}`]
  const defaultOutputMax = bounds[`max${outputAxis}`]

  const curveData: CurveData[] = curves.map((curve) => ({
    // solve function called if the bounds check passes
    solve: curve[`solve${outputAxis}`],

    // inputMin/inputMax are the min & max value the roundedInput can be to consider this spline
    // i.e., `input` must lie within the bounds of the spline on our input axis
    inputMin: curve.boundingBox[`min${inputAxis}`],
    inputMax: curve.boundingBox[`max${inputAxis}`],

    // output min/max are the range that must intersect with the output min/max parameters
    // i.e., the min/max desired output must have some overlap with the possible output values of the spline
    outputMin: curve.boundingBox[`min${outputAxis}`],
    outputMax: curve.boundingBox[`max${outputAxis}`],
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
