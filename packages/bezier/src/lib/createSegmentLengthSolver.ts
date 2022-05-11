import { Point } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import { remap, roundTo } from '@curvy/math'

export const createSegmentLengthSolver = (
  lutLength: number[],
  lutX: number[],
  lutY: number[],
  precisionX: number,
  precisionY: number
) => {
  const cache = new Map<number, Point | undefined>()

  const segmentLength = lutLength[lutLength.length - 1]

  return (length: number): Point | undefined => {
    let output: Point | undefined

    if (cache.has(length)) {
      return cache.get(length)!
    } else if (length < 0) {
      warnDev(`Cannot get point at length ${length} because curve is undefined below length 0`)
    } else if (length > segmentLength) {
      warnDev(
        `Cannot get point at length ${length} because curve is undefined above length ${segmentLength}`
      )
    } else {
      for (let i = 0; i < lutLength.length - 1; i++) {
        if (length === lutLength[i]) {
          output = [roundTo(lutX[i], precisionX), roundTo(lutY[i], precisionY)]
          break
        } else if (length === lutLength[i + 1]) {
          output = [roundTo(lutX[i + 1], precisionX), roundTo(lutY[i + 1], precisionY)]
          break
        } else if (length > lutLength[i] && length < lutLength[i + 1]) {
          output = [
            roundTo(
              remap(length, lutLength[i], lutLength[i + 1], lutX[i], lutX[i + 1]),
              precisionX
            ),
            roundTo(
              remap(length, lutLength[i], lutLength[i + 1], lutY[i], lutY[i + 1]),
              precisionY
            ),
          ]
          break
        }
      }
    }

    cache.set(length, output)

    return output
  }
}
