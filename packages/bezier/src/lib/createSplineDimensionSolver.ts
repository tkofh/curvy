import { Rect, Spline } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'

interface SplineData {
  inputMin: number
  inputMax: number
  outputMin: number
  outputMax: number
  solve: Spline['solveX'] | Spline['solveY']
}

export const createSplineDimensionSolver = (
  inputAxis: 'X' | 'Y',
  boundingBox: Rect,
  precisionInput: number,
  precisionOutput: number,
  splines: Spline[]
) => {
  const outputAxis: 'X' | 'Y' = inputAxis === 'X' ? 'Y' : 'X'

  const inputMin = boundingBox[`min${inputAxis}`]
  const inputMax = boundingBox[`max${inputAxis}`]

  const defaultOutputMin = boundingBox[`min${outputAxis}`]
  const defaultOutputMax = boundingBox[`max${outputAxis}`]

  const splineData: SplineData[] = []
  for (const spline of splines) {
    splineData.push({
      // solve function called if the bounds check passes
      solve: spline[`solve${outputAxis}`],

      // inputMin/inputMax are the min & max value the roundedInput can be to consider this spline
      // i.e., `input` must lie within the bounds of the spline on our input axis
      inputMin: spline.boundingBox[`min${inputAxis}`],
      inputMax: spline.boundingBox[`max${inputAxis}`],

      // output min/max are the range that must intersect with the output min/max parameters
      // i.e., the min/max desired output must have some overlap with the possible output values of the spline
      outputMin: spline.boundingBox[`min${outputAxis}`],
      outputMax: spline.boundingBox[`max${outputAxis}`],
    })
  }

  return (
    input: number,
    outputMin = defaultOutputMin,
    outputMax = defaultOutputMax
  ): number | undefined => {
    const inputRounded = roundTo(input, precisionInput)

    let output: number | undefined

    if (inputRounded < inputMin) {
      warnDev(
        `Cannot inverse solve curve at ${inputRounded} because curve is undefined below ${inputAxis} ${inputMin}`
      )
    } else if (inputRounded > inputMax) {
      warnDev(
        `Cannot inverse solve curve at ${inputRounded} because curve is undefined above ${inputAxis} ${inputMax}`
      )
    } else {
      for (const spline of splineData) {
        if (
          inputRounded >= spline.inputMin &&
          inputRounded <= spline.inputMax &&
          outputMin <= spline.outputMax &&
          outputMax >= spline.outputMin
        ) {
          output = spline.solve(input, outputMin, outputMax)
          if (output !== undefined) {
            break
          }
        }
      }
    }

    if (output !== undefined) {
      output = roundTo(output, precisionOutput)
    }

    return output
  }
}
