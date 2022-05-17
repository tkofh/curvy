import { ReadonlyPoint, Spline } from '@curvy/types'
import { warnDev } from '@curvy/dx'

export const createLengthSolver = (splineLength: number, curves: Spline[]) => {
  const cache = new Map<number, ReadonlyPoint | undefined>()

  return (length: number): ReadonlyPoint | undefined => {
    let output: ReadonlyPoint | undefined

    if (length < 0) {
      warnDev(`Cannot get point at length ${length} because curve is undefined below length 0`)
    } else if (length > splineLength) {
      warnDev(
        `Cannot get point at length ${length} because curve is undefined above length ${splineLength}`
      )
    } else {
      let offset = 0

      for (const curve of curves) {
        const adjustedLength = length - offset

        if (adjustedLength < curve.length) {
          output = curve.solvePointAtLength(adjustedLength)
          break
        }

        offset += curve.length
      }
    }

    cache.set(length, output)

    return output
  }
}
