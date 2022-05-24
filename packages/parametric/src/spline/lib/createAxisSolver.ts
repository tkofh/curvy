import { Axis, Range, Spline, SplineMetadata } from '@curvy/types'
import { roundTo } from '@curvy/math'
import { warnDev } from '@curvy/dx'
import { rangeIncludes, rangesOverlap, rangeString } from '../../common'

export const createAxisSolver = (inputAxis: Axis, meta: SplineMetadata, curves: Spline[]) => {
  const cache = new Map<string, number | undefined>()

  const outputAxis: Axis = inputAxis === 'X' ? 'Y' : 'X'

  const inputRange = inputAxis === 'X' ? meta.bounds.x : meta.bounds.y
  const defaultOutputRange = outputAxis === 'X' ? meta.bounds.x : meta.bounds.y

  const precisionInput = meta[`precision${inputAxis}`]
  const precisionOutput = meta[`precision${outputAxis}`]

  const curveData = curves.map((curve) => ({
    solve: curve[`solve${inputAxis}`],
    inputRange: inputAxis === 'X' ? curve.meta.bounds.x : curve.meta.bounds.y,
    outputRange: outputAxis === 'X' ? curve.meta.bounds.x : curve.meta.bounds.y,
  }))

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
      for (const curve of curveData) {
        if (
          rangeIncludes(inputRounded, curve.inputRange) &&
          rangesOverlap(outputRange, curve.outputRange)
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
