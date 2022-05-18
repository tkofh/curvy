import { PointObject, SplineMetadata } from '@curvy/types'
import { warnDev } from '@curvy/dx'
import { remap, roundTo } from '@curvy/math'
import { rangeIncludes } from '../../common'
import { LUTEntry } from '../types'

export const createProgressSolver = (
  dimension: 'length' | 't',
  meta: SplineMetadata,
  lut: LUTEntry[]
) => {
  const cache = new Map<number, PointObject | undefined>()

  const inputMax = lut[lut.length - 1][dimension]

  return (input: number): Readonly<PointObject> | undefined => {
    let output: PointObject | undefined

    if (cache.has(input)) {
      output = cache.get(input)
    } else if (input < 0) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined below ${dimension} 0`
      )
    } else if (input > inputMax) {
      warnDev(
        `Cannot get point at ${dimension} ${input} because curve is undefined above ${dimension} ${inputMax}`
      )
    } else {
      for (let i = 0; i < lut.length - 1; i++) {
        if (input === lut[i][dimension]) {
          output = { x: roundTo(lut[i].x, meta.precisionX), y: roundTo(lut[i].y, meta.precisionY) }
        } else if (input === lut[i + 1][dimension]) {
          output = {
            x: roundTo(lut[i + 1].x, meta.precisionX),
            y: roundTo(lut[i + 1].y, meta.precisionY),
          }
        } else if (rangeIncludes(input, lut[i][dimension], lut[i + 1][dimension])) {
          output = {
            x: roundTo(
              remap(input, lut[i][dimension], lut[i + 1][dimension], lut[i].x, lut[i + 1].x),
              meta.precisionX
            ),
            y: roundTo(
              remap(input, lut[i][dimension], lut[i + 1][dimension], lut[i].y, lut[i + 1].y),
              meta.precisionY
            ),
          }
        }

        if (output !== undefined) {
          break
        }
      }
    }

    cache.set(input, output)

    return output
  }
}
