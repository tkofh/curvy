import { Point } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import { remap, roundTo } from '@curvy/math'
import { rangeIncludes } from '../../common'

export const createLengthSolver = (
  lutL: number[],
  lutX: number[],
  lutY: number[],
  precisionX: number,
  precisionY: number
) => {
  const cache = new Map<number, Point | undefined>()

  const inputMax = lutL[lutL.length - 1]

  return (length: number): Point | undefined => {
    let output: Point | undefined

    if (cache.has(length)) {
      output = cache.get(length)
    } else if (length < 0) {
      warnDev(`Cannot get point at length ${length} because curve is undefined below length 0`)
    } else if (length > inputMax) {
      warnDev(
        `Cannot get point at length ${length} because curve is undefined above length ${inputMax}`
      )
    } else {
      for (let i = 0; i < lutL.length - 1; i++) {
        if (length === lutL[i]) {
          output = [roundTo(lutX[i], precisionX), roundTo(lutY[i], precisionY)]
        } else if (length === lutL[i + 1]) {
          output = [roundTo(lutX[i + 1], precisionX), roundTo(lutY[i + 1], precisionY)]
        } else if (rangeIncludes(length, lutL[i], lutL[i + 1])) {
          output = [
            roundTo(remap(length, lutL[i], lutL[i + 1], lutX[i], lutX[i + 1]), precisionX),
            roundTo(remap(length, lutL[i], lutL[i + 1], lutY[i], lutY[i + 1]), precisionY),
          ]
        }

        if (output !== undefined) {
          break
        }
      }
    }

    cache.set(length, output)

    return output
  }
}
